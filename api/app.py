# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import unicodedata
import yaml
import glob
from pathlib import Path
from typing import Optional, List, Dict, Any

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Function to sanitize content and handle Unicode characters safely
def sanitize_content(content: str) -> str:
    """
    Sanitize content to handle Unicode characters that might cause encoding issues.
    This normalizes Unicode characters and ensures proper encoding.
    """
    try:
        # Normalize Unicode characters to NFKC form (canonical compatibility decomposition)
        normalized = unicodedata.normalize('NFKC', content)
        
        # Replace problematic Unicode characters with ASCII equivalents
        replacements = {
            '–': '-',  # en dash to hyphen
            '—': '-',  # em dash to hyphen
            ''': "'",  # left single quotation mark
            ''': "'",  # right single quotation mark
            '"': '"',  # left double quotation mark
            '"': '"',  # right double quotation mark
            '×': 'x',  # multiplication sign to x
            '…': '...'  # horizontal ellipsis
        }
        
        sanitized = normalized
        for unicode_char, ascii_char in replacements.items():
            sanitized = sanitized.replace(unicode_char, ascii_char)
        
        # Ensure the content can be encoded as UTF-8
        sanitized.encode('utf-8')
        
        return sanitized
    except Exception as e:
        # If sanitization fails, return a safe version
        return content.encode('ascii', errors='ignore').decode('ascii')

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-5-nano"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Sanitize input content to prevent Unicode encoding issues
        developer_message = sanitize_content(request.developer_message)
        user_message = sanitize_content(request.user_message)
        
        # Initialize OpenAI client with the provided API key
        # Use environment variable if available, otherwise use provided key
        api_key = request.api_key or os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise HTTPException(status_code=400, detail="No API key provided")
        
        try:
            client = OpenAI(
                api_key=api_key,
                timeout=30.0
            )
        except TypeError as e:
            # Fallback for compatibility issues
            print(f"OpenAI client init error: {e}")
            import openai as openai_module
            openai_module.api_key = api_key
            client = openai_module
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "developer", "content": developer_message},
                    {"role": "user", "content": user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except UnicodeEncodeError as e:
        # Handle Unicode encoding errors specifically
        raise HTTPException(
            status_code=400, 
            detail=f"Unicode encoding error: Please check your input for unsupported characters. {str(e)}"
        )
    except UnicodeDecodeError as e:
        # Handle Unicode decoding errors
        raise HTTPException(
            status_code=400, 
            detail=f"Unicode decoding error: Please check your input encoding. {str(e)}"
        )
    except Exception as e:
        # Handle any other errors that occur during processing
        error_msg = str(e)
        print(f"Error in /api/chat: {error_msg}")  # Debug logging
        import traceback
        traceback.print_exc()  # Print full stack trace
        
        # Check if the error is related to encoding issues
        if "ascii" in error_msg.lower() and "encode" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="Content contains characters that cannot be processed. Please use standard ASCII characters."
            )
        raise HTTPException(status_code=500, detail=error_msg)

# Function to read and parse .prompty files
def load_prompty_templates() -> List[Dict[str, Any]]:
    """
    Load all .prompty template files from the prompts/templates directory
    """
    templates = []
    
    # Get the path to the prompts directory relative to the API
    prompts_dir = Path(__file__).parent.parent / "prompts" / "templates"
    
    if not prompts_dir.exists():
        return templates
    
    # Find all .prompty files recursively
    for prompty_file in prompts_dir.glob("**/*.prompty"):
        try:
            with open(prompty_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split frontmatter and content
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    frontmatter = parts[1].strip()
                    template_content = parts[2].strip()
                    
                    # Parse YAML frontmatter
                    metadata = yaml.safe_load(frontmatter)
                    
                    # Add the template content and file info
                    template = {
                        **metadata,
                        'content': template_content,
                        'file_path': str(prompty_file.relative_to(prompts_dir)),
                        'category': prompty_file.parent.name,  # Get category from directory name
                        'id': prompty_file.stem  # Use filename as ID
                    }
                    
                    templates.append(template)
                    
        except Exception as e:
            print(f"Error loading template {prompty_file}: {e}")
            continue
    
    return templates

# Define endpoint to serve template files
@app.get("/api/templates")
async def get_templates():
    """
    Get all available prompt templates
    """
    try:
        templates = load_prompty_templates()
        return {
            "templates": templates,
            "count": len(templates),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load templates: {str(e)}")

# Define endpoint to get a specific template
@app.get("/api/templates/{template_id}")
async def get_template(template_id: str):
    """
    Get a specific template by ID
    """
    try:
        templates = load_prompty_templates()
        template = next((t for t in templates if t.get('id') == template_id), None)
        
        if not template:
            raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
        
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load template: {str(e)}")

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)

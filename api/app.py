# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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
import asyncio
import tempfile
import shutil

# Import aimakerspace components for RAG functionality
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.embedding import EmbeddingModel

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Global variables for RAG functionality
vector_database = None
current_pdf_name = None
embedding_model = None

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
    global vector_database, current_pdf_name
    
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
        
        # Prepare messages for the API
        messages = [{"role": "developer", "content": developer_message}]
        
        # If we have a PDF loaded, use RAG to find relevant context
        if vector_database is not None:
            try:
                # Search for relevant chunks from the PDF
                relevant_chunks = vector_database.search_by_text(
                    user_message, 
                    k=3,  # Get top 3 most relevant chunks
                    return_as_text=True
                )
                
                if relevant_chunks:
                    # Create context from relevant chunks
                    context = "\n\n".join(relevant_chunks)
                    
                    # Modify the user message to include context
                    rag_enhanced_message = f"""Based on the following context from the uploaded PDF "{current_pdf_name}":
                    
{context}

Now, please answer this question using ONLY the information provided in the context above. If the answer cannot be found in the context, please say so clearly:

{user_message}"""
                    
                    messages.append({"role": "user", "content": rag_enhanced_message})
                else:
                    # No relevant context found, use original message
                    messages.append({"role": "user", "content": user_message})
                    
            except Exception as e:
                # If RAG fails, fall back to original message
                print(f"RAG search failed: {e}")
                messages.append({"role": "user", "content": user_message})
        else:
            # No PDF loaded, use original message
            messages.append({"role": "user", "content": user_message})
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=messages,
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

# Define PDF upload endpoint for RAG functionality
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form(...)):
    """
    Upload a PDF file and process it for RAG functionality.
    The PDF will be indexed and used as context for chat responses.
    """
    global vector_database, current_pdf_name, embedding_model
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Initialize embedding model if not already done
        if embedding_model is None:
            embedding_model = EmbeddingModel()
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Load PDF content
            pdf_loader = PDFLoader(temp_file_path)
            pdf_loader.load()
            
            if not pdf_loader.documents:
                raise HTTPException(status_code=400, detail="No content could be extracted from the PDF")
            
            # Split text into chunks for better retrieval
            text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split_texts(pdf_loader.documents)
            
            # Create new vector database and populate it
            vector_database = VectorDatabase(embedding_model)
            await vector_database.abuild_from_list(chunks)
            
            # Update current PDF name
            current_pdf_name = file.filename
            
            return {
                "status": "success",
                "message": f"PDF '{file.filename}' uploaded and indexed successfully",
                "filename": file.filename,
                "chunks_created": len(chunks),
                "total_characters": sum(len(chunk) for chunk in chunks)
            }
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# Define endpoint to get current PDF status
@app.get("/api/pdf-status")
async def get_pdf_status():
    """
    Get the current PDF status and information.
    """
    global vector_database, current_pdf_name
    
    if vector_database is None:
        return {
            "status": "no_pdf",
            "message": "No PDF has been uploaded yet",
            "filename": None,
            "vector_count": 0
        }
    
    return {
        "status": "pdf_loaded",
        "message": f"PDF '{current_pdf_name}' is currently loaded",
        "filename": current_pdf_name,
        "vector_count": len(vector_database.vectors)
    }

# Define endpoint to clear current PDF
@app.post("/api/clear-pdf")
async def clear_pdf():
    """
    Clear the current PDF and reset the vector database.
    """
    global vector_database, current_pdf_name
    
    vector_database = None
    current_pdf_name = None
    
    return {
        "status": "success",
        "message": "PDF cleared successfully"
    }

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)

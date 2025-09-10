# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is an AI Vibe Check Platform - a comprehensive AI evaluation platform with advanced testing capabilities:

- **Backend** (`/api/`): FastAPI server providing streaming chat interface using OpenAI API
  - Main entry: `api/app.py`
  - Endpoints: `/api/chat` (POST) for streaming responses, `/api/health` (GET)
  - Dependencies: FastAPI, OpenAI, Pydantic, Uvicorn
  - Supports streaming responses with multiple OpenAI models (default: gpt-4o-mini)

- **Frontend** (`/frontend/`): Next.js 15 application with React 19
  - Main component: `src/components/EnhancedChatInterface.tsx` (multi-tab interface)
  - Features: Chat, System Prompt Templates, Activity #1 Testing, Analysis tabs
  - Uses Tailwind CSS v4 for styling, TypeScript configuration with ESLint

- **Testing Framework**: Built-in "vibe checking" evaluation system
  - 5 standardized test cases (`ACTIVITY_1_TESTS`) targeting different AI capabilities
  - System prompt templates for various interaction styles
  - Real-time response analysis with metrics

## Development Commands

### Backend (API)
```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies using uv
uv sync  # Install from pyproject.toml + uv.lock for reproducible builds

# Start FastAPI server  
cd api && uv run python app.py  # Runs on localhost:8000

# Alternative: Install from requirements.txt (legacy)
# uv pip install -r api/requirements.txt
```

### Frontend
```bash
cd frontend
npm install    # Install dependencies
npm run dev    # Start Next.js dev server on localhost:3000
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # Run ESLint
```

### Full Stack Deployment
```bash
npm install -g vercel  # Install Vercel CLI
vercel                 # Deploy entire application to Vercel
```

## Key Development Rules (from Cursor rules)

- Always commit changes when updating code
- Work on single features at a time
- Explain decisions thoroughly to users
- Pay attention to visual clarity and contrast in UI
- Use password-style inputs for sensitive information
- Ensure UX is pleasant with proper box sizing
- Use Next.js for frontend (optimized for Vercel deployment)
- Provide local testing instructions for UI components

## Key Features & Components

- **Multi-Tab Interface**: `EnhancedChatInterface.tsx` provides Chat, Templates, Testing, and Analysis tabs
- **Standardized Testing**: 5 test cases in `ACTIVITY_1_TESTS` covering educational, creative, analytical, and professional capabilities
- **System Prompt Templates**: Pre-built templates for Expert Teacher, Creative Writer, Analytical Thinker, Professional Communicator, and Chain-of-Thought reasoning
- **Real-time Analysis**: Word count tracking, response quality assessment, and performance metrics

## Project Structure

- Root: Python project with pyproject.toml (Python ≥3.13) + uv.lock for reproducible dependency management
- `api/app.py`: FastAPI backend with CORS enabled, streaming responses
- `frontend/src/components/`: React components including main EnhancedChatInterface
- `vercel.json`: Deployment configuration for full-stack Vercel deployment
- `.cursor/rules/`: Contains development rules for AI-assisted coding
- Legacy `requirements.txt` files: Maintained for compatibility, but uv + pyproject.toml is primary

## API Integration

The frontend integrates with the FastAPI backend through the `/api/chat` endpoint, sending:
- `developer_message`: System/developer prompts
- `user_message`: User input
- `api_key`: OpenAI API key (handled securely)
- `model`: Optional model selection

Responses are streamed in real-time from OpenAI through the FastAPI backend.
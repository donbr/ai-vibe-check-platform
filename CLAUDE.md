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
  - Features: Chat, System Prompt Templates, Advanced Prompts, Activity #1 Testing, Analysis tabs
  - Uses Tailwind CSS v4 for styling, TypeScript configuration with ESLint
  - Advanced prompt management system with template library and variable substitution

- **Prompt System**: Sophisticated prompt management infrastructure
  - Template library in `/prompts/templates/` with `.prompty` files
  - Advanced variable substitution system via `promptManager` and `templateEngine`
  - Security validation and model configuration per template
  - Categories: educational, creative, analytical, professional

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
npm run lint   # Run ESLint for code quality checks
```

### Testing & Quality
```bash
# Frontend linting (required before commits)
cd frontend && npm run lint

# No backend testing commands defined - manual testing via /api/health endpoint
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

## Architecture Deep Dive

### Frontend State Management
- Complex multi-tab state managed in `EnhancedChatInterface.tsx`
- Dual prompt systems: legacy templates + advanced prompt library
- Real-time streaming message handling with React state
- Template variable management and validation

### Advanced Prompt System
- **Template Structure**: YAML-frontmatter + content in `.prompty` files
- **Processing Pipeline**: `templateLoader` → `promptManager` → `templateEngine`
- **Features**: Variable substitution, security validation, model preferences
- **Integration**: Seamless fallback from advanced templates to legacy system

### API Architecture
- **Streaming**: Uses OpenAI's streaming API with AsyncGenerator pattern
- **CORS**: Configured for cross-origin requests (development + production)
- **Request Flow**: Frontend → FastAPI → OpenAI → Streaming response
- **Role Mapping**: `developer_message` becomes "developer" role in OpenAI API

## Key Components & Files

### Core Frontend Components
- `EnhancedChatInterface.tsx`: Main application with 5-tab interface
- `PromptLibrary.tsx`: Advanced template browser and selection
- `PromptVariableEditor.tsx`: Dynamic form for template variables
- `PromptPreview.tsx`: Template processing and preview with testing

### Backend Core
- `api/app.py`: FastAPI application with streaming chat endpoint
- Pydantic models for request validation (`ChatRequest`)
- OpenAI client initialization per request (API key from frontend)

### Prompt Management
- `frontend/src/types/prompt.ts`: TypeScript interfaces for prompt system
- `frontend/src/utils/promptManager.ts`: Template processing orchestrator
- `frontend/src/utils/templateEngine.ts`: Variable substitution engine
- `frontend/src/utils/templateLoader.ts`: Async template loading from `/prompts/`

### Testing Infrastructure
- `ACTIVITY_1_TESTS`: Hardcoded test cases in `EnhancedChatInterface.tsx`
- Each test targets specific AI capabilities (educational, creative, analytical, etc.)
- Results stored in component state with analysis tab for metrics

## Project Structure

- **Root**: Python project with pyproject.toml (Python ≥3.13) + uv.lock
- **API**: FastAPI backend in `/api/` with CORS and streaming support
- **Frontend**: Next.js app in `/frontend/` with TypeScript and Tailwind CSS v4
- **Prompts**: Template library in `/prompts/templates/` organized by category
- **Config**: Vercel deployment config, Cursor rules, ESLint configuration

## API Integration

The frontend integrates with the FastAPI backend through `/api/chat` endpoint:

**Request Format:**
```json
{
  "developer_message": "System/developer prompt",
  "user_message": "User input",
  "api_key": "OpenAI API key",
  "model": "gpt-4o-mini" // Optional, defaults to gpt-4.1-mini
}
```

**Response**: Streaming text chunks via Server-Sent Events pattern

**Key Integration Points:**
- API key passed from frontend (no server-side storage)
- Model selection controlled by frontend with template overrides
- Streaming handled via ReadableStream API in browser
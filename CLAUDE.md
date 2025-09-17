# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend Development
```bash
cd frontend
npm install        # Install dependencies
npm run dev        # Start development server on localhost:3000
npm run build      # Build for production
npm run lint       # Check code quality
npm run start      # Start production server
```

### Backend Development (Legacy Python)
```bash
uv sync                     # Install Python dependencies
cd api && uv run python app.py  # Start FastAPI server on localhost:8000
```

### Testing & Deployment
```bash
# Test MCP endpoints
curl -X POST http://localhost:3000/api/mcp/http \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'

# Deploy to Vercel
vercel
```

## Architecture

### MCP-Native Architecture
The platform has been fully migrated to Model Context Protocol (MCP) using Vercel's MCP adapter:
- **MCP Server**: `/frontend/src/app/api/mcp/[transport]/route.ts` - Supports SSE, HTTP, and stdio transports
- **Legacy Compatibility**: `/api/legacy-chat` endpoint for backwards compatibility
- **MCP Tools**: `list_templates`, `get_template`, `process_template`, `evaluate_template`, `quick_evaluate`, `run_test_case`

### Frontend Architecture
- **Main Entry**: `EnhancedChatInterface.tsx` - 6-tab interface (Chat, Templates, Advanced Prompts, Testing, Analysis, MCP Dashboard)
- **MCP Integration**: `useMcp` hook manages all MCP client operations
- **Template System**: `.prompty` files in `/prompts/templates/` auto-registered as MCP prompts

### Request Flow
1. Frontend component → `useMcp` hook → MCP client
2. HTTP/SSE transport → MCP server route
3. Vercel adapter → Tool handler → Template processing
4. Response stream → Real-time UI updates

### Test Cases (ACTIVITY_1_TESTS)
Five standardized evaluation questions in `EnhancedChatInterface.tsx`:
1. OOP Explanation - Educational capability
2. Reading Comprehension - Summarization
3. Creative Writing - 100-150 word story
4. Mathematical Reasoning - Problem solving
5. Tone Adjustment - Professional rewriting

## Key Development Rules

From Cursor rules:
- Always commit changes when updating code
- Work on single features at a time
- Explain decisions thoroughly
- Use password inputs for sensitive information
- Ensure proper visual contrast in UI
- Use Next.js for Vercel deployment

## PDF Upload & RAG Functionality

The platform includes PDF upload and RAG (Retrieval-Augmented Generation) capabilities:
- **PDF Processing**: `PDFLoader` and `CharacterTextSplitter` in `aimakerspace/text_utils.py`
- **Vector Storage**: `VectorDatabase` implementation with embedding support
- **Backend Endpoints**: Python FastAPI endpoints at `/api/upload-pdf`, `/api/pdf-status`, `/api/clear-pdf`
- **Frontend Proxy Routes**: Next.js API routes proxy to Python backend for PDF operations
- **UI**: PDF RAG tab in `EnhancedChatInterface.tsx` with upload interface
- **Production Note**: Requires `BACKEND_URL` environment variable for deployed Python backend

## Template System

### Template Structure
```yaml
---
name: template-name
version: 1.0.0
description: Template description
category: educational|creative|analytical|professional
variables:
  - name: var_name
    description: Variable description
    required: true
---
Template content with {{var_name}} placeholders
```

### MCP Auto-Registration
Each template automatically becomes an MCP prompt: `{name}-{version}`
```
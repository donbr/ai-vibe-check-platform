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
- **Main Entry**: `EnhancedChatInterface.tsx` - 6-tab interface (Chat, Templates, Advanced Prompts, Testing, Analysis, MCP Inspector)
- **MCP Inspector**: `McpInspectorDashboard.tsx` - Standards-compliant MCP Inspector with Tools, Resources, Prompts, Server Info, and Message History tabs
- **MCP Integration**: `useMcp` hook manages all MCP client operations with message history tracking
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

## MCP Inspector Usage

### Standard MCP Operations
The MCP Inspector provides full access to standard MCP protocol operations:
- **Tools Tab**: Browse and test all available MCP tools with schema validation
- **Resources Tab**: Explore MCP resources (if server supports resources/list)
- **Prompts Tab**: Access and execute MCP prompts with dynamic argument forms
- **Server Info Tab**: View server capabilities and initialization status
- **Message History Tab**: Real-time debugging with complete request/response tracking

### Testing MCP Tools
1. Navigate to MCP Inspector tab
2. Select Tools tab to see available tools
3. Click on any tool to see its schema and execute with arguments
4. Monitor results and debug via Message History tab

### Debugging MCP Communications
- All MCP requests/responses are logged in Message History
- Failed requests show error details for troubleshooting
- Request IDs allow tracking specific interactions
- Real-time updates show server connection status

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

### Key Components
- `McpInspectorDashboard.tsx`: Main MCP Inspector interface (lines 1-500+)
  - Tools browser with interactive testing capabilities
  - Resources explorer with content preview (when supported)
  - Prompts manager with argument form generation
  - Server information display
  - Real-time message history for debugging
- `useMcp.ts`: Enhanced MCP client hook (lines 1-359)
  - Standard MCP protocol operations (tools, resources, prompts)
  - Message history tracking and state management
  - Error handling and connection management
  - Real-time request/response monitoring
```
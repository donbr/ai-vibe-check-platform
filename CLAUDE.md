# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is an AI Vibe Check Platform - a comprehensive AI evaluation platform with advanced testing capabilities using **Model Context Protocol (MCP)**:

- **MCP-Native Architecture**: Fully migrated to MCP protocol using Vercel MCP adapter
  - Single Next.js 15 application with React 19 and MCP integration
  - MCP server endpoint: `/api/mcp/[transport]/route.ts` supporting SSE, HTTP, and stdio transports
  - Backwards-compatible legacy endpoint: `/api/legacy-chat` (routes to old FastAPI behavior)

- **Frontend** (`/frontend/`): Next.js 15 application with React 19 and MCP client integration
  - Main component: `src/components/EnhancedChatInterface.tsx` (5-tab interface: Chat, Templates, Advanced Prompts, Testing, Analysis, MCP Dashboard)
  - MCP Integration: `src/hooks/useMcp.ts` hook and `src/lib/mcpClient.ts` service
  - Uses Tailwind CSS v4 for styling, TypeScript throughout
  - Components: `PromptLibrary.tsx`, `PromptPreview.tsx`, `PromptVariableEditor.tsx`, `McpEvaluationDashboard.tsx`

- **MCP Prompt System**: Native MCP tools and prompts for template management
  - Template library in `/prompts/templates/` with `.prompty` files organized by category
  - MCP tools: `list_templates`, `get_template`, `process_template`, `evaluate_template`
  - Dynamic prompt registration for each template (e.g., `creative-writer-1.0.0`)
  - Variable substitution via `templateEngine` and security validation

- **Evaluation Framework**: MCP-native testing system
  - 5 standardized test cases (`ACTIVITY_1_TESTS`) in `EnhancedChatInterface.tsx`
  - MCP evaluation tools: `quick_evaluate`, `run_test_case`, `evaluate_template`
  - Real-time SSE-based evaluation with `McpEvaluationDashboard`

## Development Commands

### MCP-Enabled Frontend (Primary)
```bash
cd frontend
npm install              # Install dependencies (includes MCP SDK)
npm run dev             # Start Next.js dev server on localhost:3000
npm run build          # Build for production (with MCP server functions)
npm run start          # Start production server
npm run lint           # Run ESLint for code quality checks
```

### Legacy Backend (Deprecated - kept for reference)
The Python FastAPI backend has been replaced by MCP but remains for backwards compatibility:
```bash
# Install uv (if not already installed)  
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies using uv
uv sync  # Install from pyproject.toml + uv.lock for reproducible builds

# Start FastAPI server (legacy mode)
cd api && uv run python app.py  # Runs on localhost:8000
```

### MCP Development & Testing
```bash
# Test MCP server locally
curl -X POST http://localhost:3000/api/mcp/http \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'

# Test template loading
curl -X POST http://localhost:3000/api/mcp/http \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "list_templates"}}'
```

### Testing & Quality
```bash
# Frontend linting (required before commits)
cd frontend && npm run lint

# MCP server testing - test MCP endpoints via web interface
# No automated tests defined - use manual testing via MCP Dashboard tab
```

### Deployment
```bash
npm install -g vercel  # Install Vercel CLI
vercel                 # Deploy MCP-enabled Next.js app to Vercel
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

### MCP Integration Architecture
- **MCP Server**: Next.js API route at `/api/mcp/[transport]/route.ts` using Vercel MCP adapter
- **Transport Layer**: Supports SSE (real-time), HTTP (web), and stdio (CLI) protocols
- **Client Integration**: React hook `useMcp` abstracts MCP client for components
- **Backwards Compatibility**: `/api/legacy-chat` route mimics old FastAPI behavior

### Frontend State Management  
- **Multi-tab Interface**: Complex state in `EnhancedChatInterface.tsx` with 6 tabs
- **MCP Client State**: `useMcp` hook manages MCP connection and tool calls
- **Real-time Updates**: SSE transport enables live template evaluation and progress tracking
- **Template Variables**: Dynamic form generation in `PromptVariableEditor.tsx`

### MCP Prompt & Tool System
- **Template Structure**: YAML-frontmatter + content in `.prompty` files
- **MCP Tools**: `list_templates`, `get_template`, `process_template`, `evaluate_template`, `quick_evaluate`
- **Dynamic Prompts**: Each template auto-registered as MCP prompt (format: `{name}-{version}`)
- **Processing Pipeline**: `mcpTemplateLoader` → `templateEngine` → MCP tool execution
- **Security**: Template validation and variable sanitization in processing pipeline

### Request Flow (MCP)
- **Frontend**: Component → `useMcp` hook → MCP client → HTTP/SSE transport
- **Backend**: MCP route → Vercel adapter → Tool handler → Template processing → Response
- **Evaluation**: MCP Dashboard → SSE stream → Real-time progress updates → Results display

## Key Components & Files

### Core Frontend Components
- `EnhancedChatInterface.tsx`: Main application with 6-tab interface (includes MCP Dashboard)
- `PromptLibrary.tsx`: MCP-powered template browser with real-time loading
- `PromptVariableEditor.tsx`: Dynamic form for template variables with validation
- `PromptPreview.tsx`: Template processing and preview with MCP integration
- `McpEvaluationDashboard.tsx`: MCP-native evaluation interface with SSE updates

### MCP Integration Layer
- `frontend/src/app/api/mcp/[transport]/route.ts`: Main MCP server endpoint using Vercel adapter
- `frontend/src/app/api/legacy-chat/route.ts`: Backwards-compatible chat API (mimics FastAPI)
- `frontend/src/hooks/useMcp.ts`: React hook for MCP client operations
- `frontend/src/lib/mcpClient.ts`: MCP client service with transport abstraction

### Prompt & Template System
- `frontend/src/types/prompt.ts`: TypeScript interfaces for prompt and MCP systems
- `frontend/src/utils/promptManager.ts`: Template processing orchestrator (legacy + MCP)
- `frontend/src/utils/templateEngine.ts`: Variable substitution engine with security validation
- `frontend/src/utils/mcpTemplateLoader.ts`: File system template loader for MCP tools
- `frontend/src/utils/promptEvaluator.ts`: MCP-based evaluation logic

### Legacy Backend (Deprecated)
- `api/app.py`: FastAPI application (kept for reference, replaced by MCP)
- Template serving endpoints: `/api/templates`, `/api/templates/{id}`
- Health check: `/api/health`

### Testing Infrastructure
- `ACTIVITY_1_TESTS`: 5 hardcoded test cases in `EnhancedChatInterface.tsx`
- MCP evaluation tools for automated testing with real-time progress
- Results stored in component state with analysis and MCP dashboard tabs

## Project Structure

- **Root**: Hybrid project with `pyproject.toml` (legacy Python) + `frontend/` (primary MCP app)
- **Frontend**: Next.js 15 app with MCP server, TypeScript, Tailwind CSS v4, and React 19
- **Prompts**: Template library in `/prompts/templates/` organized by category (educational, creative, analytical, professional)
- **Legacy API**: FastAPI backend in `/api/` (deprecated, kept for backwards compatibility)
- **Config**: `vercel.json` optimized for MCP deployment, Cursor rules, ESLint configuration

## MCP Integration Points

### MCP Tools Available
- `list_templates`: Get all available prompt templates from filesystem
- `get_template`: Retrieve specific template by ID with metadata
- `process_template`: Process template with variables and return processed content
- `evaluate_template`: Full evaluation with test cases using OpenAI API
- `quick_evaluate`: Rapid template assessment without full test suite
- `run_test_case`: Execute individual test cases

### MCP Prompts (Auto-registered)
Each `.prompty` template is auto-registered as an MCP prompt:
- Format: `{template-name}-{version}` (e.g., `creative-writer-1.0.0`)
- Dynamic variables from template frontmatter
- Supports all MCP clients (Claude Code, Cline, etc.)

### Client Integration Patterns
```javascript
// Using MCP hook in React components
const { callTool, listPrompts, isConnected } = useMcp()

// List templates via MCP
const templates = await callTool('list_templates')

// Process template with variables
const result = await callTool('process_template', {
  templateId: 'helpful-assistant-1.0.0',
  variables: { user_message: 'What is AI?' }
})

// Run evaluation
const evaluation = await callTool('evaluate_template', {
  templateId: 'creative-writer-1.0.0', 
  apiKey: 'sk-...', 
  runAllTests: true
})
```

### Legacy API (Backwards Compatibility)
The `/api/legacy-chat` endpoint maintains compatibility with the original FastAPI interface:
```json
{
  "developer_message": "System/developer prompt",
  "user_message": "User input", 
  "api_key": "OpenAI API key",
  "model": "gpt-4o-mini"
}
```
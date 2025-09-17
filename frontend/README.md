# AI Vibe Check Platform - Frontend

A Next.js 15 frontend application with integrated Model Context Protocol (MCP) server for AI evaluation and prompt engineering.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (includes MCP server)
npm run dev

# Open application
open http://localhost:3000
```

## 🏗️ Architecture

### MCP-Native Design
This frontend application includes a built-in MCP server that provides:
- **MCP Tools**: Template management, evaluation, and processing
- **MCP Prompts**: Auto-registered prompts from `.prompty` templates
- **MCP Resources**: Future extensibility for content resources
- **Multi-Transport**: HTTP, SSE, and stdio transport support

### Application Structure
```
src/
├── app/
│   ├── api/mcp/[transport]/     # MCP server endpoints
│   │   └── route.ts             # Main MCP server implementation
│   ├── api/legacy-chat/         # Backwards compatibility
│   ├── globals.css              # Tailwind CSS v4 styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main application page
├── components/
│   ├── EnhancedChatInterface.tsx    # Main 6-tab interface
│   ├── McpInspectorDashboard.tsx    # Standard MCP Inspector
│   ├── PromptLibrary.tsx            # Template browser
│   ├── PromptPreview.tsx            # Template preview
│   └── PromptVariableEditor.tsx     # Dynamic form generator
├── hooks/
│   └── useMcp.ts                    # MCP client React hook
├── lib/
│   └── mcpClient.ts                 # MCP client service
├── types/
│   └── prompt.ts                    # TypeScript interfaces
└── utils/
    ├── mcpTemplateLoader.ts         # Template file system loader
    ├── templateEngine.ts            # Variable substitution
    └── promptEvaluator.ts           # MCP-based evaluation
```

## 🔧 Development

### Available Scripts

```bash
npm run dev         # Start development server with MCP server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
```

### MCP Development

#### Testing MCP Server
```bash
# Test MCP tools endpoint
curl -X POST http://localhost:3000/api/mcp/http \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test template loading
curl -X POST http://localhost:3000/api/mcp/http \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list_templates", "arguments": {}}}'
```

#### Using MCP Inspector
1. Navigate to "MCP Inspector" tab in the application
2. **Tools Tab**: Discover and test available MCP tools
3. **Resources Tab**: Browse MCP resources (when available)
4. **Prompts Tab**: Execute MCP prompts with dynamic forms
5. **Server Info Tab**: View server capabilities
6. **Message History Tab**: Debug MCP communications in real-time

### Component Development

#### Main Interface (`EnhancedChatInterface.tsx`)
6-tab interface providing:
- **Chat**: Direct AI conversation
- **Templates**: Template library browser
- **Advanced Prompts**: Prompt engineering with variables
- **Testing**: Automated evaluation suite
- **Analysis**: Response metrics and insights
- **MCP Inspector**: Standard MCP debugging interface

#### MCP Integration (`useMcp.ts` hook)
```typescript
const {
  callTool,
  listResources,
  getPrompt,
  connected,
  messageHistory
} = useMcp()

// Call MCP tool
const result = await callTool('list_templates', {})

// Get MCP prompt
const prompt = await getPrompt('creative-writer-1.0.0', {
  topic: 'space exploration'
})
```

#### Template System
Templates are stored in `/prompts/templates/` as `.prompty` files:
```yaml
---
name: creative-writer
version: 1.0.0
category: creative
description: Creative writing assistant
variables:
  - name: topic
    description: Writing topic
    required: true
---
Write a creative story about {{topic}}.
```

Auto-registered as MCP prompt: `creative-writer-1.0.0`

## 🧪 Testing

### Evaluation Framework
Built-in testing with 5 standardized test cases (`ACTIVITY_1_TESTS`):
1. **Educational**: OOP explanation capability
2. **Comprehension**: Reading and summarization
3. **Creative**: Story writing with constraints
4. **Mathematical**: Problem-solving reasoning
5. **Professional**: Tone adaptation

### MCP Tool Testing
Use the MCP Inspector to test:
- `list_templates`: Browse available templates
- `get_template`: Retrieve template details
- `process_template`: Process with variables
- `evaluate_template`: Run full evaluation suite
- `quick_evaluate`: Rapid assessment
- `run_test_case`: Individual test execution

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

The MCP server deploys as Vercel serverless functions automatically.

### Environment Variables
- Client-side API key input (no server env vars required)
- Optional: `BACKEND_URL` for legacy PDF functionality

## 🔌 MCP Compatibility

This application implements the Model Context Protocol 2025-06-18 specification:
- **Transport**: HTTP, SSE, stdio
- **Protocol**: JSON-RPC 2.0
- **Operations**: Tools, Prompts, Resources
- **Client**: Standards-compliant MCP client
- **Server**: Vercel MCP adapter integration

Compatible with all MCP clients including Claude Code, Cline, and other MCP-enabled tools.

## 📚 Technology Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **MCP**: Vercel MCP adapter
- **Build**: Turbopack (development), Webpack (production)
- **Deployment**: Vercel serverless functions

## 🔗 Related Documentation

- [Main Project README](../README.md)
- [Development Guide](../CLAUDE.md)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Next.js Documentation](https://nextjs.org/docs)
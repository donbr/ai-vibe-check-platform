# 🤖 AI Vibe Check Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/donbr/ai-vibe-check-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive AI evaluation platform featuring Model Context Protocol (MCP) integration, advanced prompt engineering techniques, and systematic "vibe checking" for LLM-powered applications.

## 🌟 Overview

The AI Vibe Check Platform provides a sophisticated testing environment for evaluating Large Language Model performance across multiple dimensions. Built with modern web technologies and Model Context Protocol (MCP) standards, it combines systematic evaluation with advanced prompt engineering techniques to help developers understand and improve their AI applications.

### Key Value Propositions
- **MCP-Native Architecture**: Full Model Context Protocol compliance with standard Inspector interface
- **Systematic Evaluation**: Structured testing with 5 standardized vibe check questions
- **Advanced Prompt Engineering**: Multiple system prompt templates and strategies
- **Real-time Analysis**: Immediate response evaluation with metrics and insights
- **Developer-Friendly**: Full-stack solution with modern tooling and deployment
- **Standard MCP Operations**: Tools, Resources, Prompts, and Server debugging capabilities

## ✨ Features

### 🧪 Enhanced Testing Suite
- **Activity #1 Evaluation**: 5 standardized questions testing different AI capabilities
  - Object-Oriented Programming explanation (Educational capability)
  - Reading comprehension and summarization
  - Creative writing with word count constraints
  - Mathematical reasoning and problem solving
  - Professional tone adaptation

### 🎯 Advanced Prompt Engineering
- **System Prompt Templates**:
  - Expert Teacher (Educational explanations)
  - Creative Writer (Narrative construction)
  - Analytical Thinker (Logical problem solving)
  - Professional Communicator (Business writing)
  - Chain-of-Thought Reasoning (Step-by-step thinking)

### 🔧 Interactive Interface
- **Multi-Tab Workflow**:
  - **Chat**: Direct AI conversation
  - **Templates**: System prompt management
  - **Advanced Prompts**: Prompt engineering with variables
  - **Testing**: Automated evaluation suite
  - **Analysis**: Response metrics and insights
  - **MCP Inspector**: Standard MCP protocol debugging and tool testing

### 📊 Real-Time Analysis
- Word count tracking and validation
- Response quality assessment
- Performance metrics visualization
- Comparative analysis across different prompts

### 🔧 MCP Inspector Features
- **Tools Browser**: Discover and test available MCP tools with schema validation
- **Resources Explorer**: Browse and inspect MCP resources with content preview
- **Prompts Manager**: Access and execute MCP prompts with dynamic argument forms
- **Server Information**: View MCP server capabilities and connection status
- **Message History**: Real-time debugging with complete request/response tracking
- **Interactive Testing**: Execute MCP operations with immediate feedback

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Next.js       │◄──►│   MCP Server    │◄──►│   OpenAI API    │
│   Frontend      │    │   (Vercel)      │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│   MCP Inspector │    │  MCP Protocol   │
│   React UI      │    │  Tools/Prompts  │
└─────────────────┘    └─────────────────┘
```

**Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS v4
**MCP Server**: Vercel MCP adapter with Next.js API routes supporting HTTP, SSE, and stdio transports
**AI Integration**: OpenAI API with multiple model support via MCP tools
**Legacy Backend**: FastAPI (deprecated, maintained for backwards compatibility)
**Deployment**: Vercel-optimized with automatic builds and MCP server functions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Python 3.10+ (optional, for legacy backend compatibility)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/donbr/ai-vibe-check-platform.git
   cd ai-vibe-check-platform
   ```

2. **Frontend Setup (Primary)**
   ```bash
   # Navigate to frontend directory
   cd frontend

   # Install dependencies
   npm install

   # Start development server (includes MCP server)
   npm run dev
   ```
   Application runs on http://localhost:3000 with integrated MCP server

3. **Legacy Backend Setup (Optional)**
   ```bash
   # Install Python dependencies
   uv sync

   # Start FastAPI server (for legacy compatibility)
   cd api && uv run python app.py
   ```
   Legacy backend runs on http://localhost:8000

4. **Configure API Key**
   - Open the application in your browser
   - Enter your OpenAI API key in the interface
   - Select your preferred model (GPT-4, GPT-4o-mini, etc.)

## 💡 Usage Guide

### Running Vibe Check Evaluations

1. **Navigate to Testing Tab**: Click "Testing"
2. **Select System Prompt**: Choose appropriate templates for different question types
3. **Run Individual Tests**: Click "Run Test" for specific questions
4. **Run Complete Suite**: Use "Run All Tests" for comprehensive evaluation
5. **Analyze Results**: Switch to "Analysis" tab for detailed metrics

### Using MCP Inspector

1. **Navigate to MCP Inspector**: Click "MCP Inspector" tab
2. **Browse Tools**: Explore available MCP tools with schema information
3. **Test Tools**: Execute MCP tools with dynamic argument forms
4. **Explore Resources**: Browse and inspect MCP resources
5. **Debug Operations**: Use Message History tab for request/response debugging
6. **Server Information**: View MCP server capabilities and connection status

### System Prompt Templates

- **Expert Teacher**: Optimized for educational explanations and concept breakdown
- **Creative Writer**: Enhanced for narrative construction and creative tasks
- **Analytical Thinker**: Systematic problem-solving with step-by-step reasoning
- **Professional Communicator**: Business-appropriate tone and formal communication

### Advanced Features

- **Chain-of-Thought**: Enable CoT prompting for complex reasoning tasks
- **Few-Shot Learning**: Add example Q&A pairs to guide AI behavior
- **Response Analysis**: Real-time metrics including word count, quality indicators, and compliance checking

## 📚 API Documentation

### MCP Endpoints (Primary)

#### `POST /api/mcp/http`
Main MCP server endpoint supporting JSON-RPC 2.0 protocol.

**Request Body:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Available Methods:**
- `tools/list`: List available MCP tools
- `tools/call`: Execute MCP tools with arguments
- `prompts/list`: List available MCP prompts
- `prompts/get`: Get prompt content with arguments
- `resources/list`: List available MCP resources
- `resources/read`: Read resource content
- `initialize`: Get server information

#### `GET /api/mcp/sse`
Server-Sent Events endpoint for real-time MCP communication.

### Legacy Endpoints (Deprecated)

#### `POST /api/legacy-chat`
Backwards-compatible chat endpoint (routes to old FastAPI behavior).

**Request Body:**
```json
{
  "developer_message": "System prompt content",
  "user_message": "User input message",
  "model": "gpt-4o-mini",
  "api_key": "your-openai-api-key"
}
```

**Response:** Streaming text response

## 🚢 Deployment

### Vercel Deployment (Recommended)

1. **One-Click Deploy**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/donbr/ai-vibe-check-platform)

2. **Manual Deployment**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy from project root
   vercel
   ```

3. **Environment Configuration**
   - The application uses client-side API key input
   - For PDF RAG functionality in production, set the `BACKEND_URL` environment variable to point to your Python backend:
     ```
     BACKEND_URL=https://your-python-backend.herokuapp.com
     ```
   - If `BACKEND_URL` is not set, PDF functionality will only work in local development

### Architecture Benefits
- **MCP-Native**: Standards-compliant Model Context Protocol implementation
- **Serverless Functions**: MCP server runs as Vercel functions
- **Edge Optimization**: Next.js frontend optimized for global CDN
- **Automatic Scaling**: Handles traffic spikes seamlessly
- **Zero Configuration**: Works out-of-the-box with provided `vercel.json`
- **Multi-Transport**: Supports HTTP, SSE, and stdio MCP transports

## 🛠️ Development

### MCP Development Workflow

#### Testing MCP Tools
```bash
# Test MCP server locally
curl -X POST http://localhost:3000/api/mcp/http \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test template loading
curl -X POST http://localhost:3000/api/mcp/http \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list_templates", "arguments": {}}}'
```

#### MCP Inspector Usage
1. Open the application at http://localhost:3000
2. Navigate to "MCP Inspector" tab
3. Use the Tools tab to discover and test available MCP tools
4. Browse Resources to explore available content
5. Test Prompts with dynamic argument forms
6. Monitor Message History for debugging MCP communications

#### Adding New MCP Tools
1. Add tool implementation to `/frontend/src/app/api/mcp/[transport]/route.ts`
2. Update tool registry in MCP server configuration
3. Test tool functionality using MCP Inspector
4. Add documentation for new tool capabilities

### Project Structure
```
├── frontend/                    # Next.js frontend with MCP server
│   ├── src/
│   │   ├── app/                # Next.js app router
│   │   │   └── api/mcp/        # MCP server endpoints
│   │   ├── components/         # React components
│   │   │   ├── EnhancedChatInterface.tsx
│   │   │   └── McpInspectorDashboard.tsx
│   │   ├── hooks/             # React hooks
│   │   │   └── useMcp.ts      # MCP client hook
│   │   └── lib/               # Utilities
│   │       └── mcpClient.ts   # MCP client service
│   └── package.json
├── prompts/                    # MCP prompt templates
│   └── templates/             # .prompty files organized by category
├── api/                       # Legacy FastAPI backend (deprecated)
│   └── app.py                # Main FastAPI application
├── vercel.json               # Deployment configuration
└── pyproject.toml           # Python dependencies (legacy)
```

### Key Components
- `EnhancedChatInterface.tsx`: Main application interface with 6-tab functionality
- `McpInspectorDashboard.tsx`: Standard MCP Inspector with Tools, Resources, Prompts debugging
- `useMcp.ts`: React hook for MCP client operations and state management
- `/api/mcp/[transport]/route.ts`: MCP server endpoint with multi-transport support
- `mcpClient.ts`: MCP client service with protocol abstraction
- `ACTIVITY_1_TESTS`: Standardized test cases with aspect identification
- `app.py`: Legacy FastAPI backend (deprecated, backwards compatibility only)

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔬 Vibe Checking Philosophy

"Vibe checking" represents a systematic approach to rapid AI evaluation that bridges the gap between formal testing and practical assessment. This platform implements structured vibe checking through:

- **Standardized Questions**: Consistent evaluation criteria across different AI capabilities
- **Aspect-Focused Testing**: Each question targets specific AI competencies
- **Prompt Engineering Integration**: Systematic comparison of different prompting strategies
- **Real-Time Analysis**: Immediate feedback on AI performance patterns

### Limitations of Vibe Checking
While powerful for rapid assessment, vibe checking has inherent limitations:
- Limited scope compared to comprehensive evaluation suites
- Subjective assessment dependent on evaluator judgment  
- Snapshot evaluation that may not capture performance variability
- No statistical significance testing

This platform acknowledges these limitations while providing a valuable tool for AI development workflows.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built upon the foundation of AI Maker Space's AI Engineer Challenge
- Enhanced with modern prompt engineering techniques and systematic evaluation
- Inspired by the need for practical AI assessment tools in development workflows

---

**Ready to evaluate your AI applications?** 🚀 Deploy the platform and start vibe checking today!
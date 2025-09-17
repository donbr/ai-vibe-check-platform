# Platform Feature Integration - Merge Instructions

## Overview
This document provides merge instructions for two key feature branches:

1. **`feature/mcp-fix`**: Fixes for MCP (Model Context Protocol) functionality
2. **`feature/pdf-upload-rag`**: PDF upload and RAG (Retrieval-Augmented Generation) capabilities

Both branches contain essential functionality that should be merged to provide a complete AI Vibe Check Platform with working MCP evaluation and PDF document processing capabilities.

## Changes Made

## Feature Branch 1: PDF Upload & RAG (`feature/pdf-upload-rag`)

### PDF Processing Infrastructure
- **Backend Implementation**: Complete FastAPI endpoints in `api/app.py`
  - `/api/upload-pdf`: PDF file upload and text extraction
  - `/api/pdf-status`: Current PDF status and vector count
  - `/api/clear-pdf`: Reset PDF context
- **Text Processing**: `aimakerspace/text_utils.py` with PDFLoader and CharacterTextSplitter
- **Vector Database**: `aimakerspace/vectordatabase.py` for semantic search
- **RAG Integration**: Chat endpoint enhanced with PDF context retrieval

### Frontend Integration
- **Proxy Routes**: Next.js API routes forward PDF operations to Python backend
  - `frontend/src/app/api/upload-pdf/route.ts`
  - `frontend/src/app/api/pdf-status/route.ts`
  - `frontend/src/app/api/clear-pdf/route.ts`
- **UI Components**: PDF RAG tab in `EnhancedChatInterface.tsx`
- **Production Ready**: BACKEND_URL environment variable support

### Key Dependencies
- `PyPDF2`: PDF text extraction
- `aimakerspace`: Custom RAG components
- Vector embeddings via OpenAI embedding models

## Feature Branch 2: MCP Functionality Fix (`feature/mcp-fix`)

### 1. Fixed useMcp Hook (`frontend/src/hooks/useMcp.ts`)
- **Problem**: The hook was making direct HTTP calls to `/api/mcp/http` which doesn't exist
- **Solution**: Updated to use proper MCP protocol headers and structure
- **Key Changes**:
  - Added proper MCP protocol headers (`Accept`, `MCP-Protocol-Version`)
  - Updated all HTTP calls to use the correct MCP JSON-RPC format
  - Removed problematic MCP SDK imports that were causing frontend crashes
  - Simplified the connection logic to work with the existing MCP server setup

### 2. Frontend Loading Issues
- **Problem**: Frontend was crashing with "Element type is invalid" errors
- **Solution**: Fixed import paths and removed incompatible MCP SDK imports
- **Result**: Frontend now loads successfully and MCP Evaluation dashboard renders

## Current Status

### ✅ PDF Upload & RAG (`feature/pdf-upload-rag`):
- Complete backend implementation with FastAPI
- PDF text extraction and chunking working
- Vector database and semantic search functional
- RAG-enhanced chat responses operational
- Frontend proxy routes implemented
- Production deployment support ready

### ✅ MCP Fixes (`feature/mcp-fix`):
- Frontend loads without errors
- MCP Evaluation dashboard renders properly
- Template loading system works (using fallback templates)
- All UI components are functional

### ❌ Still Needs Work (MCP):
- MCP server HTTP endpoint (`/api/mcp/http` returns 404)
- Actual MCP tool calls fail due to endpoint configuration
- MCP server communication is not established

### 🔍 Root Cause (MCP):
The MCP route is configured as `/api/mcp/[transport]` but the hook is calling `/api/mcp/http` directly. The transport parameter handling needs to be fixed in the MCP server configuration.

## Merge Instructions

### Sequential Merge Strategy (Recommended)

Since both branches contain complementary functionality, they should be merged in sequence:

#### Step 1: Merge PDF Upload & RAG Branch
1. **Create PR for PDF functionality:**
   ```bash
   git checkout feature/pdf-upload-rag
   git push origin feature/pdf-upload-rag
   ```

2. **Create Pull Request:**
   - Title: "Add PDF upload and RAG functionality"
   - Description: Complete PDF processing pipeline with backend and frontend integration
   - Merge to `main` when approved

#### Step 2: Merge MCP Fix Branch
1. **Rebase MCP fixes on updated main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/mcp-fix
   git rebase main
   ```

2. **Create PR for MCP fixes:**
   ```bash
   git push origin feature/mcp-fix --force-with-lease
   ```

3. **Create Pull Request:**
   - Title: "Fix MCP functionality and frontend loading issues"
   - Description: Include the changes made and current status
   - Merge to `main` when approved

### Alternative: Direct Merge via GitHub CLI

If using GitHub CLI, merge both branches sequentially:

#### PDF Branch First:
```bash
# Switch to and push PDF branch
git checkout feature/pdf-upload-rag
git push origin feature/pdf-upload-rag

# Create and merge PDF PR
gh pr create --title "Add PDF upload and RAG functionality" \
  --body "Complete PDF processing pipeline with backend and frontend integration.

## Features Added:
- PDF text extraction and chunking (PyPDF2, CharacterTextSplitter)
- Vector database integration for semantic search
- RAG-enhanced chat responses using PDF context
- Frontend proxy routes for production deployment
- FastAPI endpoints: upload-pdf, pdf-status, clear-pdf

## Production Ready:
- BACKEND_URL environment variable support
- Error handling and user feedback
- Memory management for large PDFs"

gh pr merge --squash
```

#### MCP Branch Second:
```bash
# Rebase MCP branch on updated main
git checkout main && git pull origin main
git checkout feature/mcp-fix && git rebase main
git push origin feature/mcp-fix --force-with-lease

# Create and merge MCP PR
gh pr create --title "Fix MCP functionality and frontend loading issues" \
  --body "Fixes MCP functionality issues causing frontend crashes and 404 errors.

## Changes Made:
- Fixed useMcp hook to use proper MCP protocol headers
- Resolved frontend loading errors caused by MCP SDK imports
- Updated MCP evaluation dashboard to render properly
- Maintained template loading functionality with fallback system

## Status:
- ✅ Frontend loads successfully
- ✅ MCP Evaluation dashboard renders
- ❌ MCP server HTTP endpoint still needs configuration fix"

gh pr merge --squash
```

## Testing After Merge

### 1. PDF Upload & RAG Testing
```bash
# Start backend server
cd api && uv run python app.py  # Port 8000

# Start frontend in another terminal
cd frontend && npm run dev      # Port 3000
```

**Test Steps:**
1. Visit http://localhost:3000
2. Click "PDF RAG" tab
3. Upload a PDF file with text content
4. Verify successful upload message
5. Ask questions about the PDF content
6. Verify RAG-enhanced responses with PDF context

### 2. MCP Functionality Testing
**Test Steps:**
1. Click "MCP Evaluation" tab
2. Verify it renders without "MCP Error: HTTP 404: Not Found"
3. Check that template loading works (should show fallback templates)
4. Test all other UI tabs load without errors

### 3. Production Deployment Testing
```bash
# Test with environment variables
export BACKEND_URL=https://your-backend-domain.com
cd frontend && npm run build && npm run start
```

### 4. Next Steps for Complete MCP Functionality
- Fix MCP route configuration in `/api/mcp/[transport]/route.ts`
- Configure MCP server to properly handle HTTP transport
- Test actual MCP tool calls end-to-end

## Files Modified

### PDF Upload & RAG Branch (`feature/pdf-upload-rag`)
#### Backend Files:
- `api/app.py` - Enhanced with PDF upload endpoints and RAG integration
- `aimakerspace/text_utils.py` - PDFLoader and CharacterTextSplitter implementations
- `aimakerspace/vectordatabase.py` - Vector database for semantic search
- `aimakerspace/openai_utils/embedding.py` - Embedding model integration

#### Frontend Files:
- `frontend/src/app/api/upload-pdf/route.ts` - PDF upload proxy route
- `frontend/src/app/api/pdf-status/route.ts` - PDF status proxy route
- `frontend/src/app/api/clear-pdf/route.ts` - PDF clear proxy route
- `frontend/src/components/EnhancedChatInterface.tsx` - PDF RAG tab implementation

### MCP Fix Branch (`feature/mcp-fix`)
- `frontend/src/hooks/useMcp.ts` - Fixed MCP hook implementation
- `MERGE.md` - Updated merge documentation

## Dependencies

### PDF Branch Dependencies:
- `PyPDF2` - PDF text extraction
- `aimakerspace` - Custom RAG components
- OpenAI embedding models for vector operations

### MCP Branch Dependencies:
No new dependencies added. Existing MCP packages installed but not used in browser due to compatibility issues.

## Notes
- **PDF functionality**: Complete and production-ready with full RAG pipeline
- **MCP functionality**: Partially working - UI renders but server communication needs configuration
- Both features are complementary and enhance the platform's AI capabilities
- Sequential merge recommended to avoid conflicts and ensure proper testing

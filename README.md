# 🤖 AI Vibe Check Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/donbr/ai-vibe-check-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive AI evaluation platform featuring advanced prompt engineering techniques and systematic "vibe checking" for LLM-powered applications.

## 🌟 Overview

The AI Vibe Check Platform provides a sophisticated testing environment for evaluating Large Language Model performance across multiple dimensions. Built with modern web technologies, it combines systematic evaluation with advanced prompt engineering techniques to help developers understand and improve their AI applications.

### Key Value Propositions
- **Systematic Evaluation**: Structured testing with 5 standardized vibe check questions
- **Advanced Prompt Engineering**: Multiple system prompt templates and strategies  
- **Real-time Analysis**: Immediate response evaluation with metrics and insights
- **Developer-Friendly**: Full-stack solution with modern tooling and deployment

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
  - **Testing**: Automated evaluation suite
  - **Analysis**: Response metrics and insights

### 📊 Real-Time Analysis
- Word count tracking and validation
- Response quality assessment
- Performance metrics visualization
- Comparative analysis across different prompts

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Next.js       │◄──►│   FastAPI       │◄──►│   OpenAI API    │
│   Frontend      │    │   Backend       │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │  Streaming      │
│   Components    │    │  Responses      │
└─────────────────┘    └─────────────────┘
```

**Frontend**: Next.js 15.3.4 with React 19, TypeScript, and Tailwind CSS
**Backend**: FastAPI with streaming responses and CORS support
**AI Integration**: OpenAI API with multiple model support
**Deployment**: Vercel-optimized with automatic builds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- OpenAI API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/donbr/ai-vibe-check-platform.git
   cd ai-vibe-check-platform
   ```

2. **Backend Setup**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Start FastAPI server
   python api/app.py
   ```
   Backend runs on http://localhost:8000

3. **Frontend Setup**
   ```bash
   # Navigate to frontend directory
   cd frontend
   
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```
   Frontend runs on http://localhost:3000

4. **Configure API Key**
   - Open the application in your browser
   - Enter your OpenAI API key in the interface
   - Select your preferred model (GPT-4, GPT-4o-mini, etc.)

## 💡 Usage Guide

### Running Vibe Check Evaluations

1. **Navigate to Testing Tab**: Click "Activity #1 Testing"
2. **Select System Prompt**: Choose appropriate templates for different question types
3. **Run Individual Tests**: Click "Run Test" for specific questions
4. **Run Complete Suite**: Use "Run All Tests" for comprehensive evaluation
5. **Analyze Results**: Switch to "Analysis" tab for detailed metrics

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

### Endpoints

#### `POST /api/chat`
Streaming chat completion with OpenAI integration.

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

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

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
   - No server-side environment variables required
   - Vercel automatically handles the full-stack deployment

### Architecture Benefits
- **Serverless Functions**: FastAPI backend runs as Vercel functions
- **Edge Optimization**: Next.js frontend optimized for global CDN
- **Automatic Scaling**: Handles traffic spikes seamlessly
- **Zero Configuration**: Works out-of-the-box with provided `vercel.json`

## 🛠️ Development

### Project Structure
```
├── api/                 # FastAPI backend
│   └── app.py          # Main FastAPI application
├── frontend/           # Next.js frontend
│   ├── src/
│   │   ├── app/        # Next.js app router
│   │   └── components/ # React components
│   └── package.json
├── vercel.json         # Deployment configuration
└── requirements.txt    # Python dependencies
```

### Key Components
- `EnhancedChatInterface.tsx`: Main application interface with multi-tab functionality
- `app.py`: FastAPI backend with streaming chat endpoint
- `ACTIVITY_1_TESTS`: Standardized test cases with aspect identification

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
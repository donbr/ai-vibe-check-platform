'use client'

import { useState, useRef, useEffect } from 'react'
import { PromptTemplate, ProcessedPrompt } from '../types/prompt'
import { useMcp } from '../hooks/useMcp'
import PromptLibrary from './PromptLibrary'
import PromptVariableEditor from './PromptVariableEditor'
import PromptPreview from './PromptPreview'
import McpEvaluationDashboard from './McpEvaluationDashboard'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  testCase?: string
}

interface TestCase {
  id: string
  name: string
  question: string
  aspectTested: string
  systemPrompt?: string
}

interface SystemPromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
  category: 'educational' | 'creative' | 'analytical' | 'professional' | 'custom'
}

const ACTIVITY_1_TESTS: TestCase[] = [
  {
    id: 'oop-explanation',
    name: 'OOP Explanation',
    question: 'Explain the concept of object-oriented programming in simple terms to a complete beginner.',
    aspectTested: 'Educational/Teaching Capability, Complex Concept Simplification',
    systemPrompt: 'You are an expert programming instructor who excels at explaining complex concepts in simple, beginner-friendly terms.'
  },
  {
    id: 'reading-comprehension',
    name: 'Reading Comprehension',
    question: 'Read the following paragraph and provide a concise summary of the key points: [Paragraph would be inserted here]',
    aspectTested: 'Reading Comprehension, Information Extraction, Summarization',
    systemPrompt: 'You are skilled at analyzing text and extracting key information to create clear, concise summaries.'
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing',
    question: 'Write a short, imaginative story (100-150 words) about a robot finding friendship in an unexpected place.',
    aspectTested: 'Creative Writing, Narrative Construction, Word Count Control',
    systemPrompt: 'You are a creative writer who crafts engaging, imaginative stories with precise word count control.'
  },
  {
    id: 'mathematical-reasoning',
    name: 'Math Problem',
    question: 'If a store sells apples in packs of 4 and oranges in packs of 3, how many packs of each do I need to buy to get exactly 12 apples and 9 oranges?',
    aspectTested: 'Mathematical Reasoning, Logical Problem Solving',
    systemPrompt: 'You are a mathematics tutor who provides clear, step-by-step solutions to mathematical problems.'
  },
  {
    id: 'tone-rewriting',
    name: 'Tone Adjustment',
    question: 'Rewrite the following paragraph in a professional, formal tone: [Paragraph would be inserted here]',
    aspectTested: 'Style Adaptation, Tone Control, Professional Communication',
    systemPrompt: 'You are an expert in professional communication who can adapt writing style and tone for different contexts.'
  }
]

const SYSTEM_PROMPT_TEMPLATES: SystemPromptTemplate[] = [
  {
    id: 'helpful-assistant',
    name: 'Helpful Assistant',
    description: 'General purpose helpful AI assistant',
    prompt: 'You are a helpful AI assistant.',
    category: 'professional'
  },
  {
    id: 'teacher',
    name: 'Expert Teacher',
    description: 'Excellent at explaining complex concepts simply',
    prompt: 'You are an expert teacher who excels at breaking down complex concepts into simple, understandable explanations. Use analogies, examples, and step-by-step reasoning.',
    category: 'educational'
  },
  {
    id: 'creative-writer',
    name: 'Creative Writer',
    description: 'Imaginative storyteller and creative content creator',
    prompt: 'You are a creative writer with a vivid imagination. You craft engaging stories, use rich descriptions, and create compelling narratives.',
    category: 'creative'
  },
  {
    id: 'analytical-thinker',
    name: 'Analytical Thinker',
    description: 'Logical, systematic problem solver',
    prompt: 'You are an analytical thinker who approaches problems systematically. Break down complex issues, think step by step, and provide logical reasoning.',
    category: 'analytical'
  },
  {
    id: 'professional-communicator',
    name: 'Professional Communicator',
    description: 'Formal, business-appropriate communication style',
    prompt: 'You are a professional communicator who uses formal, business-appropriate language. Be concise, clear, and maintain a professional tone.',
    category: 'professional'
  },
  {
    id: 'chain-of-thought',
    name: 'Chain of Thought',
    description: 'Uses step-by-step reasoning for complex problems',
    prompt: 'You are a careful thinker who works through problems step by step. Always explain your reasoning process and think through each step before reaching conclusions. When faced with complex problems, break them down into smaller parts and work through each part systematically.',
    category: 'analytical'
  },
  {
    id: 'socratic-teacher',
    name: 'Socratic Teacher',
    description: 'Guides learning through questioning',
    prompt: 'You are a Socratic teacher who helps students learn by asking guiding questions rather than giving direct answers. Help them discover solutions through thoughtful questioning.',
    category: 'educational'
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Thorough analysis and evidence-based reasoning',
    prompt: 'You are a research assistant who provides thorough, evidence-based analysis. Consider multiple perspectives, cite relevant information when possible, and present balanced viewpoints.',
    category: 'analytical'
  }
]

const CHAIN_OF_THOUGHT_PROMPTS = [
  "Let's think step by step.",
  "Let me work through this systematically.",
  "I'll break this down into parts and analyze each one.",
  "Let me think about this carefully and show my reasoning.",
  "I'll approach this methodically, step by step."
]

const MODELS = [
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: 'Latest nano model - fast and efficient' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Latest mini model - balanced performance' },
  { id: 'gpt-5', name: 'GPT-5', description: 'Most capable GPT-5 model' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-effective' }
]

export default function EnhancedChatInterface() {
  // MCP Integration
  const mcp = useMcp()
  
  const [activeTab, setActiveTab] = useState<'chat' | 'templates' | 'advanced-prompts' | 'testing' | 'analysis' | 'mcp-evaluation' | 'pdf-rag'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt-5-nano')
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [testResults, setTestResults] = useState<{[key: string]: Message[]}>({})
  const [fewShotExamples, setFewShotExamples] = useState<{question: string, answer: string}[]>([])
  const [enableChainOfThought, setEnableChainOfThought] = useState(false)
  const [selectedCoTPrompt, setSelectedCoTPrompt] = useState(CHAIN_OF_THOUGHT_PROMPTS[0])
  
  // New prompt management state
  const [selectedAdvancedTemplate, setSelectedAdvancedTemplate] = useState<PromptTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, unknown>>({})
  const [templateLibraryLoaded, setTemplateLibraryLoaded] = useState(false)
  const [advancedPromptSubTab, setAdvancedPromptSubTab] = useState<'library' | 'variables' | 'preview'>('library')
  
  // PDF RAG state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfStatus, setPdfStatus] = useState<{status: string, filename?: string, vector_count?: number} | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Template loading status from MCP
  useEffect(() => {
    if (mcp.connected && !mcp.loading) {
      setTemplateLibraryLoaded(true)
    }
  }, [mcp.connected, mcp.loading])

  // Load PDF status on component mount
  useEffect(() => {
    loadPdfStatus()
  }, [])

  const loadPdfStatus = async () => {
    try {
      const response = await fetch('/api/pdf-status')
      if (response.ok) {
        const status = await response.json()
        setPdfStatus(status)
      }
    } catch (error) {
      console.error('Error loading PDF status:', error)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
    } else {
      alert('Please select a PDF file')
    }
  }

  const uploadPdf = async () => {
    if (!pdfFile || !apiKey) {
      alert('Please select a PDF file and enter your API key')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      formData.append('api_key', apiKey)

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setPdfStatus({
          status: 'pdf_loaded',
          filename: result.filename,
          vector_count: result.chunks_created
        })
        alert(`PDF uploaded successfully! Created ${result.chunks_created} chunks.`)
      } else {
        const error = await response.json()
        alert(`Error uploading PDF: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error uploading PDF:', error)
      alert('Error uploading PDF')
    } finally {
      setIsUploading(false)
    }
  }

  const clearPdf = async () => {
    try {
      const response = await fetch('/api/clear-pdf', {
        method: 'POST',
      })

      if (response.ok) {
        setPdfStatus({ status: 'no_pdf' })
        setPdfFile(null)
        alert('PDF cleared successfully')
      } else {
        alert('Error clearing PDF')
      }
    } catch (error) {
      console.error('Error clearing PDF:', error)
      alert('Error clearing PDF')
    }
  }

  const sendMessage = async (customMessage?: string, customSystemPrompt?: string, testCaseId?: string) => {
    let messageToSend = customMessage || input.trim()
    if (!messageToSend || !apiKey || isStreaming) return

    // Add chain-of-thought prompt if enabled
    if (enableChainOfThought && !customMessage) {
      messageToSend += `\n\n${selectedCoTPrompt}`
    }

    // Use advanced template if selected, otherwise fall back to legacy system
    let effectiveSystemPrompt = customSystemPrompt || systemPrompt
    if (selectedAdvancedTemplate && !customSystemPrompt && mcp.connected) {
      try {
        const templateId = `${selectedAdvancedTemplate.name}-${selectedAdvancedTemplate.version}`
        const processResult = await mcp.processTemplate(templateId, templateVariables)
        
        if (processResult.content && Array.isArray(processResult.content) && processResult.content.length > 0) {
          const processedData = JSON.parse(processResult.content[0].text)
          
          if (processedData.missing_variables?.length === 0 && processedData.security_violations?.length === 0) {
            effectiveSystemPrompt = processedData.content
            // Update model settings if specified in template
            if (processedData.model_config?.preferred && processedData.model_config.preferred !== selectedModel) {
              setSelectedModel(processedData.model_config.preferred)
            }
          } else {
            console.warn('Advanced template has issues, falling back to basic prompt:', {
              missing: processedData.missing_variables,
              violations: processedData.security_violations
            })
          }
        }
      } catch (error) {
        console.error('Error processing advanced template via MCP:', error)
      }
    }
    
    if (!customMessage) setInput('')
    
    const newUserMessage: Message = { 
      role: 'user', 
      content: messageToSend,
      timestamp: new Date(),
      testCase: testCaseId
    }
    
    setMessages(prev => [...prev, newUserMessage])
    setIsStreaming(true)

    try {
      // Build messages array with few-shot examples if any
      const messagesForAPI: {role: string, content: string}[] = []
      
      // Add few-shot examples
      fewShotExamples.forEach(example => {
        messagesForAPI.push({ role: 'user', content: example.question })
        messagesForAPI.push({ role: 'assistant', content: example.answer })
      })
      
      // Add current user message
      messagesForAPI.push({ role: 'user', content: messageToSend })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: effectiveSystemPrompt,
          user_message: messageToSend,
          model: selectedModel,
          api_key: apiKey,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      const newAssistantMessage: Message = { 
        role: 'assistant', 
        content: '',
        timestamp: new Date(),
        testCase: testCaseId
      }
      
      setMessages(prev => [...prev, newAssistantMessage])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        
        // Parse Server-Sent Events format
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6) // Remove 'data: ' prefix
              if (jsonStr.trim() === '[DONE]') continue
              
              const data = JSON.parse(jsonStr)
              if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                assistantMessage += data.choices[0].delta.content
              }
            } catch (e) {
              // If parsing fails, treat as plain text (fallback)
              if (line.trim() && !line.startsWith('data: ')) {
                assistantMessage += line
              }
            }
          }
        }

        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].content = assistantMessage
          return newMessages
        })
      }

      // Store test results if this was a test case
      if (testCaseId) {
        setTestResults(prev => ({
          ...prev,
          [testCaseId]: [newUserMessage, { ...newAssistantMessage, content: assistantMessage }]
        }))
      }

    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, an error occurred while processing your request.',
        timestamp: new Date()
      }])
    } finally {
      setIsStreaming(false)
    }
  }

  const runTestCase = (testCase: TestCase) => {
    sendMessage(testCase.question, testCase.systemPrompt, testCase.id)
  }

  const clearChat = () => {
    setMessages([])
  }

  const applyTemplate = (template: SystemPromptTemplate) => {
    setSystemPrompt(template.prompt)
    setSelectedTemplate(template.id)
  }

  const addFewShotExample = () => {
    setFewShotExamples(prev => [...prev, { question: '', answer: '' }])
  }

  const updateFewShotExample = (index: number, field: 'question' | 'answer', value: string) => {
    setFewShotExamples(prev => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  const removeFewShotExample = (index: number) => {
    setFewShotExamples(prev => prev.filter((_, i) => i !== index))
  }

  // Advanced prompt handlers
  const handleSelectAdvancedTemplate = (template: PromptTemplate) => {
    setSelectedAdvancedTemplate(template)
    setTemplateVariables(template.sample || {})
    setAdvancedPromptSubTab('variables')
  }

  const handleTestAdvancedPrompt = (processedPrompt: ProcessedPrompt) => {
    // Switch to chat tab and use the processed prompt
    setSystemPrompt(processedPrompt.content)
    setActiveTab('chat')
    // Clear any legacy template selection
    setSelectedTemplate('')
  }

  const TabButton = ({ label, isActive, onClick }: {
    label: string
    isActive: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
        isActive
          ? 'bg-blue-500 text-white border-b-2 border-blue-500'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      {/* Tab Navigation */}
      <div className="flex space-x-1 p-4 border-b border-gray-200 dark:border-gray-700">
        <TabButton label="Chat" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
        <TabButton label="Templates" isActive={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
        <TabButton label="Advanced Prompts" isActive={activeTab === 'advanced-prompts'} onClick={() => setActiveTab('advanced-prompts')} />
        <TabButton label="PDF RAG" isActive={activeTab === 'pdf-rag'} onClick={() => setActiveTab('pdf-rag')} />
        <TabButton label="Activity #1 Testing" isActive={activeTab === 'testing'} onClick={() => setActiveTab('testing')} />
        <TabButton label="Analysis" isActive={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} />
        <TabButton 
          label="MCP Evaluation" 
          isActive={activeTab === 'mcp-evaluation'} 
          onClick={() => setActiveTab('mcp-evaluation')} 
        />
      </div>

      <div className="p-6">
        {/* Configuration Section */}
        <div className="mb-6 space-y-4">
          {/* API Key */}
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OpenAI API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="sk-..."
            />
          </div>

          {/* Model Selection */}
          <div>
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {/* PDF RAG Status Indicator */}
            {pdfStatus?.status === 'pdf_loaded' && (
              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      PDF RAG Active: {pdfStatus.filename}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      AI will use this PDF as context for answering questions
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* System Prompt */}
            <div>
              <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System Prompt
              </label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            </div>

            {/* Few-Shot Examples */}
            {fewShotExamples.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Few-Shot Examples
                  </label>
                  <button
                    onClick={addFewShotExample}
                    className="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Add Example
                  </button>
                </div>
                {fewShotExamples.map((example, index) => (
                  <div key={index} className="border border-gray-300 rounded p-3 mb-2 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Example {index + 1}</span>
                      <button
                        onClick={() => removeFewShotExample(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Question/Input"
                      value={example.question}
                      onChange={(e) => updateFewShotExample(index, 'question', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded mb-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <textarea
                      placeholder="Expected Answer/Output"
                      value={example.answer}
                      onChange={(e) => updateFewShotExample(index, 'answer', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            )}

            {fewShotExamples.length === 0 && (
              <div>
                <button
                  onClick={addFewShotExample}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Add Few-Shot Example
                </button>
              </div>
            )}

            {/* Chain-of-Thought Controls */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chain-of-Thought Prompting
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enableChainOfThought}
                    onChange={(e) => setEnableChainOfThought(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    enableChainOfThought ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      enableChainOfThought ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {enableChainOfThought ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
              
              {enableChainOfThought && (
                <div>
                  <label htmlFor="cot-prompt" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    CoT Prompt to append:
                  </label>
                  <select
                    id="cot-prompt"
                    value={selectedCoTPrompt}
                    onChange={(e) => setSelectedCoTPrompt(e.target.value)}
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {CHAIN_OF_THOUGHT_PROMPTS.map((prompt, index) => (
                      <option key={index} value={prompt}>
                        {prompt}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto border border-gray-200 rounded-md p-4 dark:border-gray-700">
              {messages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center">No messages yet. Start a conversation!</p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg max-w-3xl ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {message.testCase && (
                        <div className="text-xs opacity-75 mb-1">
                          Test: {ACTIVITY_1_TESTS.find(t => t.id === message.testCase)?.name}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.timestamp && (
                        <div className="text-xs opacity-75 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={!apiKey || isStreaming}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder={apiKey ? "Type your message..." : "Please enter your API key first"}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!apiKey || !input.trim() || isStreaming}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStreaming ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={clearChat}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">System Prompt Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SYSTEM_PROMPT_TEMPLATES.map(template => (
                <div key={template.id} className="border border-gray-300 rounded-lg p-4 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">{template.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        template.category === 'educational' ? 'bg-blue-100 text-blue-800' :
                        template.category === 'creative' ? 'bg-purple-100 text-purple-800' :
                        template.category === 'analytical' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {template.category}
                      </span>
                    </div>
                    <button
                      onClick={() => applyTemplate(template)}
                      className={`text-sm px-3 py-1 rounded ${
                        selectedTemplate === template.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {selectedTemplate === template.id ? 'Active' : 'Apply'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">{template.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'advanced-prompts' && (
          <div className="space-y-6">
            {!templateLibraryLoaded ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading advanced prompt library...</span>
              </div>
            ) : (
              <>
                {/* Sub-tab navigation for advanced prompts */}
                <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setAdvancedPromptSubTab('library')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      advancedPromptSubTab === 'library'
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                        : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    Template Library
                  </button>
                  <button
                    onClick={() => setAdvancedPromptSubTab('variables')}
                    disabled={!selectedAdvancedTemplate}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      advancedPromptSubTab === 'variables'
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                        : selectedAdvancedTemplate
                        ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Configure Variables
                    {selectedAdvancedTemplate && (
                      <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        {selectedAdvancedTemplate.variables.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setAdvancedPromptSubTab('preview')}
                    disabled={!selectedAdvancedTemplate}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      advancedPromptSubTab === 'preview'
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                        : selectedAdvancedTemplate
                        ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Preview & Test
                  </button>
                </div>

                {/* Sub-tab content */}
                {advancedPromptSubTab === 'library' && (
                  <PromptLibrary
                    onSelectTemplate={handleSelectAdvancedTemplate}
                    selectedTemplateId={selectedAdvancedTemplate ? `${selectedAdvancedTemplate.name}-${selectedAdvancedTemplate.version}` : undefined}
                    showActions={true}
                  />
                )}

                {advancedPromptSubTab === 'variables' && (
                  <PromptVariableEditor
                    template={selectedAdvancedTemplate}
                    variables={templateVariables}
                    onVariablesChange={setTemplateVariables}
                  />
                )}

                {advancedPromptSubTab === 'preview' && (
                  <PromptPreview
                    template={selectedAdvancedTemplate}
                    variables={templateVariables}
                    onTest={handleTestAdvancedPrompt}
                    showTestButton={true}
                  />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Activity #1: Vibe Check Tests</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Test your AI assistant on key capabilities. Each test evaluates different aspects of AI performance.
            </p>
            
            <div className="space-y-4">
              {ACTIVITY_1_TESTS.map(testCase => (
                <div key={testCase.id} className="border border-gray-300 rounded-lg p-4 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{testCase.name}</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        <strong>Aspect Tested:</strong> {testCase.aspectTested}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{testCase.question}</p>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => runTestCase(testCase)}
                        disabled={!apiKey || isStreaming}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-sm"
                      >
                        Run Test
                      </button>
                      {testResults[testCase.id] && (
                        <span className="text-xs text-green-600 dark:text-green-400">✓ Completed</span>
                      )}
                    </div>
                  </div>
                  
                  {testResults[testCase.id] && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border-l-4 border-green-500">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Result:</h5>
                      <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {testResults[testCase.id][1]?.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Quick Actions</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    ACTIVITY_1_TESTS.forEach(testCase => {
                      setTimeout(() => runTestCase(testCase), 1000 * ACTIVITY_1_TESTS.indexOf(testCase))
                    })
                  }}
                  disabled={!apiKey || isStreaming}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  Run All Tests
                </button>
                <button
                  onClick={() => setTestResults({})}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                >
                  Clear Results
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Response Analysis</h3>
            
            {Object.keys(testResults).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No test results available. Run some tests first!</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(testResults).map(([testId, messages]) => {
                  const testCase = ACTIVITY_1_TESTS.find(t => t.id === testId)
                  const response = messages[1]?.content || ''
                  const wordCount = response.split(/\s+/).length
                  
                  return (
                    <div key={testId} className="border border-gray-300 rounded-lg p-4 dark:border-gray-600">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{testCase?.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                          <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
                          <div className="text-xs text-gray-500">Words</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                          <div className="text-2xl font-bold text-green-600">
                            {response.length > 0 ? '✓' : '✗'}
                          </div>
                          <div className="text-xs text-gray-500">Response</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {testCase?.name === 'Creative Writing' && wordCount >= 100 && wordCount <= 150 ? '✓' : '?'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {testCase?.name === 'Creative Writing' ? 'Word Count' : 'Quality'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Response:</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{response}</p>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        <strong>Aspect Tested:</strong> {testCase?.aspectTested}
                      </div>
                    </div>
                  )
                })}
                
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Overall Assessment</h4>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <p>✓ Completed {Object.keys(testResults).length}/5 test cases</p>
                    <p>✓ All responses generated successfully</p>
                    {Object.values(testResults).every(msgs => msgs[1]?.content.length > 0) && (
                      <p>✓ No empty responses detected</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pdf-rag' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">PDF RAG System</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Upload a PDF document to enable Retrieval-Augmented Generation (RAG). 
                The AI will only answer questions using information from your uploaded PDF.
              </p>
            </div>

            {/* Current PDF Status */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Current PDF Status</h4>
              {pdfStatus?.status === 'pdf_loaded' ? (
                <div className="text-sm text-green-600 dark:text-green-400">
                  <p>✓ PDF loaded: <strong>{pdfStatus.filename}</strong></p>
                  <p>✓ Vector chunks: {pdfStatus.vector_count}</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    The AI will now use this PDF as context for answering questions.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>No PDF uploaded yet. Upload a PDF to enable RAG functionality.</p>
                </div>
              )}
            </div>

            {/* PDF Upload Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Upload PDF</h4>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer block"
                >
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pdfFile ? `Selected: ${pdfFile.name}` : 'Click to select a PDF file'}
                  </p>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={uploadPdf}
                  disabled={!pdfFile || !apiKey || isUploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload PDF'}
                </button>
                
                {pdfStatus?.status === 'pdf_loaded' && (
                  <button
                    onClick={clearPdf}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Clear PDF
                  </button>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How to use PDF RAG</h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>1. Upload a PDF file using the uploader above</li>
                <li>2. Wait for the PDF to be processed and indexed</li>
                <li>3. Go to the Chat tab and ask questions about the PDF content</li>
                <li>4. The AI will only use information from your PDF to answer questions</li>
                <li>5. If the answer isn't in the PDF, the AI will clearly state this</li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'mcp-evaluation' && (
          <McpEvaluationDashboard 
            onTemplateSelect={(template) => {
              setSelectedAdvancedTemplate(template)
              setActiveTab('advanced-prompts')
              setAdvancedPromptSubTab('preview')
            }}
          />
        )}
      </div>
    </div>
  )
}
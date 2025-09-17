'use client'

import { useState, useEffect } from 'react'
import { PromptTemplate } from '../types/prompt'
import { useMcp } from '../hooks/useMcp'

interface McpEvaluationDashboardProps {
  onTemplateSelect?: (template: PromptTemplate) => void
}

interface EvaluationResult {
  template_id: string
  template_name: string
  overall_score: number
  passed_tests: number
  total_tests: number
  results: Array<{
    test_case_id: string
    test_name: string
    passed: boolean
    score: number
    details: {
      response: string
      response_time: number
      token_count: number
      meets_criteria: Record<string, boolean>
      quality_metrics: {
        relevance: number
        coherence: number
        completeness: number
        accuracy: number
      }
    }
    errors: string[]
    warnings: string[]
  }>
  recommendations: string[]
  performance_metrics: {
    avg_response_time: number
    avg_token_count: number
    success_rate: number
  }
}

export default function McpEvaluationDashboard({ onTemplateSelect }: McpEvaluationDashboardProps) {
  const mcp = useMcp()
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'analytics'>('overview')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadTemplates()
  }, [mcp.connected])

  const loadTemplates = async () => {
    if (!mcp.connected) return

    try {
      const result = await mcp.listTemplates()
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const templatesData = JSON.parse(result.content[0].text)
        setTemplates(templatesData.templates || [])
      }
    } catch (err) {
      setError(`Failed to load templates: ${err}`)
    }
  }

  const runEvaluation = async () => {
    if (!selectedTemplate || !apiKey || !mcp.connected) return

    setIsEvaluating(true)
    setError('')

    try {
      const templateId = `${selectedTemplate.name}-${selectedTemplate.version}`
      const result = await mcp.evaluateTemplate(templateId, apiKey, true)
      
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const evaluationData = JSON.parse(result.content[0].text)
        setEvaluationResults(evaluationData)
        setActiveTab('results')
      }
    } catch (err) {
      setError(`Evaluation failed: ${err}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  const runQuickEvaluation = async () => {
    if (!selectedTemplate || !mcp.connected) return

    try {
      const templateId = `${selectedTemplate.name}-${selectedTemplate.version}`
      const variables = selectedTemplate.sample || {}
      const result = await mcp.quickEvaluate(templateId, variables)
      
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const evaluationData = JSON.parse(result.content[0].text)
        console.log('Quick evaluation result:', evaluationData)
      }
    } catch (err) {
      console.error('Quick evaluation failed:', err)
    }
  }

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    setEvaluationResults(null)
    setError('')
    if (onTemplateSelect) {
      onTemplateSelect(template)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 0.8) return 'bg-green-100'
    if (score >= 0.6) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">MCP Evaluation Dashboard</h2>
        <p className="text-gray-600">
          Comprehensive template evaluation using Model Context Protocol
        </p>
        
        {!mcp.connected && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            Connecting to MCP server...
          </div>
        )}
        
        {mcp.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            MCP Error: {mcp.error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Select Template</h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id || `${template.category}-${template.name.toLowerCase().replace(/\s+/g, '-')}-${template.version}`}
                  onClick={() => handleTemplateSelect(template)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selectedTemplate?.name === template.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500">{template.category}</div>
                  <div className="text-xs text-gray-400">v{template.version}</div>
                </button>
              ))}
            </div>

            {selectedTemplate && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="font-medium">{selectedTemplate.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Test Cases: {selectedTemplate.test_cases?.length || 0}
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Controls */}
          {selectedTemplate && (
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Evaluation Controls</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={runQuickEvaluation}
                    disabled={!mcp.connected}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Quick Evaluation
                  </button>
                  
                  <button
                    onClick={runEvaluation}
                    disabled={!mcp.connected || !apiKey || isEvaluating}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isEvaluating ? 'Evaluating...' : 'Full Evaluation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                {(['overview', 'results', 'analytics'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Evaluation Overview</h3>
                  {!selectedTemplate ? (
                    <p className="text-gray-500">Select a template to begin evaluation</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Template Information</h4>
                        <dl className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <dt className="text-gray-500">Name</dt>
                            <dd className="font-medium">{selectedTemplate.name}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Version</dt>
                            <dd className="font-medium">{selectedTemplate.version}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Category</dt>
                            <dd className="font-medium capitalize">{selectedTemplate.category}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Variables</dt>
                            <dd className="font-medium">{selectedTemplate.variables.length}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Test Cases</h4>
                        <div className="mt-2 space-y-2">
                          {selectedTemplate.test_cases?.map((testCase, index) => (
                            <div key={testCase.id} className="p-2 bg-gray-50 rounded">
                              <div className="font-medium text-sm">{testCase.name}</div>
                              <div className="text-xs text-gray-600">{testCase.description}</div>
                            </div>
                          )) || <p className="text-gray-500 text-sm">No test cases defined</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'results' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Evaluation Results</h3>
                  {!evaluationResults ? (
                    <p className="text-gray-500">Run an evaluation to see results</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Overall Score */}
                      <div className={`p-4 rounded-lg ${getScoreBackground(evaluationResults.overall_score)}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Overall Score</h4>
                            <p className="text-sm text-gray-600">
                              {evaluationResults.passed_tests} of {evaluationResults.total_tests} tests passed
                            </p>
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(evaluationResults.overall_score)}`}>
                            {(evaluationResults.overall_score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div>
                        <h4 className="font-semibold mb-2">Performance Metrics</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-semibold">
                              {evaluationResults.performance_metrics.avg_response_time.toFixed(0)}ms
                            </div>
                            <div className="text-sm text-gray-600">Avg Response Time</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-semibold">
                              {evaluationResults.performance_metrics.avg_token_count.toFixed(0)}
                            </div>
                            <div className="text-sm text-gray-600">Avg Token Count</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-semibold">
                              {(evaluationResults.performance_metrics.success_rate * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">Success Rate</div>
                          </div>
                        </div>
                      </div>

                      {/* Test Results */}
                      <div>
                        <h4 className="font-semibold mb-2">Test Results</h4>
                        <div className="space-y-3">
                          {evaluationResults.results.map((result) => (
                            <div key={result.test_case_id} className="border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{result.test_name}</h5>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  result.passed 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.passed ? 'PASSED' : 'FAILED'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                Score: {(result.score * 100).toFixed(1)}%
                              </div>
                              {result.errors.length > 0 && (
                                <div className="text-sm text-red-600">
                                  Errors: {result.errors.join(', ')}
                                </div>
                              )}
                              {result.warnings.length > 0 && (
                                <div className="text-sm text-yellow-600">
                                  Warnings: {result.warnings.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {evaluationResults.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Recommendations</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {evaluationResults.recommendations.map((recommendation, index) => (
                              <li key={index} className="text-gray-700">{recommendation}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Analytics</h3>
                  <p className="text-gray-500">
                    Advanced analytics and trend analysis coming soon...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
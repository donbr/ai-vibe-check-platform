'use client'

import { useState, useEffect } from 'react'
import { PromptTemplate, ProcessedPrompt } from '../types/prompt'
import { promptManager } from '../utils/promptManager'
import { promptEvaluator } from '../utils/promptEvaluator'

interface PromptPreviewProps {
  template: PromptTemplate | null
  variables: Record<string, any>
  onTest?: (processedPrompt: ProcessedPrompt) => void
  showTestButton?: boolean
  showEvaluation?: boolean
}

export default function PromptPreview({ 
  template, 
  variables, 
  onTest,
  showTestButton = true,
  showEvaluation = true 
}: PromptPreviewProps) {
  const [processedPrompt, setProcessedPrompt] = useState<ProcessedPrompt | null>(null)
  const [error, setError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'evaluation'>('preview')
  const [quickEvaluation, setQuickEvaluation] = useState<any>(null)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(() => {
    if (template) {
      processTemplate()
      runQuickEvaluation()
    } else {
      setProcessedPrompt(null)
      setQuickEvaluation(null)
      setError('')
    }
  }, [template, variables])

  const processTemplate = async () => {
    if (!template) return

    setIsProcessing(true)
    setError('')

    try {
      const processed = promptManager.processTemplate(template, variables)
      setProcessedPrompt(processed)
    } catch (err) {
      setError(`Failed to process template: ${err}`)
      setProcessedPrompt(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const runQuickEvaluation = async () => {
    if (!template) return

    setEvaluating(true)
    try {
      const evaluation = promptEvaluator.quickEvaluate(template, variables)
      setQuickEvaluation(evaluation)
    } catch (err) {
      console.error('Quick evaluation failed:', err)
      setQuickEvaluation(null)
    } finally {
      setEvaluating(false)
    }
  }

  const handleTest = () => {
    if (processedPrompt && onTest) {
      onTest(processedPrompt)
    }
  }

  const copyToClipboard = async () => {
    if (processedPrompt) {
      try {
        await navigator.clipboard.writeText(processedPrompt.content)
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  if (!template) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Select a template to see the preview
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Processing template...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-red-400">⚠️</div>
          <div className="ml-2 text-red-700">{error}</div>
        </div>
        <button
          onClick={processTemplate}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Template Preview & Evaluation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {template.name} v{template.version}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Copy to clipboard"
          >
            📋 Copy
          </button>
          {showTestButton && processedPrompt && onTest && (
            <button
              onClick={handleTest}
              disabled={processedPrompt.missing_variables.length > 0 || processedPrompt.security_violations.length > 0}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Test Prompt
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs for Preview and Evaluation */}
      {showEvaluation && (
        <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeSubTab === 'preview'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveSubTab('evaluation')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeSubTab === 'evaluation'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Quick Evaluation
            {quickEvaluation && (
              <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                quickEvaluation.score >= 0.8 ? 'bg-green-500 text-white' :
                quickEvaluation.score >= 0.6 ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {Math.round(quickEvaluation.score * 100)}%
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content based on active sub-tab */}
      {activeSubTab === 'evaluation' && showEvaluation ? (
        <div className="space-y-4">
          {evaluating ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Evaluating template...</span>
            </div>
          ) : quickEvaluation ? (
            <>
              {/* Quick Evaluation Score */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800 dark:text-gray-300">
                    Template Quality Score
                  </h4>
                  <button
                    onClick={runQuickEvaluation}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Re-evaluate
                  </button>
                </div>
                <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${
                  quickEvaluation.score >= 0.8 ? 'bg-green-100 border-green-300' :
                  quickEvaluation.score >= 0.6 ? 'bg-yellow-100 border-yellow-300' :
                  'bg-red-100 border-red-300'
                }`}>
                  <div className="text-2xl font-bold">
                    <span className={
                      quickEvaluation.score >= 0.8 ? 'text-green-600' :
                      quickEvaluation.score >= 0.6 ? 'text-yellow-600' :
                      'text-red-600'
                    }>
                      {Math.round(quickEvaluation.score * 100)}%
                    </span>
                  </div>
                  <div className="ml-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">Quality Score</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {quickEvaluation.score >= 0.8 ? 'Excellent' :
                       quickEvaluation.score >= 0.6 ? 'Good' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {quickEvaluation.issues.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h5 className="font-medium text-red-800 dark:text-red-300 mb-2">
                    Issues Found
                  </h5>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    {quickEvaluation.issues.map((issue: string, index: number) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {quickEvaluation.suggestions.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Suggestions for Improvement
                  </h5>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    {quickEvaluation.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>💡 {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {quickEvaluation.issues.length === 0 && quickEvaluation.suggestions.length === 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <div className="text-green-600 text-2xl mb-2">✓</div>
                  <div className="text-green-800 dark:text-green-300 font-medium">
                    Template looks good!
                  </div>
                  <div className="text-green-700 dark:text-green-400 text-sm">
                    No issues or suggestions found.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Unable to evaluate template
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Processing Status */}
          {processedPrompt && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-sm text-green-800 dark:text-green-300 font-medium">
              Variables Used
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-200">
              {processedPrompt.variables_used.length}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${
            processedPrompt.missing_variables.length > 0 
              ? 'bg-red-50 dark:bg-red-900/20' 
              : 'bg-green-50 dark:bg-green-900/20'
          }`}>
            <div className={`text-sm font-medium ${
              processedPrompt.missing_variables.length > 0 
                ? 'text-red-800 dark:text-red-300'
                : 'text-green-800 dark:text-green-300'
            }`}>
              Missing Variables
            </div>
            <div className={`text-lg font-bold ${
              processedPrompt.missing_variables.length > 0 
                ? 'text-red-900 dark:text-red-200'
                : 'text-green-900 dark:text-green-200'
            }`}>
              {processedPrompt.missing_variables.length}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${
            processedPrompt.security_violations.length > 0 
              ? 'bg-orange-50 dark:bg-orange-900/20' 
              : 'bg-green-50 dark:bg-green-900/20'
          }`}>
            <div className={`text-sm font-medium ${
              processedPrompt.security_violations.length > 0 
                ? 'text-orange-800 dark:text-orange-300'
                : 'text-green-800 dark:text-green-300'
            }`}>
              Security Issues
            </div>
            <div className={`text-lg font-bold ${
              processedPrompt.security_violations.length > 0 
                ? 'text-orange-900 dark:text-orange-200'
                : 'text-green-900 dark:text-green-200'
            }`}>
              {processedPrompt.security_violations.length}
            </div>
          </div>
        </div>
      )}

      {/* Warnings and Errors */}
      {processedPrompt && processedPrompt.missing_variables.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
            Missing Required Variables:
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
            {processedPrompt.missing_variables.map(varName => (
              <li key={varName}>• {varName}</li>
            ))}
          </ul>
        </div>
      )}

      {processedPrompt && processedPrompt.security_violations.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
            Security Violations:
          </h4>
          <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
            {processedPrompt.security_violations.map((violation, index) => (
              <li key={index}>• {violation}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Model Configuration */}
      {processedPrompt && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-3">
            Model Configuration
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Model:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {processedPrompt.model_config.preferred || 'gpt-4o-mini'}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Temperature:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {processedPrompt.model_config.temperature ?? 0.7}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Max Tokens:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {processedPrompt.model_config.max_tokens || 1000}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Top P:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {processedPrompt.model_config.top_p ?? 'default'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processed Content */}
      {processedPrompt && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-300">
              Processed Prompt Content
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {processedPrompt.content.length} characters
            </p>
          </div>
          <div className="p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-96">
              {processedPrompt.content}
            </pre>
          </div>
        </div>
      )}

      {/* Variables Used */}
      {processedPrompt && processedPrompt.variables_used.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-3">
            Variables Used in Template
          </h4>
          <div className="flex flex-wrap gap-2">
            {processedPrompt.variables_used.map(varName => (
              <span
                key={varName}
                className={`px-2 py-1 text-xs rounded-full ${
                  processedPrompt.missing_variables.includes(varName)
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}
              >
                {varName}
                {processedPrompt.missing_variables.includes(varName) && ' ❌'}
                {!processedPrompt.missing_variables.includes(varName) && ' ✅'}
              </span>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
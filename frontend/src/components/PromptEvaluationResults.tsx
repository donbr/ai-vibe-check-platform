'use client'

import { useState } from 'react'

interface EvaluationResult {
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
}

interface OverallEvaluation {
  template_id: string
  template_name: string
  overall_score: number
  passed_tests: number
  total_tests: number
  results: EvaluationResult[]
  recommendations: string[]
  performance_metrics: {
    avg_response_time: number
    avg_token_count: number
    success_rate: number
  }
}

interface PromptEvaluationResultsProps {
  evaluation: OverallEvaluation | null
  onRetest?: () => void
  loading?: boolean
}

export default function PromptEvaluationResults({ 
  evaluation, 
  onRetest, 
  loading = false 
}: PromptEvaluationResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())

  const toggleExpanded = (testId: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testId)) {
        newSet.delete(testId)
      } else {
        newSet.add(testId)
      }
      return newSet
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 border-green-300'
    if (score >= 0.6) return 'bg-yellow-100 border-yellow-300'
    return 'bg-red-100 border-red-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Running evaluation...</span>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No evaluation results available. Run an evaluation to see results here.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Results Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Evaluation Results: {evaluation.template_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Template ID: {evaluation.template_id}
            </p>
          </div>
          {onRetest && (
            <button
              onClick={onRetest}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retest
            </button>
          )}
        </div>

        {/* Overall Score */}
        <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${getScoreBgColor(evaluation.overall_score)}`}>
          <div className="text-2xl font-bold">
            <span className={getScoreColor(evaluation.overall_score)}>
              {Math.round(evaluation.overall_score * 100)}%
            </span>
          </div>
          <div className="ml-3 text-sm">
            <div className="font-medium text-gray-900 dark:text-white">Overall Score</div>
            <div className="text-gray-600 dark:text-gray-400">
              {evaluation.passed_tests} of {evaluation.total_tests} tests passed
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {evaluation.performance_metrics.avg_response_time.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Response Time
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(evaluation.performance_metrics.avg_token_count)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Token Count
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(evaluation.performance_metrics.success_rate * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Success Rate
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {evaluation.recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
            Recommendations
          </h4>
          <ul className="space-y-2">
            {evaluation.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">💡</span>
                <span className="text-blue-700 dark:text-blue-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Individual Test Results */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Individual Test Results
        </h4>
        
        {evaluation.results.map(result => (
          <div 
            key={result.test_case_id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            {/* Test Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleExpanded(result.test_case_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {result.passed ? '✓' : '✗'}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {result.test_name}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Score: {Math.round(result.score * 100)}% • 
                      Response Time: {result.details.response_time}ms • 
                      Tokens: {result.details.token_count}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-sm font-medium ${
                    result.passed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </div>
                  <span className="text-gray-400">
                    {expandedResults.has(result.test_case_id) ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedResults.has(result.test_case_id) && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                {/* Quality Metrics */}
                <div className="mb-4">
                  <h6 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quality Metrics
                  </h6>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(result.details.quality_metrics).map(([metric, score]) => (
                      <div key={metric} className="text-center">
                        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                          {Math.round(score * 100)}%
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {metric}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Criteria Met */}
                {Object.keys(result.details.meets_criteria).length > 0 && (
                  <div className="mb-4">
                    <h6 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Criteria
                    </h6>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.details.meets_criteria).map(([criteria, met]) => (
                        <span
                          key={criteria}
                          className={`px-2 py-1 rounded text-xs ${
                            met 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {met ? '✓' : '✗'} {criteria.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response */}
                <div className="mb-4">
                  <h6 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Generated Response
                  </h6>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 text-sm">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {result.details.response || 'No response generated'}
                    </pre>
                  </div>
                </div>

                {/* Errors and Warnings */}
                {(result.errors.length > 0 || result.warnings.length > 0) && (
                  <div>
                    {result.errors.length > 0 && (
                      <div className="mb-2">
                        <h6 className="font-medium text-red-600 dark:text-red-400 mb-1">
                          Errors
                        </h6>
                        <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                          {result.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.warnings.length > 0 && (
                      <div>
                        <h6 className="font-medium text-orange-600 dark:text-orange-400 mb-1">
                          Warnings
                        </h6>
                        <ul className="text-sm text-orange-600 dark:text-orange-400 space-y-1">
                          {result.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
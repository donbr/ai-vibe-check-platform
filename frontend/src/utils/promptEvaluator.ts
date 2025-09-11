import { PromptTemplate, PromptTestCase, PromptExecution } from '../types/prompt'
import { promptManager } from './promptManager'

interface EvaluationResult {
  test_case_id: string
  test_name: string
  passed: boolean
  score: number // 0-1
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

export class PromptEvaluator {
  private static instance: PromptEvaluator | null = null

  static getInstance(): PromptEvaluator {
    if (!PromptEvaluator.instance) {
      PromptEvaluator.instance = new PromptEvaluator()
    }
    return PromptEvaluator.instance
  }

  /**
   * Evaluate a template against its test cases
   */
  async evaluateTemplate(
    template: PromptTemplate,
    apiKey: string,
    testExecution?: (prompt: string, userMessage: string) => Promise<{ response: string; responseTime: number; tokenCount: number }>
  ): Promise<OverallEvaluation> {
    const results: EvaluationResult[] = []
    
    if (!template.test_cases || template.test_cases.length === 0) {
      return {
        template_id: `${template.name}-${template.version}`,
        template_name: template.name,
        overall_score: 0,
        passed_tests: 0,
        total_tests: 0,
        results: [],
        recommendations: ['Add test cases to evaluate template performance'],
        performance_metrics: {
          avg_response_time: 0,
          avg_token_count: 0,
          success_rate: 0
        }
      }
    }

    // Run each test case
    for (const testCase of template.test_cases) {
      try {
        const result = await this.runTestCase(template, testCase, apiKey, testExecution)
        results.push(result)
      } catch (error) {
        results.push({
          test_case_id: testCase.id,
          test_name: testCase.name,
          passed: false,
          score: 0,
          details: {
            response: '',
            response_time: 0,
            token_count: 0,
            meets_criteria: {},
            quality_metrics: {
              relevance: 0,
              coherence: 0,
              completeness: 0,
              accuracy: 0
            }
          },
          errors: [`Test execution failed: ${error}`],
          warnings: []
        })
      }
    }

    // Calculate overall metrics
    const passedTests = results.filter(r => r.passed).length
    const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
    const avgResponseTime = results.reduce((sum, r) => sum + r.details.response_time, 0) / results.length
    const avgTokenCount = results.reduce((sum, r) => sum + r.details.token_count, 0) / results.length
    const successRate = passedTests / results.length

    // Generate recommendations
    const recommendations = this.generateRecommendations(template, results)

    return {
      template_id: `${template.name}-${template.version}`,
      template_name: template.name,
      overall_score: overallScore,
      passed_tests: passedTests,
      total_tests: results.length,
      results,
      recommendations,
      performance_metrics: {
        avg_response_time: avgResponseTime,
        avg_token_count: avgTokenCount,
        success_rate: successRate
      }
    }
  }

  /**
   * Run a single test case
   */
  private async runTestCase(
    template: PromptTemplate,
    testCase: PromptTestCase,
    apiKey: string,
    testExecution?: (prompt: string, userMessage: string) => Promise<{ response: string; responseTime: number; tokenCount: number }>
  ): Promise<EvaluationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Process template with test inputs
    const processedPrompt = promptManager.processTemplate(template, testCase.inputs)
    
    if (processedPrompt.missing_variables.length > 0) {
      errors.push(`Missing variables: ${processedPrompt.missing_variables.join(', ')}`)
    }

    if (processedPrompt.security_violations.length > 0) {
      warnings.push(...processedPrompt.security_violations)
    }

    // Execute the test (mock execution if no executor provided)
    let response = ''
    let responseTime = 0
    let tokenCount = 0

    if (testExecution) {
      try {
        const execution = await testExecution(processedPrompt.content, testCase.inputs.user_message || 'Test input')
        response = execution.response
        responseTime = execution.responseTime
        tokenCount = execution.tokenCount
      } catch (error) {
        errors.push(`Execution failed: ${error}`)
        return {
          test_case_id: testCase.id,
          test_name: testCase.name,
          passed: false,
          score: 0,
          details: {
            response: '',
            response_time: 0,
            token_count: 0,
            meets_criteria: {},
            quality_metrics: {
              relevance: 0,
              coherence: 0,
              completeness: 0,
              accuracy: 0
            }
          },
          errors,
          warnings
        }
      }
    } else {
      // Mock response for testing
      response = 'Mock response for evaluation testing'
      responseTime = Math.random() * 2000 + 500 // 500-2500ms
      tokenCount = Math.floor(Math.random() * 200 + 50) // 50-250 tokens
    }

    // Evaluate response against expected outputs and evaluation criteria
    const meetsCriteria: Record<string, boolean> = {}
    let criteriaScore = 0
    let totalCriteria = 0

    if (testCase.expected_outputs) {
      // Check contains criteria
      if (testCase.expected_outputs.contains) {
        testCase.expected_outputs.contains.forEach(term => {
          const contains = response.toLowerCase().includes(term.toLowerCase())
          meetsCriteria[`contains_${term}`] = contains
          if (contains) criteriaScore += 1
          totalCriteria += 1
        })
      }

      // Check length criteria
      if (testCase.expected_outputs.min_length) {
        const meetsMinLength = response.length >= testCase.expected_outputs.min_length
        meetsCriteria['min_length'] = meetsMinLength
        if (meetsMinLength) criteriaScore += 1
        totalCriteria += 1
      }

      if (testCase.expected_outputs.max_length) {
        const meetsMaxLength = response.length <= testCase.expected_outputs.max_length
        meetsCriteria['max_length'] = meetsMaxLength
        if (meetsMaxLength) criteriaScore += 1
        totalCriteria += 1
      }

      // Check sentiment (basic heuristic)
      if (testCase.expected_outputs.sentiment) {
        const detectedSentiment = this.detectSentiment(response)
        const correctSentiment = detectedSentiment === testCase.expected_outputs.sentiment
        meetsCriteria['sentiment'] = correctSentiment
        if (correctSentiment) criteriaScore += 1
        totalCriteria += 1
      }
    }

    // Evaluate against template-defined evaluation criteria
    if (testCase.evaluation_criteria && Array.isArray(testCase.evaluation_criteria)) {
      testCase.evaluation_criteria.forEach(criterion => {
        const meets = this.evaluateQualitativeCriterion(criterion, response)
        meetsCriteria[criterion.replace(/\s+/g, '_').toLowerCase()] = meets
        if (meets) criteriaScore += 1
        totalCriteria += 1
      })
    }

    // Normalize criteria score to 0-1 range
    const normalizedCriteriaScore = totalCriteria > 0 ? criteriaScore / totalCriteria : 0

    // Calculate quality metrics (simplified heuristics)
    const qualityMetrics = this.calculateQualityMetrics(response, testCase)
    
    // Overall score
    const score = (criteriaScore + 
                  qualityMetrics.relevance + 
                  qualityMetrics.coherence + 
                  qualityMetrics.completeness + 
                  qualityMetrics.accuracy) / 5

    const passed = score >= 0.7 && errors.length === 0

    return {
      test_case_id: testCase.id,
      test_name: testCase.name,
      passed,
      score,
      details: {
        response,
        response_time: responseTime,
        token_count: tokenCount,
        meets_criteria: meetsCriteria,
        quality_metrics: qualityMetrics
      },
      errors,
      warnings
    }
  }

  /**
   * Simple sentiment detection (placeholder)
   */
  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'disappointed', 'problem']
    
    const lowerText = text.toLowerCase()
    const positiveCount = positiveWords.reduce((count, word) => count + (lowerText.includes(word) ? 1 : 0), 0)
    const negativeCount = negativeWords.reduce((count, word) => count + (lowerText.includes(word) ? 1 : 0), 0)
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  /**
   * Calculate quality metrics using heuristics
   */
  private calculateQualityMetrics(response: string, testCase: PromptTestCase) {
    // Relevance: How well does the response address the test case
    const relevance = response.length > 0 && response.trim() !== '' ? 0.8 : 0.2
    
    // Coherence: Basic check for sentence structure
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const coherence = sentences.length > 0 && sentences.every(s => s.trim().length > 5) ? 0.8 : 0.5
    
    // Completeness: Whether response seems complete
    const completeness = response.length > 20 && !response.endsWith('...') ? 0.8 : 0.6
    
    // Accuracy: Basic check (would need more sophisticated evaluation in practice)
    const accuracy = response.length > 10 && !response.includes('error') && !response.includes('sorry') ? 0.8 : 0.6

    return {
      relevance,
      coherence,
      completeness,
      accuracy
    }
  }

  /**
   * Generate recommendations based on evaluation results
   */
  private generateRecommendations(template: PromptTemplate, results: EvaluationResult[]): string[] {
    const recommendations: string[] = []
    
    const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
    const failedTests = results.filter(r => !r.passed)
    const commonErrors = this.findCommonErrors(results)
    
    if (overallScore < 0.5) {
      recommendations.push('Overall template performance is poor. Consider significant revision of prompt structure and instructions.')
    } else if (overallScore < 0.7) {
      recommendations.push('Template performance is below threshold. Review and refine prompt clarity and specificity.')
    }
    
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} test(s) failed. Review failed test cases and adjust template accordingly.`)
    }
    
    if (commonErrors.length > 0) {
      recommendations.push(`Common issues found: ${commonErrors.join(', ')}`)
    }
    
    // Check response time performance
    const avgResponseTime = results.reduce((sum, r) => sum + r.details.response_time, 0) / results.length
    if (avgResponseTime > 5000) {
      recommendations.push('Response time is high. Consider simplifying prompt or using a faster model.')
    }
    
    // Check for missing test cases
    if (results.length < 3) {
      recommendations.push('Add more test cases to better evaluate template performance across different scenarios.')
    }
    
    return recommendations
  }

  /**
   * Find common errors across test results
   */
  private findCommonErrors(results: EvaluationResult[]): string[] {
    const errorCounts: Record<string, number> = {}
    
    results.forEach(result => {
      result.errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1
      })
    })
    
    return Object.entries(errorCounts)
      .filter(([, count]) => count > 1)
      .map(([error]) => error)
  }

  /**
   * Evaluate qualitative criteria using heuristic analysis
   */
  private evaluateQualitativeCriterion(criterion: string, response: string): boolean {
    const lowerResponse = response.toLowerCase()
    const lowerCriterion = criterion.toLowerCase()

    // Question-based criteria
    if (lowerCriterion.includes('question') || lowerCriterion.includes('asking')) {
      const questionCount = (response.match(/\?/g) || []).length
      return questionCount > 0
    }

    // Avoidance criteria
    if (lowerCriterion.includes('avoid') && lowerCriterion.includes('direct')) {
      const directAnswerPhrases = ['the answer is', 'simply put', 'in short', 'to summarize']
      return !directAnswerPhrases.some(phrase => lowerResponse.includes(phrase))
    }

    // Engagement criteria
    if (lowerCriterion.includes('engag') || lowerCriterion.includes('interact')) {
      const engagementPhrases = ['what do you think', 'consider', 'reflect', 'explore', 'investigate']
      return engagementPhrases.some(phrase => lowerResponse.includes(phrase))
    }

    // Critical thinking criteria
    if (lowerCriterion.includes('critical') || lowerCriterion.includes('analysis')) {
      const criticalPhrases = ['analyze', 'examine', 'evaluate', 'compare', 'contrast', 'evidence']
      return criticalPhrases.some(phrase => lowerResponse.includes(phrase))
    }

    // Structure and guidance criteria
    if (lowerCriterion.includes('structure') || lowerCriterion.includes('guide')) {
      const structurePhrases = ['first', 'second', 'next', 'then', 'finally', 'step']
      return structurePhrases.some(phrase => lowerResponse.includes(phrase))
    }

    // Professional tone criteria
    if (lowerCriterion.includes('professional') || lowerCriterion.includes('formal')) {
      const informalPhrases = ['hey', 'gonna', 'wanna', 'yeah', 'nah', 'cool', 'awesome']
      return !informalPhrases.some(phrase => lowerResponse.includes(phrase)) && response.length > 20
    }

    // Creativity criteria
    if (lowerCriterion.includes('creative') || lowerCriterion.includes('imaginative')) {
      const creativePhrases = ['imagine', 'creative', 'innovative', 'unique', 'original', 'artistic']
      return creativePhrases.some(phrase => lowerResponse.includes(phrase))
    }

    // Evidence-based criteria
    if (lowerCriterion.includes('evidence') || lowerCriterion.includes('research')) {
      const evidencePhrases = ['research', 'study', 'data', 'evidence', 'source', 'according to']
      return evidencePhrases.some(phrase => lowerResponse.includes(phrase))
    }

    // Length-based criteria
    if (lowerCriterion.includes('detailed') || lowerCriterion.includes('comprehensive')) {
      return response.length > 200
    }

    if (lowerCriterion.includes('concise') || lowerCriterion.includes('brief')) {
      return response.length < 150 && response.length > 20
    }

    // Default heuristic: check if response contains key terms from criterion
    const criterionWords = lowerCriterion.split(/\s+/).filter(word => word.length > 3)
    const matchCount = criterionWords.filter(word => lowerResponse.includes(word)).length
    return matchCount > 0 || response.length > 50
  }

  /**
   * Quick evaluation without full test execution
   */
  quickEvaluate(template: PromptTemplate, variables: Record<string, any>): {
    score: number
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 1.0

    // Check template processing
    try {
      const processed = promptManager.processTemplate(template, variables)
      
      if (processed.missing_variables.length > 0) {
        issues.push(`Missing required variables: ${processed.missing_variables.join(', ')}`)
        score -= 0.3
      }
      
      if (processed.security_violations.length > 0) {
        issues.push(`Security violations: ${processed.security_violations.join(', ')}`)
        score -= 0.2
      }
      
      // Check prompt length
      if (processed.content.length < 50) {
        suggestions.push('Consider adding more detailed instructions')
        score -= 0.1
      } else if (processed.content.length > 2000) {
        suggestions.push('Consider simplifying the prompt to reduce token usage')
        score -= 0.1
      }
      
    } catch (error) {
      issues.push(`Template processing error: ${error}`)
      score -= 0.5
    }

    // Template structure checks
    if (template.variables.length === 0) {
      suggestions.push('Consider adding variables to make the template more flexible')
    }

    if (!template.test_cases || template.test_cases.length === 0) {
      suggestions.push('Add test cases to validate template performance')
      score -= 0.2
    }

    if (!template.description || template.description.length < 20) {
      suggestions.push('Add a more detailed description of the template purpose')
      score -= 0.1
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    }
  }
}

export const promptEvaluator = PromptEvaluator.getInstance()
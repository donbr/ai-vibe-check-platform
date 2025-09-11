import { PromptExecution, PromptTemplate } from '../types/prompt'

interface AnalyticsData {
  template_usage: Record<string, {
    template_id: string
    template_name: string
    usage_count: number
    avg_response_time: number
    avg_tokens: number
    success_rate: number
    last_used: Date
    user_ratings: number[]
  }>
  daily_usage: Record<string, number>
  performance_trends: {
    date: string
    avg_response_time: number
    avg_tokens: number
    success_rate: number
    usage_count: number
  }[]
  top_templates: {
    template_id: string
    template_name: string
    usage_count: number
    avg_rating: number
  }[]
  error_patterns: Record<string, number>
}

export class PromptAnalytics {
  private static instance: PromptAnalytics | null = null
  private executions: PromptExecution[] = []
  private readonly STORAGE_KEY = 'prompt_analytics_data'

  static getInstance(): PromptAnalytics {
    if (!PromptAnalytics.instance) {
      PromptAnalytics.instance = new PromptAnalytics()
    }
    return PromptAnalytics.instance
  }

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Record a prompt execution
   */
  recordExecution(execution: PromptExecution): void {
    this.executions.push(execution)
    this.saveToStorage()
  }

  /**
   * Get analytics data for a specific template
   */
  getTemplateAnalytics(templateId: string): {
    usage_count: number
    avg_response_time: number
    avg_tokens: number
    success_rate: number
    last_used: Date | null
    user_ratings: number[]
    daily_usage: Record<string, number>
    recent_executions: PromptExecution[]
  } {
    const templateExecutions = this.executions.filter(e => e.template_id === templateId)
    
    if (templateExecutions.length === 0) {
      return {
        usage_count: 0,
        avg_response_time: 0,
        avg_tokens: 0,
        success_rate: 0,
        last_used: null,
        user_ratings: [],
        daily_usage: {},
        recent_executions: []
      }
    }

    const avgResponseTime = templateExecutions.reduce((sum, e) => 
      sum + (e.metrics?.response_time || 0), 0) / templateExecutions.length
    
    const avgTokens = templateExecutions.reduce((sum, e) => 
      sum + (e.metrics?.token_count || 0), 0) / templateExecutions.length
    
    const successfulExecutions = templateExecutions.filter(e => e.response && e.response.length > 0)
    const successRate = successfulExecutions.length / templateExecutions.length
    
    const userRatings = templateExecutions
      .map(e => e.user_feedback?.rating)
      .filter(rating => rating !== undefined) as number[]
    
    const lastUsed = templateExecutions.length > 0 
      ? new Date(Math.max(...templateExecutions.map(e => e.timestamp.getTime())))
      : null

    // Daily usage for the last 30 days
    const dailyUsage: Record<string, number> = {}
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    templateExecutions
      .filter(e => e.timestamp >= thirtyDaysAgo)
      .forEach(e => {
        const dateKey = e.timestamp.toISOString().split('T')[0]
        dailyUsage[dateKey] = (dailyUsage[dateKey] || 0) + 1
      })

    // Recent executions (last 10)
    const recentExecutions = templateExecutions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    return {
      usage_count: templateExecutions.length,
      avg_response_time: avgResponseTime,
      avg_tokens: avgTokens,
      success_rate: successRate,
      last_used: lastUsed,
      user_ratings: userRatings,
      daily_usage: dailyUsage,
      recent_executions: recentExecutions
    }
  }

  /**
   * Get overall analytics data
   */
  getOverallAnalytics(): AnalyticsData {
    const templateUsage: Record<string, any> = {}
    const dailyUsage: Record<string, number> = {}
    const errorPatterns: Record<string, number> = {}

    // Process each execution
    this.executions.forEach(execution => {
      const templateId = execution.template_id
      const dateKey = execution.timestamp.toISOString().split('T')[0]

      // Template usage
      if (!templateUsage[templateId]) {
        templateUsage[templateId] = {
          template_id: templateId,
          template_name: templateId, // Would be populated with actual name
          usage_count: 0,
          total_response_time: 0,
          total_tokens: 0,
          successful_executions: 0,
          last_used: execution.timestamp,
          user_ratings: []
        }
      }

      const template = templateUsage[templateId]
      template.usage_count += 1
      template.total_response_time += execution.metrics?.response_time || 0
      template.total_tokens += execution.metrics?.token_count || 0
      
      if (execution.response && execution.response.length > 0) {
        template.successful_executions += 1
      }
      
      if (execution.timestamp > template.last_used) {
        template.last_used = execution.timestamp
      }
      
      if (execution.user_feedback?.rating) {
        template.user_ratings.push(execution.user_feedback.rating)
      }

      // Daily usage
      dailyUsage[dateKey] = (dailyUsage[dateKey] || 0) + 1
    })

    // Calculate averages and success rates
    Object.values(templateUsage).forEach((template: any) => {
      template.avg_response_time = template.total_response_time / template.usage_count
      template.avg_tokens = template.total_tokens / template.usage_count
      template.success_rate = template.successful_executions / template.usage_count
    })

    // Performance trends (last 30 days)
    const performanceTrends = this.calculatePerformanceTrends()

    // Top templates by usage
    const topTemplates = Object.values(templateUsage)
      .map((template: any) => ({
        template_id: template.template_id,
        template_name: template.template_name,
        usage_count: template.usage_count,
        avg_rating: template.user_ratings.length > 0 
          ? template.user_ratings.reduce((sum: number, rating: number) => sum + rating, 0) / template.user_ratings.length
          : 0
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10)

    return {
      template_usage: templateUsage,
      daily_usage: dailyUsage,
      performance_trends: performanceTrends,
      top_templates: topTemplates,
      error_patterns: errorPatterns
    }
  }

  /**
   * Calculate performance trends over time
   */
  private calculatePerformanceTrends() {
    const trends: Record<string, {
      response_times: number[]
      token_counts: number[]
      successes: number
      total: number
    }> = {}

    // Group executions by date
    this.executions.forEach(execution => {
      const dateKey = execution.timestamp.toISOString().split('T')[0]
      
      if (!trends[dateKey]) {
        trends[dateKey] = {
          response_times: [],
          token_counts: [],
          successes: 0,
          total: 0
        }
      }

      const trend = trends[dateKey]
      trend.total += 1
      
      if (execution.metrics?.response_time) {
        trend.response_times.push(execution.metrics.response_time)
      }
      
      if (execution.metrics?.token_count) {
        trend.token_counts.push(execution.metrics.token_count)
      }
      
      if (execution.response && execution.response.length > 0) {
        trend.successes += 1
      }
    })

    // Calculate averages
    return Object.entries(trends)
      .map(([date, data]) => ({
        date,
        avg_response_time: data.response_times.length > 0 
          ? data.response_times.reduce((sum, time) => sum + time, 0) / data.response_times.length
          : 0,
        avg_tokens: data.token_counts.length > 0
          ? data.token_counts.reduce((sum, count) => sum + count, 0) / data.token_counts.length
          : 0,
        success_rate: data.successes / data.total,
        usage_count: data.total
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
  }

  /**
   * Update template metrics after execution
   */
  updateTemplateMetrics(templateId: string, metrics: {
    response_time: number
    success: boolean
    user_rating?: number
    token_count?: number
  }): void {
    const execution: PromptExecution = {
      template_id: templateId,
      variables: {},
      timestamp: new Date(),
      response: metrics.success ? 'Success' : '',
      metrics: {
        response_time: metrics.response_time,
        token_count: metrics.token_count || 0,
        cost_estimate: 0,
        quality_score: metrics.user_rating
      },
      user_feedback: metrics.user_rating ? {
        rating: metrics.user_rating,
        comments: ''
      } : undefined
    }

    this.recordExecution(execution)
  }

  /**
   * Get usage statistics for dashboard
   */
  getUsageStats(days: number = 7): {
    total_executions: number
    avg_response_time: number
    success_rate: number
    most_used_template: string
    daily_breakdown: { date: string; count: number }[]
  } {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const recentExecutions = this.executions.filter(e => e.timestamp >= cutoffDate)
    
    if (recentExecutions.length === 0) {
      return {
        total_executions: 0,
        avg_response_time: 0,
        success_rate: 0,
        most_used_template: '',
        daily_breakdown: []
      }
    }

    const totalResponseTime = recentExecutions.reduce((sum, e) => 
      sum + (e.metrics?.response_time || 0), 0)
    const avgResponseTime = totalResponseTime / recentExecutions.length

    const successfulExecutions = recentExecutions.filter(e => e.response && e.response.length > 0)
    const successRate = successfulExecutions.length / recentExecutions.length

    // Most used template
    const templateCounts: Record<string, number> = {}
    recentExecutions.forEach(e => {
      templateCounts[e.template_id] = (templateCounts[e.template_id] || 0) + 1
    })
    const mostUsedTemplate = Object.entries(templateCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || ''

    // Daily breakdown
    const dailyBreakdown: Record<string, number> = {}
    recentExecutions.forEach(e => {
      const dateKey = e.timestamp.toISOString().split('T')[0]
      dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + 1
    })

    const dailyBreakdownArray = Object.entries(dailyBreakdown)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      total_executions: recentExecutions.length,
      avg_response_time: avgResponseTime,
      success_rate: successRate,
      most_used_template: mostUsedTemplate,
      daily_breakdown: dailyBreakdownArray
    }
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    return JSON.stringify({
      executions: this.executions,
      analytics: this.getOverallAnalytics(),
      export_date: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.executions = []
    this.saveToStorage()
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.executions))
    } catch (error) {
      console.warn('Failed to save analytics data to storage:', error)
    }
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        this.executions = JSON.parse(data).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load analytics data from storage:', error)
      this.executions = []
    }
  }
}

export const promptAnalytics = PromptAnalytics.getInstance()
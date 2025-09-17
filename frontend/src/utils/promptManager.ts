import { PromptTemplate, PromptVariable, ProcessedPrompt, PromptValidationResult, ModelConfiguration } from '../types/prompt'
import yaml from 'js-yaml'

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map()
  private static instance: PromptManager | null = null

  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager()
    }
    return PromptManager.instance
  }

  /**
   * Parse a .prompty file content into a PromptTemplate object
   */
  parsePromptyFile(content: string, filePath?: string): PromptTemplate {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    
    if (!frontmatterMatch) {
      throw new Error('Invalid .prompty file format: Missing YAML frontmatter')
    }

    const [, frontmatterYaml, promptContent] = frontmatterMatch
    
    try {
      const frontmatter = yaml.load(frontmatterYaml) as any
      
      // Parse and validate the frontmatter
      const template: PromptTemplate = {
        name: frontmatter.name || 'Unnamed Template',
        description: frontmatter.description || '',
        version: frontmatter.version || '1.0.0',
        authors: Array.isArray(frontmatter.authors) ? frontmatter.authors : [frontmatter.authors || 'Unknown'],
        created: new Date(frontmatter.created || Date.now()),
        updated: new Date(frontmatter.updated || Date.now()),
        category: frontmatter.category || 'custom',
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        model: {
          preferred: frontmatter.model?.preferred || 'gpt-4o-mini',
          temperature: frontmatter.model?.temperature ?? 0.7,
          max_tokens: frontmatter.model?.max_tokens ?? 1000,
          ...frontmatter.model
        },
        variables: this.parseVariables(frontmatter.variables || []),
        content: promptContent.trim(),
        sample: frontmatter.sample || {},
        test_cases: frontmatter.test_cases || [],
        metrics: {
          usage_count: frontmatter.metrics?.usage_count || 0,
          avg_response_time: frontmatter.metrics?.avg_response_time || 0,
          success_rate: frontmatter.metrics?.success_rate ?? 1.0,
          ...frontmatter.metrics
        },
        security: {
          injection_protected: frontmatter.security?.injection_protected ?? true,
          sanitize_inputs: frontmatter.security?.sanitize_inputs ?? true,
          ...frontmatter.security
        },
        file_path: filePath,
        hash: this.generateHash(content)
      }

      return template
    } catch (error) {
      throw new Error(`Failed to parse YAML frontmatter: ${error}`)
    }
  }

  /**
   * Parse variables from frontmatter
   */
  private parseVariables(variablesData: any[]): PromptVariable[] {
    return variablesData.map(varData => ({
      name: varData.name || '',
      type: varData.type || 'string',
      description: varData.description || '',
      required: varData.required ?? true,
      default: varData.default,
      validation: varData.validation
    }))
  }

  /**
   * Process a template with provided variables
   */
  processTemplate(template: PromptTemplate, variables: Record<string, any>): ProcessedPrompt {
    // Import template engine
    const { templateEngine } = require('./templateEngine')
    
    let securityViolations: string[] = []
    let processedVariables = { ...variables }

    // Apply security sanitization to inputs if enabled
    if (template.security.sanitize_inputs) {
      processedVariables = {}
      for (const [key, value] of Object.entries(variables)) {
        const sanitizedValue = this.sanitizeInput(String(value))
        if (sanitizedValue !== String(value)) {
          securityViolations.push(`Variable '${key}' was sanitized`)
        }
        processedVariables[key] = sanitizedValue
      }
    }

    // Process the template using the advanced template engine
    const result = templateEngine.processTemplate(template.content, processedVariables, template.variables)
    
    // Check for prompt injection if enabled
    if (template.security.injection_protected) {
      const injectionViolations = this.detectPromptInjection(result.content)
      securityViolations.push(...injectionViolations)
    }

    // Extract variables used from template
    const variablesUsed = templateEngine.extractVariables(template.content)
    
    // Find missing required variables
    const missingVariables: string[] = []
    template.variables.forEach(templateVar => {
      if (templateVar.required && 
          variablesUsed.includes(templateVar.name) && 
          !(templateVar.name in variables)) {
        missingVariables.push(templateVar.name)
      }
    })

    return {
      content: result.content,
      variables_used: variablesUsed,
      missing_variables: missingVariables,
      model_config: template.model,
      security_violations: [...securityViolations, ...result.errors]
    }
  }

  /**
   * Validate a template structure and content
   */
  validateTemplate(template: PromptTemplate): PromptValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Required fields validation
    if (!template.name.trim()) errors.push('Template name is required')
    if (!template.description.trim()) warnings.push('Template description is empty')
    if (!template.content.trim()) errors.push('Template content is required')

    // Version format validation
    const versionPattern = /^\d+\.\d+\.\d+$/
    if (!versionPattern.test(template.version)) {
      warnings.push('Version should follow semantic versioning (x.y.z)')
    }

    // Variables validation
    const variableNames = new Set<string>()
    const contentVariables = new Set<string>()
    
    // Find variables used in content (excluding Handlebars constructs)
    // Use a two-pass approach: 
    // 1. Find all {{...}} constructs
    // 2. Filter out Handlebars built-ins and control structures
    const allMatches = [...template.content.matchAll(/\{\{([^}]+)\}\}/g)]
    const handlebarsBuiltins = new Set([
      'else', '#if', '/if', '#unless', '/unless', '#each', '/each', 
      '#with', '/with', '#when', '/when', '#unless', '/unless'
    ])
    
    allMatches.forEach(match => {
      const content = match[1].trim()
      
      // Skip Handlebars control structures and built-ins
      if (content.startsWith('#') || content.startsWith('/') || 
          content === 'else' || content.startsWith('else ') ||
          handlebarsBuiltins.has(content)) {
        return
      }
      
      // Skip function calls like (eq variable "value")
      if (content.startsWith('(') && content.endsWith(')')) {
        return
      }
      
      // Extract simple variable name (handle complex expressions)
      const variableMatch = content.match(/^([a-zA-Z_]\w*)/)
      if (variableMatch) {
        contentVariables.add(variableMatch[1])
      }
    })

    template.variables.forEach(variable => {
      if (!variable.name.trim()) {
        errors.push('Variable name is required')
        return
      }

      if (variableNames.has(variable.name)) {
        errors.push(`Duplicate variable name: ${variable.name}`)
      }
      variableNames.add(variable.name)

      if (!variable.description.trim()) {
        warnings.push(`Variable '${variable.name}' has no description`)
      }
    })

    // Check for unused variables
    template.variables.forEach(variable => {
      if (!contentVariables.has(variable.name)) {
        warnings.push(`Variable '${variable.name}' is defined but not used in content`)
      }
    })

    // Check for undefined variables in content (warn instead of error for template keywords)
    contentVariables.forEach(varName => {
      if (!variableNames.has(varName)) {
        // Don't error on Handlebars keywords - just warn
        if (['else', 'if', 'unless', 'each', 'with'].includes(varName)) {
          warnings.push(`Handlebars keyword '${varName}' detected - ensure proper template syntax`)
        } else {
          errors.push(`Variable '${varName}' is used in content but not defined`)
        }
      }
    })

    // Model configuration validation
    if (template.model.temperature !== undefined && (template.model.temperature < 0 || template.model.temperature > 2)) {
      warnings.push('Temperature should be between 0 and 2')
    }

    if (template.model.max_tokens !== undefined && template.model.max_tokens < 1) {
      errors.push('max_tokens must be at least 1')
    }

    // Content quality suggestions
    if (template.content.length < 50) {
      suggestions.push('Consider adding more detailed instructions for better results')
    }

    if (!template.content.includes('You are')) {
      suggestions.push('Consider starting with role definition (e.g., "You are...")')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  private sanitizeInput(input: string): string {
    // Remove potential injection patterns
    const dangerousPatterns = [
      /ignore\s+the\s+above/gi,
      /forget\s+everything/gi,
      /new\s+instructions/gi,
      /system\s*:/gi,
      /assistant\s*:/gi,
      /user\s*:/gi,
      /<\s*script/gi,
      /javascript\s*:/gi,
      /data\s*:\s*text/gi
    ]

    let sanitized = input
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]')
    })

    // Remove excessive whitespace and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
    sanitized = sanitized.replace(/\s{4,}/g, '   ')

    return sanitized.trim()
  }

  /**
   * Detect potential prompt injection attempts
   */
  private detectPromptInjection(content: string): string[] {
    const violations: string[] = []
    
    const injectionPatterns = [
      { pattern: /ignore\s+(?:all\s+)?(?:previous\s+)?instructions/gi, message: 'Ignore instructions pattern detected' },
      { pattern: /forget\s+(?:everything|all)/gi, message: 'Forget instructions pattern detected' },
      { pattern: /new\s+(?:task|instruction|role)/gi, message: 'New instructions pattern detected' },
      { pattern: /system\s*:\s*[^{]/gi, message: 'System role injection detected' },
      { pattern: /(?:act|behave|pretend)\s+(?:as|like)\s+(?:a\s+)?(?:different|new)/gi, message: 'Role switching pattern detected' },
      { pattern: /\[INST\]|\[\/INST\]/gi, message: 'Instruction tags detected' },
      { pattern: /<\|.*?\|>/g, message: 'Special tokens detected' }
    ]

    injectionPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        violations.push(message)
      }
    })

    return violations
  }

  /**
   * Generate a hash for change detection
   */
  private generateHash(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  /**
   * Register a template in the manager
   */
  registerTemplate(template: PromptTemplate): void {
    const validation = this.validateTemplate(template)
    if (!validation.valid) {
      // Log validation errors but don't fail - allow templates to load
      console.warn(`Template validation issues for ${template.name}:`, validation.errors)
      // Only fail on critical errors (not variable validation issues)
      const criticalErrors = validation.errors.filter(error => 
        !error.includes('is used in content but not defined') &&
        !error.includes('Variable name is required') &&
        error.includes('required')
      )
      if (criticalErrors.length > 0) {
        throw new Error(`Critical template errors: ${criticalErrors.join(', ')}`)
      }
    }
    
    const id = this.generateTemplateId(template)
    this.templates.set(id, template)
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): PromptTemplate | null {
    return this.templates.get(id) || null
  }

  /**
   * Get all templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Search templates by criteria
   */
  searchTemplates(criteria: {
    category?: string
    tags?: string[]
    name?: string
  }): PromptTemplate[] {
    return this.getAllTemplates().filter(template => {
      if (criteria.category && template.category !== criteria.category) return false
      if (criteria.tags && !criteria.tags.some(tag => template.tags.includes(tag))) return false
      if (criteria.name && !template.name.toLowerCase().includes(criteria.name.toLowerCase())) return false
      return true
    })
  }

  /**
   * Generate a unique template ID
   */
  private generateTemplateId(template: PromptTemplate): string {
    return `${template.category}-${template.name.toLowerCase().replace(/\s+/g, '-')}-${template.version}`
  }

  /**
   * Update template metrics after execution
   */
  updateTemplateMetrics(templateId: string, executionTime: number, success: boolean): void {
    const template = this.templates.get(templateId)
    if (!template) return

    const metrics = template.metrics
    metrics.usage_count += 1
    metrics.avg_response_time = ((metrics.avg_response_time * (metrics.usage_count - 1)) + executionTime) / metrics.usage_count
    metrics.success_rate = ((metrics.success_rate * (metrics.usage_count - 1)) + (success ? 1 : 0)) / metrics.usage_count
    metrics.last_used = new Date()

    template.updated = new Date()
    this.templates.set(templateId, template)
  }
}

export const promptManager = PromptManager.getInstance()
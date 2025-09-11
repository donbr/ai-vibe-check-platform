import { PromptVariable } from '../types/prompt'

interface TemplateContext {
  [key: string]: any
}

interface ConditionalBlock {
  condition: string
  content: string
  elseContent?: string
}

export class TemplateEngine {
  private static instance: TemplateEngine | null = null

  static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine()
    }
    return TemplateEngine.instance
  }

  /**
   * Process a template with variables and conditional logic
   */
  processTemplate(
    template: string, 
    variables: TemplateContext, 
    templateVariables: PromptVariable[] = []
  ): {
    content: string
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    let processedContent = template

    try {
      // First, handle conditional blocks
      processedContent = this.processConditionals(processedContent, variables)
      
      // Then, handle variable substitutions
      processedContent = this.processVariables(processedContent, variables, templateVariables, errors, warnings)
      
      // Clean up any remaining template artifacts
      processedContent = this.cleanupTemplate(processedContent)
      
    } catch (error) {
      errors.push(`Template processing error: ${error}`)
    }

    return {
      content: processedContent,
      errors,
      warnings
    }
  }

  /**
   * Process conditional blocks like {{#if condition}} {{/if}}
   * Now supports {{else if}} chains used in templates
   */
  private processConditionals(content: string, variables: TemplateContext): string {
    // Handle complex if-else if-else chains first
    const ifElseIfPattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else if\s+([^}]+)\}\}([\s\S]*?))*(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g
    
    content = content.replace(ifElseIfPattern, (match) => {
      return this.processIfElseIfChain(match, variables)
    })

    // Handle simple if-else blocks (fallback for patterns not caught above)
    const ifElsePattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g
    content = content.replace(ifElsePattern, (match, condition, ifContent, elseContent) => {
      const shouldInclude = this.evaluateCondition(condition.trim(), variables)
      return shouldInclude ? ifContent : elseContent
    })

    // Handle simple if blocks
    const ifPattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g
    content = content.replace(ifPattern, (match, condition, ifContent) => {
      const shouldInclude = this.evaluateCondition(condition.trim(), variables)
      return shouldInclude ? ifContent : ''
    })

    // Handle unless blocks
    const unlessPattern = /\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g
    content = content.replace(unlessPattern, (match, condition, unlessContent) => {
      const shouldInclude = !this.evaluateCondition(condition.trim(), variables)
      return shouldInclude ? unlessContent : ''
    })

    return content
  }

  /**
   * Process complex if-else if-else chains
   */
  private processIfElseIfChain(match: string, variables: TemplateContext): string {
    // Split the match into parts
    const parts = []
    let current = match
    
    // Extract initial if block
    const ifMatch = current.match(/^\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?=\{\{else|$)/)
    if (ifMatch) {
      parts.push({ type: 'if', condition: ifMatch[1].trim(), content: ifMatch[2] })
      current = current.substring(ifMatch[0].length)
    }
    
    // Extract else if blocks
    const elseIfPattern = /^\{\{else if\s+([^}]+)\}\}([\s\S]*?)(?=\{\{else|$)/g
    let elseIfMatch
    while ((elseIfMatch = elseIfPattern.exec(current)) !== null) {
      parts.push({ type: 'elseif', condition: elseIfMatch[1].trim(), content: elseIfMatch[2] })
      current = current.substring(elseIfMatch[0].length)
      elseIfPattern.lastIndex = 0 // Reset regex
    }
    
    // Extract else block
    const elseMatch = current.match(/^\{\{else\}\}([\s\S]*?)\{\{\/if\}\}$/)
    if (elseMatch) {
      parts.push({ type: 'else', condition: '', content: elseMatch[1] })
    }
    
    // Evaluate conditions in order
    for (const part of parts) {
      if (part.type === 'else' || this.evaluateCondition(part.condition, variables)) {
        return part.content
      }
    }
    
    return '' // No condition matched
  }

  /**
   * Process variable substitutions
   */
  private processVariables(
    content: string, 
    variables: TemplateContext, 
    templateVariables: PromptVariable[],
    errors: string[],
    warnings: string[]
  ): string {
    // Handle simple variable substitutions {{variable}}
    const variablePattern = /\{\{(?!#|\/|\^)([^}]+)\}\}/g
    
    return content.replace(variablePattern, (match, varExpression) => {
      const trimmedExpression = varExpression.trim()
      
      try {
        const value = this.evaluateExpression(trimmedExpression, variables)
        
        if (value === undefined || value === null) {
          const templateVar = templateVariables.find(v => v.name === trimmedExpression)
          
          if (templateVar) {
            if (templateVar.required) {
              errors.push(`Required variable '${trimmedExpression}' is missing`)
              return `[MISSING: ${trimmedExpression}]`
            } else if (templateVar.default !== undefined) {
              warnings.push(`Using default value for variable '${trimmedExpression}'`)
              return String(templateVar.default)
            }
          }
          
          warnings.push(`Undefined variable '${trimmedExpression}', using empty string`)
          return ''
        }
        
        return String(value)
      } catch (error) {
        errors.push(`Error processing variable '${trimmedExpression}': ${error}`)
        return `[ERROR: ${trimmedExpression}]`
      }
    })
  }

  /**
   * Evaluate a condition for if/unless blocks
   */
  private evaluateCondition(condition: string, variables: TemplateContext): boolean {
    try {
      // Remove outer parentheses if present for helper functions like (eq var "value")
      let cleanCondition = condition.trim()
      if (cleanCondition.startsWith('(') && cleanCondition.endsWith(')')) {
        cleanCondition = cleanCondition.slice(1, -1).trim()
      }

      // Handle helper functions like eq, ne, gt, lt (prioritize over other checks)
      const helperMatch = cleanCondition.match(/^(\w+)\s+(.+?)\s+(.+)$/)
      if (helperMatch) {
        const [, helper, left, right] = helperMatch
        const leftValue = this.evaluateExpression(left.trim(), variables)
        const rightValue = this.evaluateExpression(right.trim(), variables)
        
        switch (helper) {
          case 'eq': return leftValue === this.parseValue(rightValue)
          case 'ne': return leftValue !== this.parseValue(rightValue)
          case 'gt': return leftValue > this.parseValue(rightValue)
          case 'lt': return leftValue < this.parseValue(rightValue)
          case 'gte': return leftValue >= this.parseValue(rightValue)
          case 'lte': return leftValue <= this.parseValue(rightValue)
        }
      }

      // Handle simple variable existence checks
      if (!/[<>=!&|()]/.test(cleanCondition)) {
        return this.isTruthy(this.evaluateExpression(cleanCondition, variables))
      }

      // Handle comparison operators
      const comparisonMatch = cleanCondition.match(/^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/)
      if (comparisonMatch) {
        const [, left, operator, right] = comparisonMatch
        const leftValue = this.evaluateExpression(left.trim(), variables)
        const rightValue = this.evaluateExpression(right.trim(), variables)
        
        switch (operator) {
          case '===': return leftValue === rightValue
          case '!==': return leftValue !== rightValue
          case '==': return leftValue == rightValue
          case '!=': return leftValue != rightValue
          case '>=': return leftValue >= rightValue
          case '<=': return leftValue <= rightValue
          case '>': return leftValue > rightValue
          case '<': return leftValue < rightValue
        }
      }

      // Handle logical operators
      if (cleanCondition.includes('&&')) {
        return cleanCondition.split('&&').every(part => 
          this.evaluateCondition(part.trim(), variables)
        )
      }

      if (cleanCondition.includes('||')) {
        return cleanCondition.split('||').some(part => 
          this.evaluateCondition(part.trim(), variables)
        )
      }

      // Handle negation
      if (cleanCondition.startsWith('!')) {
        return !this.evaluateCondition(cleanCondition.slice(1).trim(), variables)
      }

      // Default: treat as variable existence check
      return this.isTruthy(this.evaluateExpression(cleanCondition, variables))
    } catch (error) {
      console.warn(`Error evaluating condition '${condition}':`, error)
      return false
    }
  }

  /**
   * Evaluate an expression (variable access, literals, etc.)
   */
  private evaluateExpression(expression: string, variables: TemplateContext): any {
    // Handle string literals
    if ((expression.startsWith('"') && expression.endsWith('"')) || 
        (expression.startsWith("'") && expression.endsWith("'"))) {
      return expression.slice(1, -1)
    }

    // Handle number literals
    if (/^-?\d+(\.\d+)?$/.test(expression)) {
      return parseFloat(expression)
    }

    // Handle boolean literals
    if (expression === 'true') return true
    if (expression === 'false') return false
    if (expression === 'null') return null
    if (expression === 'undefined') return undefined

    // Handle property access (e.g., "user.name")
    if (expression.includes('.')) {
      const parts = expression.split('.')
      let value = variables
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part]
        } else {
          return undefined
        }
      }
      return value
    }

    // Handle array/object access (e.g., "items[0]")
    const arrayMatch = expression.match(/^(\w+)\[(.+)\]$/)
    if (arrayMatch) {
      const [, arrayName, indexExpr] = arrayMatch
      const array = variables[arrayName]
      const index = this.evaluateExpression(indexExpr, variables)
      return Array.isArray(array) || typeof array === 'object' ? array[index] : undefined
    }

    // Simple variable access
    return variables[expression]
  }

  /**
   * Parse a value from string to appropriate type
   */
  private parseValue(value: any): any {
    if (typeof value === 'string') {
      // Try to parse as number
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return parseFloat(value)
      }
      // Try to parse as boolean
      if (value === 'true') return true
      if (value === 'false') return false
    }
    return value
  }

  /**
   * Check if a value is truthy in template context
   */
  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value.length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return Boolean(value)
  }

  /**
   * Clean up any remaining template artifacts
   */
  private cleanupTemplate(content: string): string {
    // Remove empty lines that may have been left by conditionals
    return content
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Collapse multiple empty lines
      .replace(/^\s*\n/, '') // Remove leading empty lines
      .replace(/\s*$/, '') // Remove trailing whitespace
      .trim()
  }

  /**
   * Extract all variables used in a template
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>()
    
    // Extract from variable substitutions
    const variablePattern = /\{\{(?!#|\/|\^)([^}]+)\}\}/g
    let match
    while ((match = variablePattern.exec(template)) !== null) {
      const varName = match[1].trim().split('.')[0] // Get root variable name
      if (!['eq', 'ne', 'gt', 'lt', 'gte', 'lte'].includes(varName)) {
        variables.add(varName)
      }
    }

    // Extract from conditionals
    const conditionalPattern = /\{\{#(?:if|unless)\s+([^}]+)\}\}/g
    while ((match = conditionalPattern.exec(template)) !== null) {
      const condition = match[1].trim()
      const conditionVars = this.extractVariablesFromCondition(condition)
      conditionVars.forEach(v => variables.add(v))
    }

    return Array.from(variables)
  }

  /**
   * Extract variables from a condition expression
   */
  private extractVariablesFromCondition(condition: string): string[] {
    const variables: string[] = []
    
    // Remove operators and quotes to find variable names
    const cleaned = condition
      .replace(/[<>=!&|]+/g, ' ')
      .replace(/["']/g, ' ')
      .replace(/\b(?:true|false|null|undefined|\d+(?:\.\d+)?)\b/g, ' ')
    
    const words = cleaned.split(/\s+/).filter(word => 
      word.length > 0 && 
      !/^[\d.]+$/.test(word) &&
      !['and', 'or', 'not', 'eq', 'ne', 'gt', 'lt', 'gte', 'lte'].includes(word)
    )
    
    variables.push(...words.map(word => word.split('.')[0]))
    
    return variables
  }

  /**
   * Validate template syntax
   */
  validateTemplateSyntax(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check for unmatched conditional blocks
    const ifCount = (template.match(/\{\{#if/g) || []).length
    const ifEndCount = (template.match(/\{\{\/if\}\}/g) || []).length
    if (ifCount !== ifEndCount) {
      errors.push('Unmatched {{#if}} blocks')
    }

    const unlessCount = (template.match(/\{\{#unless/g) || []).length
    const unlessEndCount = (template.match(/\{\{\/unless\}\}/g) || []).length
    if (unlessCount !== unlessEndCount) {
      errors.push('Unmatched {{#unless}} blocks')
    }

    // Check for malformed variable syntax
    const malformedPattern = /\{\{[^}]*\{\{|\}\}[^{]*\}\}/g
    if (malformedPattern.test(template)) {
      errors.push('Malformed variable syntax detected')
    }

    // Check for unclosed blocks
    const unclosedPattern = /\{\{#(?:if|unless)[^}]*$/gm
    if (unclosedPattern.test(template)) {
      errors.push('Unclosed conditional blocks detected')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export const templateEngine = TemplateEngine.getInstance()
import { PromptTemplate } from '../types/prompt'
import { promptManager } from './promptManager'

// API-based template loading (replaces mock system)
interface TemplateApiResponse {
  templates: any[]
  count: number
  status: string
}

// Convert API response to PromptTemplate format
function convertApiTemplateToPromptTemplate(apiTemplate: any): PromptTemplate {
  return {
    name: apiTemplate.name || 'Unnamed Template',
    description: apiTemplate.description || '',
    version: apiTemplate.version || '1.0.0',
    authors: apiTemplate.authors || ['Unknown'],
    created: new Date(apiTemplate.created || '2024-01-01'),
    updated: new Date(apiTemplate.updated || '2024-01-01'),
    category: apiTemplate.category || 'general',
    tags: apiTemplate.tags || [],
    model: apiTemplate.model || {
      preferred: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1000
    },
    variables: apiTemplate.variables || [],
    sample: apiTemplate.sample || {},
    test_cases: apiTemplate.test_cases || [],
    content: apiTemplate.content || '',
    metrics: apiTemplate.metrics || {
      usage_count: 0,
      avg_response_time: 0,
      success_rate: 1.0
    },
    security: apiTemplate.security || {
      injection_protected: true,
      sanitize_inputs: true
    }
  }
}

// Minimal fallback templates in case API is unavailable
const FALLBACK_TEMPLATES = {
  'helpful-assistant': `---
name: "Helpful Assistant"
description: "General purpose helpful AI assistant"
version: "1.0.0"
authors: 
  - "Fallback System"
category: "professional"
tags: ["assistant", "general"]
model:
  preferred: "gpt-4o-mini"
  temperature: 0.7
  max_tokens: 1000
variables: []
sample: {}
metrics:
  usage_count: 0
  avg_response_time: 0
  success_rate: 1.0
security:
  injection_protected: true
  sanitize_inputs: true
---

You are a helpful AI assistant. You provide clear, accurate, and helpful responses to user questions.`
}

export class TemplateLoader {
  private static instance: TemplateLoader | null = null
  private loaded = false

  static getInstance(): TemplateLoader {
    if (!TemplateLoader.instance) {
      TemplateLoader.instance = new TemplateLoader()
    }
    return TemplateLoader.instance
  }

  /**
   * Load all template files from API and register them with the promptManager
   */
  async loadTemplates(): Promise<void> {
    if (this.loaded) return

    try {
      // First, try to load templates from the API
      let templatesLoaded = false
      
      try {
        const response = await fetch('/api/templates')
        if (response.ok) {
          const data: TemplateApiResponse = await response.json()
          
          for (const apiTemplate of data.templates) {
            try {
              const template = convertApiTemplateToPromptTemplate(apiTemplate)
              promptManager.registerTemplate(template)
            } catch (error) {
              console.warn(`Failed to process template ${apiTemplate.id}:`, error)
            }
          }
          
          templatesLoaded = true
          console.log(`Loaded ${data.templates.length} templates from API`)
        }
      } catch (error) {
        console.warn('Failed to load templates from API, falling back to mock data:', error)
      }

      // If API loading failed, fall back to mock templates
      if (!templatesLoaded) {
        console.log('Loading fallback templates...')
        for (const [id, content] of Object.entries(FALLBACK_TEMPLATES)) {
          try {
            const template = promptManager.parsePromptyFile(content, `templates/${id}.prompty`)
            promptManager.registerTemplate(template)
          } catch (error) {
            console.warn(`Failed to load fallback template ${id}:`, error)
          }
        }
      }

      // Also load any legacy templates as converted versions
      await this.loadLegacyTemplates()

      this.loaded = true
      console.log('Templates loaded successfully')
    } catch (error) {
      console.error('Failed to load templates:', error)
      throw error
    }
  }

  /**
   * Convert legacy templates to new format
   */
  private async loadLegacyTemplates(): Promise<void> {
    const legacyTemplates = [
      {
        id: 'research-assistant',
        name: 'Research Assistant',
        description: 'Thorough analysis and evidence-based reasoning',
        prompt: 'You are a research assistant who provides thorough, evidence-based analysis. Consider multiple perspectives, cite relevant information when possible, and present balanced viewpoints.',
        category: 'analytical'
      }
    ]

    for (const legacy of legacyTemplates) {
      const template: PromptTemplate = {
        name: legacy.name,
        description: legacy.description,
        version: '1.0.0',
        authors: ['Legacy System'],
        created: new Date('2024-01-01'),
        updated: new Date(),
        category: legacy.category as any,
        tags: ['legacy', 'converted'],
        model: {
          preferred: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1000
        },
        variables: [],
        sample: {},
        test_cases: [],
        content: legacy.prompt,
        metrics: {
          usage_count: 0,
          avg_response_time: 0,
          success_rate: 1.0
        },
        security: {
          injection_protected: true,
          sanitize_inputs: true
        }
      }

      promptManager.registerTemplate(template)
    }
  }

  /**
   * Force reload templates from API
   */
  async reloadTemplates(): Promise<void> {
    this.loaded = false
    await this.loadTemplates()
  }

  /**
   * Get loading status
   */
  isLoaded(): boolean {
    return this.loaded
  }
}

export const templateLoader = TemplateLoader.getInstance()
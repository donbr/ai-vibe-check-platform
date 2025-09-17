import { PromptTemplate } from '../types/prompt'
import { promptManager } from './promptManager'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

// File system-based template loading for MCP
export class McpTemplateLoader {
  private static instance: McpTemplateLoader | null = null
  private loaded = false

  static getInstance(): McpTemplateLoader {
    if (!McpTemplateLoader.instance) {
      McpTemplateLoader.instance = new McpTemplateLoader()
    }
    return McpTemplateLoader.instance
  }

  /**
   * Load all .prompty template files from the file system
   */
  async loadTemplates(): Promise<void> {
    if (this.loaded) return

    try {
      // In Node.js environment (API routes), we can access file system
      if (typeof window === 'undefined') {
        await this.loadFromFileSystem()
      } else {
        // In browser environment, fall back to hardcoded templates
        await this.loadFallbackTemplates()
      }

      this.loaded = true
      console.log('MCP Templates loaded successfully')
    } catch (error) {
      console.error('Failed to load MCP templates:', error)
      // Always ensure we have some templates loaded
      await this.loadFallbackTemplates()
      this.loaded = true
    }
  }

  /**
   * Load templates from file system (Node.js environment)
   */
  private async loadFromFileSystem(): Promise<void> {
    try {
      // Get the prompts directory relative to the API route
      const promptsDir = path.join(process.cwd(), '..', 'prompts', 'templates')
      
      if (!fs.existsSync(promptsDir)) {
        console.warn('Prompts directory not found, using fallback templates')
        await this.loadFallbackTemplates()
        return
      }

      const categories = fs.readdirSync(promptsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

      for (const category of categories) {
        const categoryPath = path.join(promptsDir, category)
        const files = fs.readdirSync(categoryPath)
          .filter(file => file.endsWith('.prompty'))

        for (const file of files) {
          try {
            const filePath = path.join(categoryPath, file)
            const content = fs.readFileSync(filePath, 'utf-8')
            const template = this.parsePromptyFile(content, filePath)
            promptManager.registerTemplate(template)
          } catch (error) {
            console.warn(`Failed to load template ${file}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error loading from file system:', error)
      throw error
    }
  }

  /**
   * Parse .prompty file content
   */
  private parsePromptyFile(content: string, filePath: string): PromptTemplate {
    // Split frontmatter and content
    const parts = content.split('---')
    if (parts.length < 3) {
      throw new Error('Invalid .prompty file format')
    }

    const frontmatter = yaml.load(parts[1]) as Record<string, unknown>
    const templateContent = parts.slice(2).join('---').trim()

    return {
      name: frontmatter.name || path.basename(filePath, '.prompty'),
      description: frontmatter.description || '',
      version: frontmatter.version || '1.0.0',
      authors: frontmatter.authors || ['Unknown'],
      created: frontmatter.created ? new Date(frontmatter.created) : new Date(),
      updated: frontmatter.updated ? new Date(frontmatter.updated) : new Date(),
      category: frontmatter.category || 'general',
      tags: frontmatter.tags || [],
      model: frontmatter.model || {
        preferred: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1000
      },
      variables: frontmatter.variables || [],
      sample: frontmatter.sample || {},
      test_cases: frontmatter.test_cases || [],
      content: templateContent,
      metrics: frontmatter.metrics || {
        usage_count: 0,
        avg_response_time: 0,
        success_rate: 1.0
      },
      security: frontmatter.security || {
        injection_protected: true,
        sanitize_inputs: true
      }
    }
  }

  /**
   * Load hardcoded fallback templates
   */
  private async loadFallbackTemplates(): Promise<void> {
    const fallbackTemplates: PromptTemplate[] = [
      {
        name: "Helpful Assistant",
        description: "General purpose helpful AI assistant",
        version: "1.0.0",
        authors: ["MCP Fallback System"],
        created: new Date('2024-01-01'),
        updated: new Date(),
        category: "professional",
        tags: ["assistant", "general"],
        model: {
          preferred: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 1000
        },
        variables: [
          {
            name: "user_message",
            type: "string",
            description: "The user's message or question",
            required: true
          }
        ],
        sample: {
          user_message: "What is the capital of France?"
        },
        test_cases: [
          {
            id: "basic_question",
            name: "Basic Question Test",
            description: "Test basic question answering",
            inputs: {
              user_message: "What is 2 + 2?"
            },
            expected_outputs: {
              contains: ["4", "four"],
              min_length: 10
            },
            evaluation_criteria: ["Accurate answer", "Clear response"]
          }
        ],
        content: "You are a helpful AI assistant. You provide clear, accurate, and helpful responses to user questions.\n\nUser: {{user_message}}",
        metrics: {
          usage_count: 0,
          avg_response_time: 0,
          success_rate: 1.0
        },
        security: {
          injection_protected: true,
          sanitize_inputs: true
        }
      },
      {
        name: "Creative Writer",
        description: "A creative writer with vivid imagination",
        version: "1.0.0",
        authors: ["MCP Fallback System"],
        created: new Date('2024-01-01'),
        updated: new Date(),
        category: "creative",
        tags: ["creative", "writing", "storytelling"],
        model: {
          preferred: "gpt-4o-mini",
          temperature: 0.9,
          max_tokens: 1500
        },
        variables: [
          {
            name: "topic",
            type: "string",
            description: "The topic or theme for creative writing",
            required: true
          },
          {
            name: "style",
            type: "string",
            description: "Writing style preference",
            required: false,
            default: "narrative"
          }
        ],
        sample: {
          topic: "a magical forest",
          style: "narrative"
        },
        test_cases: [
          {
            id: "creative_story",
            name: "Creative Story Test",
            description: "Test creative writing ability",
            inputs: {
              topic: "a mysterious library",
              style: "narrative"
            },
            expected_outputs: {
              contains: ["library", "mysterious"],
              min_length: 100
            },
            evaluation_criteria: ["Creative imagination", "Engaging narrative"]
          }
        ],
        content: "You are a creative writer with vivid imagination. Write in {{style}} style about: {{topic}}",
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
    ]

    for (const template of fallbackTemplates) {
      promptManager.registerTemplate(template)
    }
  }

  /**
   * Force reload templates
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

export const mcpTemplateLoader = McpTemplateLoader.getInstance()
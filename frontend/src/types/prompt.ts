export interface PromptVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  default?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
}

export interface ModelConfiguration {
  preferred?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string[]
}

export interface PromptMetrics {
  usage_count: number
  avg_response_time: number
  success_rate: number
  last_used?: Date
  avg_word_count?: number
  user_ratings?: number[]
}

export interface SecuritySettings {
  injection_protected: boolean
  sanitize_inputs: boolean
  allowed_roles?: string[]
  max_input_length?: number
  forbidden_patterns?: string[]
}

export interface PromptTemplate {
  // Metadata
  name: string
  description: string
  version: string
  authors: string[]
  created: Date
  updated: Date
  
  // Classification
  category: 'educational' | 'creative' | 'analytical' | 'professional' | 'testing' | 'custom'
  tags: string[]
  
  // Configuration
  model: ModelConfiguration
  variables: PromptVariable[]
  
  // Content
  content: string // The actual prompt template with {{variable}} placeholders
  
  // Testing & Validation
  sample: Record<string, any> // Sample values for variables
  test_cases?: PromptTestCase[]
  
  // Analytics
  metrics: PromptMetrics
  
  // Security
  security: SecuritySettings
  
  // File metadata
  file_path?: string
  hash?: string // For change detection
}

export interface PromptTestCase {
  id: string
  name: string
  description: string
  inputs: Record<string, any>
  expected_outputs?: {
    contains?: string[]
    min_length?: number
    max_length?: number
    sentiment?: 'positive' | 'negative' | 'neutral'
    categories?: string[]
  }
  evaluation_criteria: string[]
}

export interface PromptExecution {
  template_id: string
  variables: Record<string, any>
  model_override?: ModelConfiguration
  timestamp: Date
  response?: string
  metrics?: {
    response_time: number
    token_count: number
    cost_estimate: number
    quality_score?: number
  }
  user_feedback?: {
    rating: number
    comments?: string
  }
}

export interface PromptLibrary {
  templates: PromptTemplate[]
  categories: string[]
  tags: string[]
  total_executions: number
  last_sync: Date
}

// Utility types for template processing
export interface ProcessedPrompt {
  content: string
  variables_used: string[]
  missing_variables: string[]
  model_config: ModelConfiguration
  security_violations: string[]
}

export interface PromptValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// Template creation and editing
export interface PromptTemplateRequest {
  name: string
  description: string
  category: string
  content: string
  variables?: Partial<PromptVariable>[]
  model?: Partial<ModelConfiguration>
  tags?: string[]
  security?: Partial<SecuritySettings>
}

export interface PromptTemplateUpdate {
  id: string
  changes: Partial<PromptTemplate>
  reason: string
  version_bump: 'patch' | 'minor' | 'major'
}
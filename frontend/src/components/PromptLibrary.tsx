'use client'

import { useState, useEffect } from 'react'
import { PromptTemplate } from '../types/prompt'
import { useMcp } from '../hooks/useMcp'

interface PromptLibraryProps {
  onSelectTemplate?: (template: PromptTemplate) => void
  onEditTemplate?: (template: PromptTemplate) => void
  onCreateNew?: () => void
  selectedTemplateId?: string
  showActions?: boolean
}

export default function PromptLibrary({ 
  onSelectTemplate, 
  onEditTemplate, 
  onCreateNew,
  selectedTemplateId,
  showActions = true
}: PromptLibraryProps) {
  // MCP Integration
  const mcp = useMcp()
  
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'usage'>('name')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const categories = ['all', 'educational', 'creative', 'analytical', 'professional', 'testing', 'custom']

  useEffect(() => {
    loadTemplates()
  }, [mcp.connected])

  const loadTemplates = async () => {
    if (!mcp.connected) {
      setLoading(true)
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await mcp.listTemplates()
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const templatesData = JSON.parse(result.content[0].text)
        setTemplates(templatesData.templates || [])
      }
    } catch (err) {
      setError(`Failed to load templates: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.created).getTime() - new Date(a.created).getTime()
        case 'updated':
          return new Date(b.updated).getTime() - new Date(a.updated).getTime()
        case 'usage':
          return (b.metrics.usage_count || 0) - (a.metrics.usage_count || 0)
        default:
          return 0
      }
    })

  const getCategoryColor = (category: string) => {
    const colors = {
      educational: 'bg-blue-100 text-blue-800',
      creative: 'bg-purple-100 text-purple-800',
      analytical: 'bg-green-100 text-green-800',
      professional: 'bg-gray-100 text-gray-800',
      testing: 'bg-orange-100 text-orange-800',
      custom: 'bg-pink-100 text-pink-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
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
          onClick={loadTemplates}
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prompt Library</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredAndSortedTemplates.length} templates available
          </p>
        </div>
        {showActions && onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create New Template
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="name">Sort by Name</option>
            <option value="created">Sort by Created</option>
            <option value="updated">Sort by Updated</option>
            <option value="usage">Sort by Usage</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredAndSortedTemplates.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm || selectedCategory !== 'all' 
            ? 'No templates match your search criteria.' 
            : 'No templates available. Create your first template!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTemplates.map(template => (
            <div
              key={`${template.name}-${template.version}`}
              className={`border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                selectedTemplateId === `${template.name}-${template.version}` 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              } bg-white dark:bg-gray-800`}
              onClick={() => onSelectTemplate?.(template)}
            >
              {/* Template Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    v{template.version}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {template.description}
              </p>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{template.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{formatDate(template.created)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated:</span>
                  <span>{formatDate(template.updated)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage:</span>
                  <span>{template.metrics.usage_count || 0} times</span>
                </div>
                {template.variables.length > 0 && (
                  <div className="flex justify-between">
                    <span>Variables:</span>
                    <span>{template.variables.length}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {showActions && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectTemplate?.(template)
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Use Template
                  </button>
                  {onEditTemplate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTemplate(template)
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { PromptTemplate, PromptVariable } from '../types/prompt'
import { templateEngine } from '../utils/templateEngine'

interface PromptVariableEditorProps {
  template: PromptTemplate | null
  variables: Record<string, any>
  onVariablesChange: (variables: Record<string, any>) => void
  onValidationChange?: (isValid: boolean, errors: string[]) => void
}

export default function PromptVariableEditor({ 
  template, 
  variables, 
  onVariablesChange,
  onValidationChange 
}: PromptVariableEditorProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [extractedVariables, setExtractedVariables] = useState<string[]>([])

  useEffect(() => {
    if (template) {
      // Extract variables from template content
      const templateVars = templateEngine.extractVariables(template.content)
      setExtractedVariables(templateVars)
      
      // Initialize variables with defaults if not already set
      const newVariables = { ...variables }
      let hasChanges = false

      template.variables.forEach(varDef => {
        if (!(varDef.name in newVariables) && varDef.default !== undefined) {
          newVariables[varDef.name] = varDef.default
          hasChanges = true
        }
      })

      if (hasChanges) {
        onVariablesChange(newVariables)
      }
    }
  }, [template])

  useEffect(() => {
    validateVariables()
  }, [variables, template])

  const validateVariables = () => {
    const errors: Record<string, string> = {}
    let isValid = true

    if (template) {
      template.variables.forEach(varDef => {
        const value = variables[varDef.name]
        
        // Required validation
        if (varDef.required && (value === undefined || value === null || value === '')) {
          errors[varDef.name] = 'This field is required'
          isValid = false
          return
        }

        // Skip validation for empty optional fields
        if (!varDef.required && (value === undefined || value === null || value === '')) {
          return
        }

        // Type validation
        if (varDef.type === 'number' && isNaN(Number(value))) {
          errors[varDef.name] = 'Must be a valid number'
          isValid = false
        }

        if (varDef.type === 'boolean' && typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors[varDef.name] = 'Must be true or false'
          isValid = false
        }

        // Validation rules
        if (varDef.validation && value !== undefined && value !== null && value !== '') {
          if (varDef.validation.min !== undefined && Number(value) < varDef.validation.min) {
            errors[varDef.name] = `Must be at least ${varDef.validation.min}`
            isValid = false
          }

          if (varDef.validation.max !== undefined && Number(value) > varDef.validation.max) {
            errors[varDef.name] = `Must be at most ${varDef.validation.max}`
            isValid = false
          }

          if (varDef.validation.pattern && !new RegExp(varDef.validation.pattern).test(String(value))) {
            errors[varDef.name] = 'Invalid format'
            isValid = false
          }

          if (varDef.validation.options && !varDef.validation.options.includes(String(value))) {
            errors[varDef.name] = `Must be one of: ${varDef.validation.options.join(', ')}`
            isValid = false
          }
        }
      })
    }

    setValidationErrors(errors)
    onValidationChange?.(isValid, Object.values(errors))
  }

  const handleVariableChange = (name: string, value: any) => {
    const newVariables = { ...variables, [name]: value }
    onVariablesChange(newVariables)
  }

  const renderVariableInput = (varDef: PromptVariable) => {
    const value = variables[varDef.name]
    const error = validationErrors[varDef.name]
    const isUsed = extractedVariables.includes(varDef.name)

    if (varDef.validation?.options) {
      // Dropdown for predefined options
      return (
        <select
          value={value || ''}
          onChange={(e) => handleVariableChange(varDef.name, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <option value="">Select {varDef.name}</option>
          {varDef.validation.options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    if (varDef.type === 'boolean') {
      // Toggle for boolean
      return (
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleVariableChange(varDef.name, e.target.checked)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value === true || value === 'true' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value === true || value === 'true' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {value === true || value === 'true' ? 'True' : 'False'}
            </span>
          </label>
        </div>
      )
    }

    if (varDef.type === 'array') {
      // Textarea for array (JSON format)
      return (
        <textarea
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              handleVariableChange(varDef.name, parsed)
            } catch {
              handleVariableChange(varDef.name, e.target.value)
            }
          }}
          placeholder="Enter JSON array or list..."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          rows={3}
        />
      )
    }

    // Default text input
    return (
      <input
        type={varDef.type === 'number' ? 'number' : 'text'}
        value={value || ''}
        onChange={(e) => handleVariableChange(varDef.name, e.target.value)}
        placeholder={varDef.default ? `Default: ${varDef.default}` : `Enter ${varDef.name}...`}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
    )
  }

  if (!template || template.variables.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {!template ? 'Select a template to configure variables' : 'This template has no configurable variables.'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Template Variables
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure the variables used in the "{template.name}" template.
        </p>
      </div>

      <div className="space-y-4">
        {template.variables.map(varDef => {
          const error = validationErrors[varDef.name]
          const isUsed = extractedVariables.includes(varDef.name)
          
          return (
            <div key={varDef.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {varDef.name}
                  {varDef.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {!isUsed && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Unused
                    </span>
                  )}
                </label>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {varDef.type}
                  </span>
                  {!varDef.required && (
                    <span className="text-gray-400">optional</span>
                  )}
                </div>
              </div>
              
              {varDef.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {varDef.description}
                </p>
              )}
              
              {renderVariableInput(varDef)}
              
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              
              {varDef.validation?.min !== undefined && varDef.validation?.max !== undefined && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Range: {varDef.validation.min} - {varDef.validation.max}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Variable Summary */}
      <div className="border-t pt-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Total Variables: {template.variables.length}</span>
          <span>Required: {template.variables.filter(v => v.required).length}</span>
          <span>Configured: {Object.keys(variables).length}</span>
        </div>
      </div>

      {/* Validation Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
            Validation Errors:
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>• {field}: {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
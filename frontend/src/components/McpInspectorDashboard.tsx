'use client'

import { useState, useEffect } from 'react'
import { useMcp } from '../hooks/useMcp'

interface McpInspectorDashboardProps {
  onConnect?: () => void
  onDisconnect?: () => void
}

type TabType = 'tools' | 'resources' | 'prompts' | 'server' | 'logs'

export default function McpInspectorDashboard({
  onConnect,
  onDisconnect
}: McpInspectorDashboardProps) {
  const mcp = useMcp()
  const [activeTab, setActiveTab] = useState<TabType>('tools')
  const [selectedTool, setSelectedTool] = useState<any>(null)
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({})
  const [toolResult, setToolResult] = useState<any>(null)
  const [toolLoading, setToolLoading] = useState(false)
  const [toolError, setToolError] = useState<string>('')

  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [resourceContent, setResourceContent] = useState<any>(null)
  const [resourceLoading, setResourceLoading] = useState(false)

  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [promptArgs, setPromptArgs] = useState<Record<string, any>>({})
  const [promptResult, setPromptResult] = useState<any>(null)
  const [promptLoading, setPromptLoading] = useState(false)

  useEffect(() => {
    if (mcp.connected) {
      onConnect?.()
    }
  }, [mcp.connected, onConnect])

  const handleToolExecute = async () => {
    if (!selectedTool || !mcp.connected) return

    setToolLoading(true)
    setToolError('')
    setToolResult(null)

    try {
      const result = await mcp.callTool(selectedTool.name, toolArgs)
      setToolResult(result)
    } catch (error) {
      setToolError(error instanceof Error ? error.message : 'Tool execution failed')
    } finally {
      setToolLoading(false)
    }
  }

  const handleResourceRead = async (resource: any) => {
    if (!resource || !mcp.connected) return

    setResourceLoading(true)
    setSelectedResource(resource)

    try {
      const result = await mcp.readResource(resource.uri)
      setResourceContent(result)
    } catch (error) {
      console.error('Failed to read resource:', error)
      setResourceContent({ error: error instanceof Error ? error.message : 'Failed to read resource' })
    } finally {
      setResourceLoading(false)
    }
  }

  const handlePromptGet = async () => {
    if (!selectedPrompt || !mcp.connected) return

    setPromptLoading(true)
    setPromptResult(null)

    try {
      const result = await mcp.getPrompt(selectedPrompt.name, promptArgs)
      setPromptResult(result)
    } catch (error) {
      console.error('Failed to get prompt:', error)
      setPromptResult({ error: error instanceof Error ? error.message : 'Failed to get prompt' })
    } finally {
      setPromptLoading(false)
    }
  }

  const updateToolArg = (key: string, value: any) => {
    setToolArgs(prev => ({ ...prev, [key]: value }))
  }

  const updatePromptArg = (key: string, value: any) => {
    setPromptArgs(prev => ({ ...prev, [key]: value }))
  }

  const formatJsonDisplay = (data: any) => {
    if (!data) return null

    try {
      return (
        <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-sm overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      )
    } catch {
      return <div className="p-4 text-gray-500">Unable to display content</div>
    }
  }

  const renderTabButton = (tab: TabType, label: string, count?: number) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-500 text-white border-b-2 border-blue-500'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {label}
      {count !== undefined && <span className="ml-2 opacity-75">({count})</span>}
    </button>
  )

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          MCP Inspector
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Interactive testing and debugging interface for Model Context Protocol servers
        </p>

        {/* Connection Status */}
        <div className="mt-4 flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            mcp.connected
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${mcp.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{mcp.connected ? 'Connected' : 'Disconnected'}</span>
          </div>

          {mcp.serverInfo && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Server: {mcp.serverInfo.serverInfo?.name || 'Unknown'}
              v{mcp.serverInfo.serverInfo?.version || '?'}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={mcp.connect}
              disabled={mcp.connected || mcp.loading}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect
            </button>
            <button
              onClick={() => {
                mcp.disconnect()
                onDisconnect?.()
              }}
              disabled={!mcp.connected || mcp.loading}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
            <button
              onClick={mcp.refreshAll}
              disabled={!mcp.connected || mcp.loading}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh All
            </button>
          </div>
        </div>

        {mcp.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:text-red-200">
            {mcp.error}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-1">
          {renderTabButton('tools', 'Tools', mcp.tools.length)}
          {renderTabButton('resources', 'Resources', mcp.resources.length + mcp.resourceTemplates.length)}
          {renderTabButton('prompts', 'Prompts', mcp.prompts.length)}
          {renderTabButton('server', 'Server Info')}
          {renderTabButton('logs', 'Message History', mcp.messageHistory.length)}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tools List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Tools</h3>
              {mcp.tools.length === 0 ? (
                <p className="text-gray-500">No tools available</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mcp.tools.map((tool, index) => (
                    <div
                      key={tool.name || index}
                      onClick={() => {
                        setSelectedTool(tool)
                        setToolArgs({})
                        setToolResult(null)
                        setToolError('')
                      }}
                      className={`p-4 border rounded cursor-pointer transition-colors ${
                        selectedTool?.name === tool.name
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tool Testing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tool Testing</h3>
              {!selectedTool ? (
                <p className="text-gray-500">Select a tool to test</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{selectedTool.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedTool.description}</p>

                    {/* Tool Arguments */}
                    {selectedTool.inputSchema?.properties && (
                      <div className="space-y-3">
                        <h5 className="font-medium">Arguments:</h5>
                        {Object.entries(selectedTool.inputSchema.properties).map(([key, schema]: [string, any]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium mb-1">
                              {key}
                              {selectedTool.inputSchema.required?.includes(key) && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            <input
                              type={schema.type === 'number' ? 'number' : 'text'}
                              value={toolArgs[key] || ''}
                              onChange={(e) => updateToolArg(key, schema.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                              placeholder={schema.description}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            {schema.description && (
                              <p className="text-xs text-gray-500 mt-1">{schema.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handleToolExecute}
                      disabled={!mcp.connected || toolLoading}
                      className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {toolLoading ? 'Executing...' : 'Execute Tool'}
                    </button>

                    {toolError && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:text-red-200">
                        {toolError}
                      </div>
                    )}

                    {toolResult && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Result:</h5>
                        {formatJsonDisplay(toolResult)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resources List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Resources</h3>

              {/* Direct Resources */}
              {mcp.resources.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Direct Resources</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mcp.resources.map((resource, index) => (
                      <div
                        key={resource.uri || index}
                        onClick={() => handleResourceRead(resource)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedResource?.uri === resource.uri
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        <div className="font-medium text-sm">{resource.name || resource.uri}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{resource.mimeType}</div>
                        <div className="text-xs text-gray-500 truncate">{resource.uri}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resource Templates */}
              {mcp.resourceTemplates.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Resource Templates</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mcp.resourceTemplates.map((template, index) => (
                      <div
                        key={template.uriTemplate || index}
                        className="p-3 border rounded border-gray-200 dark:border-gray-700"
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{template.mimeType}</div>
                        <div className="text-xs text-gray-500 font-mono">{template.uriTemplate}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mcp.resources.length === 0 && mcp.resourceTemplates.length === 0 && (
                <p className="text-gray-500">No resources available</p>
              )}
            </div>

            {/* Resource Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resource Content</h3>
              {!selectedResource ? (
                <p className="text-gray-500">Select a resource to view its content</p>
              ) : resourceLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2">Loading resource...</span>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h4 className="font-medium">{selectedResource.name || selectedResource.uri}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedResource.mimeType} | {selectedResource.uri}
                    </p>
                  </div>
                  {formatJsonDisplay(resourceContent)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prompts List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Prompts</h3>
              {mcp.prompts.length === 0 ? (
                <p className="text-gray-500">No prompts available</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mcp.prompts.map((prompt, index) => (
                    <div
                      key={prompt.name || index}
                      onClick={() => {
                        setSelectedPrompt(prompt)
                        setPromptArgs({})
                        setPromptResult(null)
                      }}
                      className={`p-4 border rounded cursor-pointer transition-colors ${
                        selectedPrompt?.name === prompt.name
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      <div className="font-medium">{prompt.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{prompt.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Testing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prompt Testing</h3>
              {!selectedPrompt ? (
                <p className="text-gray-500">Select a prompt to test</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{selectedPrompt.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedPrompt.description}</p>

                    {/* Prompt Arguments */}
                    {selectedPrompt.arguments && selectedPrompt.arguments.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium">Arguments:</h5>
                        {selectedPrompt.arguments.map((arg: any) => (
                          <div key={arg.name}>
                            <label className="block text-sm font-medium mb-1">
                              {arg.name}
                              {arg.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <input
                              type="text"
                              value={promptArgs[arg.name] || ''}
                              onChange={(e) => updatePromptArg(arg.name, e.target.value)}
                              placeholder={arg.description}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            {arg.description && (
                              <p className="text-xs text-gray-500 mt-1">{arg.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handlePromptGet}
                      disabled={!mcp.connected || promptLoading}
                      className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promptLoading ? 'Getting Prompt...' : 'Get Prompt'}
                    </button>

                    {promptResult && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Prompt Messages:</h5>
                        {formatJsonDisplay(promptResult)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Server Info Tab */}
        {activeTab === 'server' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Server Information</h3>

            {!mcp.serverInfo ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No server information available</p>
                <button
                  onClick={mcp.getServerInfo}
                  disabled={!mcp.connected || mcp.loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Get Server Info
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Server Details</h4>
                  {formatJsonDisplay(mcp.serverInfo.serverInfo)}
                </div>
                <div>
                  <h4 className="font-medium mb-4">Capabilities</h4>
                  {formatJsonDisplay(mcp.serverInfo.capabilities)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message History Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Message History</h3>
              <button
                onClick={mcp.clearMessageHistory}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear History
              </button>
            </div>

            {mcp.messageHistory.length === 0 ? (
              <p className="text-gray-500">No messages yet</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {mcp.messageHistory.map((entry) => (
                  <div key={entry.id} className="border rounded p-4 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{entry.request.method}</span>
                      <span className="text-xs text-gray-500">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium">Request</summary>
                        <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-auto">
                          {JSON.stringify(entry.request, null, 2)}
                        </pre>
                      </details>

                      {entry.response && (
                        <details className="text-sm">
                          <summary className="cursor-pointer font-medium">Response</summary>
                          <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-auto">
                            {JSON.stringify(entry.response, null, 2)}
                          </pre>
                        </details>
                      )}

                      {entry.error && (
                        <div className="text-sm">
                          <span className="font-medium text-red-600">Error:</span>
                          <pre className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                            {JSON.stringify(entry.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
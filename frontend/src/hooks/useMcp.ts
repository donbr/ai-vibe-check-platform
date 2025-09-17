import { useState, useEffect, useCallback } from 'react';

export interface UseMcpState {
  connected: boolean;
  loading: boolean;
  error: string | null;
  tools: any[];
  prompts: any[];
  resources: any[];
  resourceTemplates: any[];
  serverInfo: any | null;
  messageHistory: any[];
}

export interface UseMcpActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  callTool: (name: string, args: Record<string, unknown>) => Promise<any>;
  getPrompt: (name: string, args?: Record<string, unknown>) => Promise<any>;

  // Standard MCP Resource operations
  listResources: () => Promise<any>;
  listResourceTemplates: () => Promise<any>;
  readResource: (uri: string) => Promise<any>;

  // Server information
  getServerInfo: () => Promise<any>;

  // Refresh operations
  refreshTools: () => Promise<void>;
  refreshPrompts: () => Promise<void>;
  refreshResources: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Message history
  clearMessageHistory: () => void;

  // Template convenience methods (legacy)
  listTemplates: () => Promise<any>;
  getTemplate: (templateId: string) => Promise<any>;
  processTemplate: (templateId: string, variables: Record<string, unknown>) => Promise<any>;
  evaluateTemplate: (templateId: string, apiKey: string, testExecution?: boolean) => Promise<any>;
  quickEvaluate: (templateId: string, variables: Record<string, unknown>) => Promise<any>;
  runTestCase: (templateId: string, testCaseId: string, apiKey: string) => Promise<any>;
}

export function useMcp(): UseMcpState & UseMcpActions {
  const [state, setState] = useState<UseMcpState>({
    connected: false,
    loading: false,
    error: null,
    tools: [],
    prompts: [],
    resources: [],
    resourceTemplates: [],
    serverInfo: null,
    messageHistory: []
  });

  const updateState = useCallback((updates: Partial<UseMcpState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error, loading: false });
  }, [updateState]);

  // Helper function for making MCP requests with message history tracking
  const makeMcpRequest = useCallback(async (method: string, params: any = {}) => {
    const requestId = Date.now();
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    };

    // Add to message history
    const historyEntry = {
      id: requestId,
      timestamp: new Date(),
      request,
      response: null,
      error: null
    };

    updateState(prev => ({
      messageHistory: [...prev.messageHistory.slice(-49), historyEntry] // Keep last 50 messages
    }));

    try {
      const response = await fetch('/api/mcp/http', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2025-06-18'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Update message history with response
      updateState(prev => ({
        messageHistory: prev.messageHistory.map(entry =>
          entry.id === requestId
            ? { ...entry, response: result }
            : entry
        )
      }));

      if (result.error) {
        const error = new Error(result.error.message || `${method} failed`);
        // Update message history with error
        updateState(prev => ({
          messageHistory: prev.messageHistory.map(entry =>
            entry.id === requestId
              ? { ...entry, error: result.error }
              : entry
          )
        }));
        throw error;
      }

      return result.result;
    } catch (error) {
      // Update message history with error
      updateState(prev => ({
        messageHistory: prev.messageHistory.map(entry =>
          entry.id === requestId
            ? { ...entry, error: error instanceof Error ? error.message : String(error) }
            : entry
        )
      }));
      throw error;
    }
  }, [updateState]);

  // Standard MCP tool operations
  const callTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    updateState({ loading: true, error: null });
    try {
      const result = await makeMcpRequest('tools/call', {
        name,
        arguments: args
      });
      updateState({ loading: false });
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to call tool ${name}`);
      throw error;
    }
  }, [updateState, setError, makeMcpRequest]);

  const getPrompt = useCallback(async (name: string, args?: Record<string, unknown>) => {
    updateState({ loading: true, error: null });
    try {
      const result = await makeMcpRequest('prompts/get', {
        name,
        arguments: args || {}
      });
      updateState({ loading: false });
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to get prompt ${name}`);
      throw error;
    }
  }, [updateState, setError, makeMcpRequest]);

  // Standard MCP resource operations
  const listResources = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const result = await makeMcpRequest('resources/list');
      updateState({ loading: false });
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to list resources');
      throw error;
    }
  }, [updateState, setError, makeMcpRequest]);

  const listResourceTemplates = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const result = await makeMcpRequest('resources/templates/list');
      updateState({ loading: false });
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to list resource templates');
      throw error;
    }
  }, [updateState, setError, makeMcpRequest]);

  const readResource = useCallback(async (uri: string) => {
    updateState({ loading: true, error: null });
    try {
      const result = await makeMcpRequest('resources/read', { uri });
      updateState({ loading: false });
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to read resource ${uri}`);
      throw error;
    }
  }, [updateState, setError, makeMcpRequest]);

  // Server information
  const getServerInfo = useCallback(async () => {
    try {
      const result = await makeMcpRequest('initialize');
      updateState({ serverInfo: result });
      return result;
    } catch (error) {
      console.warn('Failed to get server info:', error);
      return null;
    }
  }, [updateState, makeMcpRequest]);

  // Message history management
  const clearMessageHistory = useCallback(() => {
    updateState({ messageHistory: [] });
  }, [updateState]);

  const refreshTools = useCallback(async () => {
    try {
      const result = await makeMcpRequest('tools/list');
      updateState({ tools: result?.tools || [] });
    } catch (error) {
      console.warn('Failed to refresh tools:', error);
    }
  }, [updateState, makeMcpRequest]);

  const refreshPrompts = useCallback(async () => {
    try {
      const result = await makeMcpRequest('prompts/list');
      updateState({ prompts: result?.prompts || [] });
    } catch (error) {
      console.warn('Failed to refresh prompts:', error);
    }
  }, [updateState, makeMcpRequest]);

  const refreshResources = useCallback(async () => {
    try {
      const [resources, resourceTemplates] = await Promise.all([
        makeMcpRequest('resources/list').catch(() => ({ resources: [] })),
        makeMcpRequest('resources/templates/list').catch(() => ({ resourceTemplates: [] }))
      ]);
      updateState({
        resources: resources?.resources || [],
        resourceTemplates: resourceTemplates?.resourceTemplates || []
      });
    } catch (error) {
      console.warn('Failed to refresh resources:', error);
    }
  }, [updateState, makeMcpRequest]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshTools(),
      refreshPrompts(),
      refreshResources(),
      getServerInfo()
    ]);
  }, [refreshTools, refreshPrompts, refreshResources, getServerInfo]);

  const connect = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      // Test connection by listing tools
      const result = await makeMcpRequest('tools/list');
      updateState({ connected: true, loading: false, tools: result?.tools || [] });

      // Refresh all data
      await refreshAll();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect to MCP server');
    }
  }, [updateState, setError, makeMcpRequest, refreshAll]);

  const disconnect = useCallback(async () => {
    updateState({
      connected: false,
      loading: false,
      tools: [],
      prompts: [],
      resources: [],
      resourceTemplates: [],
      serverInfo: null,
      messageHistory: [],
      error: null
    });
  }, [updateState]);

  // Template convenience methods
  const listTemplates = useCallback(async () => {
    return callTool('list_templates', {});
  }, [callTool]);

  const getTemplate = useCallback(async (templateId: string) => {
    return callTool('get_template', { templateId });
  }, [callTool]);

  const processTemplate = useCallback(async (templateId: string, variables: Record<string, unknown>) => {
    return callTool('process_template', { templateId, variables });
  }, [callTool]);

  const evaluateTemplate = useCallback(async (templateId: string, apiKey: string, testExecution = false) => {
    return callTool('evaluate_template', { templateId, apiKey, testExecution });
  }, [callTool]);

  const quickEvaluate = useCallback(async (templateId: string, variables: Record<string, unknown>) => {
    return callTool('quick_evaluate', { templateId, variables });
  }, [callTool]);

  const runTestCase = useCallback(async (templateId: string, testCaseId: string, apiKey: string) => {
    return callTool('run_test_case', { templateId, testCaseId, apiKey });
  }, [callTool]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  return {
    ...state,
    connect,
    disconnect,
    callTool,
    getPrompt,

    // Standard MCP operations
    listResources,
    listResourceTemplates,
    readResource,
    getServerInfo,

    // Refresh operations
    refreshTools,
    refreshPrompts,
    refreshResources,
    refreshAll,

    // Message history
    clearMessageHistory,

    // Template convenience methods (legacy)
    listTemplates,
    getTemplate,
    processTemplate,
    evaluateTemplate,
    quickEvaluate,
    runTestCase
  };
}
import { useState, useEffect, useCallback } from 'react';

export interface UseMcpState {
  connected: boolean;
  loading: boolean;
  error: string | null;
  tools: any[];
  prompts: any[];
}

export interface UseMcpActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  callTool: (name: string, args: Record<string, unknown>) => Promise<any>;
  getPrompt: (name: string, args?: Record<string, unknown>) => Promise<any>;
  listTemplates: () => Promise<any>;
  getTemplate: (templateId: string) => Promise<any>;
  processTemplate: (templateId: string, variables: Record<string, unknown>) => Promise<any>;
  evaluateTemplate: (templateId: string, apiKey: string, testExecution?: boolean) => Promise<any>;
  quickEvaluate: (templateId: string, variables: Record<string, unknown>) => Promise<any>;
  runTestCase: (templateId: string, testCaseId: string, apiKey: string) => Promise<any>;
  refreshTools: () => Promise<void>;
  refreshPrompts: () => Promise<void>;
}

export function useMcp(): UseMcpState & UseMcpActions {
  const [state, setState] = useState<UseMcpState>({
    connected: false,
    loading: false,
    error: null,
    tools: [],
    prompts: []
  });

  const updateState = useCallback((updates: Partial<UseMcpState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error, loading: false });
  }, [updateState]);

  // Simple HTTP-based MCP client since mcp-handler provides HTTP endpoints
  const callTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    updateState({ loading: true, error: null });
    try {
      const response = await fetch('/api/mcp/http', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name,
            arguments: args
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      updateState({ loading: false });
      
      if (result.error) {
        throw new Error(result.error.message || 'Tool call failed');
      }
      
      return result.result;
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to call tool ${name}`);
      throw error;
    }
  }, [updateState, setError]);

  const getPrompt = useCallback(async (name: string, args?: Record<string, unknown>) => {
    updateState({ loading: true, error: null });
    try {
      const response = await fetch('/api/mcp/http', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'prompts/get',
          params: {
            name,
            arguments: args || {}
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      updateState({ loading: false });
      
      if (result.error) {
        throw new Error(result.error.message || 'Prompt get failed');
      }
      
      return result.result;
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to get prompt ${name}`);
      throw error;
    }
  }, [updateState, setError]);

  const refreshTools = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp/http', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
          params: {}
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (!result.error) {
          updateState({ tools: result.result?.tools || [] });
        }
      }
    } catch (error) {
      console.warn('Failed to refresh tools:', error);
    }
  }, [updateState]);

  const refreshPrompts = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp/http', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'prompts/list',
          params: {}
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (!result.error) {
          updateState({ prompts: result.result?.prompts || [] });
        }
      }
    } catch (error) {
      console.warn('Failed to refresh prompts:', error);
    }
  }, [updateState]);

  const connect = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      // Test connection by listing tools
      const response = await fetch('/api/mcp/http', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
          params: {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'Connection failed');
      }

      updateState({ connected: true, loading: false, tools: result.result?.tools || [] });
      
      // Also refresh prompts
      await refreshPrompts();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect to MCP server');
    }
  }, [updateState, setError, refreshPrompts]);

  const disconnect = useCallback(async () => {
    updateState({ 
      connected: false, 
      loading: false, 
      tools: [], 
      prompts: [],
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
    listTemplates,
    getTemplate,
    processTemplate,
    evaluateTemplate,
    quickEvaluate,
    runTestCase,
    refreshTools,
    refreshPrompts
  };
}
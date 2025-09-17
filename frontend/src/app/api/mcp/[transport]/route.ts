import { NextRequest, NextResponse } from 'next/server'
import { promptManager } from '@/utils/promptManager'
import { promptEvaluator } from '@/utils/promptEvaluator'
import { mcpTemplateLoader } from '@/utils/mcpTemplateLoader'

// Initialize template loader
mcpTemplateLoader.loadTemplates().catch(console.error);

// MCP server info
const SERVER_INFO = {
  name: 'ai-vibe-check-platform',
  version: '1.0.0',
  capabilities: {
    tools: {},
    prompts: {},
  },
};

// Available tools
const TOOLS = [
  {
    name: 'list_templates',
    description: 'List all available prompt templates',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_template',
    description: 'Get a specific template by ID',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID' },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'process_template',
    description: 'Process a template with variables',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID' },
        variables: { type: 'object', description: 'Template variables' },
      },
      required: ['templateId', 'variables'],
    },
  },
  {
    name: 'evaluate_template',
    description: 'Evaluate a template against its test cases',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID' },
        apiKey: { type: 'string', description: 'OpenAI API key' },
        testExecution: { type: 'boolean', description: 'Whether to execute tests' },
      },
      required: ['templateId', 'apiKey'],
    },
  },
  {
    name: 'quick_evaluate',
    description: 'Quick evaluation of template without test execution',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID' },
        variables: { type: 'object', description: 'Template variables' },
      },
      required: ['templateId', 'variables'],
    },
  },
  {
    name: 'run_test_case',
    description: 'Run a specific test case for a template',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID' },
        testCaseId: { type: 'string', description: 'Test case ID' },
        apiKey: { type: 'string', description: 'OpenAI API key' },
      },
      required: ['templateId', 'testCaseId', 'apiKey'],
    },
  },
];

// Tool execution handlers
async function executeListTemplates() {
  const templates = promptManager.getAllTemplates();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          templates: templates.map(t => ({
            id: `${t.category}-${t.name.toLowerCase().replace(/\s+/g, '-')}-${t.version}`,
            name: t.name,
            description: t.description,
            category: t.category,
            version: t.version,
            variables: t.variables
          })),
          count: templates.length
        }, null, 2)
      }
    ]
  };
}

async function executeGetTemplate(args: { templateId: string }) {
  const { templateId } = args;
  const template = promptManager.getTemplate(templateId);
  if (!template) {
    throw new Error(`Template '${templateId}' not found`);
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(template, null, 2)
      }
    ]
  };
}

async function executeProcessTemplate(args: { templateId: string; variables: Record<string, any> }) {
  const { templateId, variables } = args;
  const template = promptManager.getTemplate(templateId);
  if (!template) {
    throw new Error(`Template '${templateId}' not found`);
  }

  const processed = promptManager.processTemplate(template, variables);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(processed, null, 2)
      }
    ]
  };
}

async function executeEvaluateTemplate(args: { templateId: string; apiKey: string; testExecution?: boolean }) {
  const { templateId, apiKey, testExecution = false } = args;
  const template = promptManager.getTemplate(templateId);
  if (!template) {
    throw new Error(`Template '${templateId}' not found`);
  }

  const testExecutor = testExecution ? async (prompt: string, userMessage: string) => {
    return {
      response: `Mock response for: ${userMessage}`,
      responseTime: Math.random() * 2000 + 500,
      tokenCount: Math.floor(Math.random() * 200 + 50)
    };
  } : undefined;

  const evaluation = await promptEvaluator.evaluateTemplate(template, apiKey, testExecutor);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(evaluation, null, 2)
      }
    ]
  };
}

async function executeQuickEvaluate(args: { templateId: string; variables: Record<string, any> }) {
  const { templateId, variables } = args;
  const template = promptManager.getTemplate(templateId);
  if (!template) {
    throw new Error(`Template '${templateId}' not found`);
  }

  const evaluation = promptEvaluator.quickEvaluate(template, variables);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(evaluation, null, 2)
      }
    ]
  };
}

async function executeRunTestCase(args: { templateId: string; testCaseId: string }) {
  const { templateId, testCaseId } = args;
  const template = promptManager.getTemplate(templateId);
  if (!template) {
    throw new Error(`Template '${templateId}' not found`);
  }

  const testCase = template.test_cases?.find(tc => tc.id === testCaseId);
  if (!testCase) {
    throw new Error(`Test case '${testCaseId}' not found in template '${templateId}'`);
  }

  const processed = promptManager.processTemplate(template, testCase.inputs);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          testCase,
          processedPrompt: processed,
          status: "ready_for_execution"
        }, null, 2)
      }
    ]
  };
}

// Handle JSON-RPC requests
async function handleJsonRpcRequest(method: string, params: any) {
  switch (method) {
    case 'tools/list':
      return { tools: TOOLS };

    case 'tools/call':
      const { name, arguments: args } = params;
      switch (name) {
        case 'list_templates':
          return await executeListTemplates();
        case 'get_template':
          return await executeGetTemplate(args);
        case 'process_template':
          return await executeProcessTemplate(args);
        case 'evaluate_template':
          return await executeEvaluateTemplate(args);
        case 'quick_evaluate':
          return await executeQuickEvaluate(args);
        case 'run_test_case':
          return await executeRunTestCase(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

    case 'prompts/list':
      const templates = promptManager.getAllTemplates();
      const prompts = templates.map(template => ({
        name: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${template.version}`,
        description: template.description,
      }));

      // Add the generic template execution prompt
      prompts.unshift({
        name: 'template-execution',
        description: 'Execute a prompt template with specific variables',
      });

      return { prompts };

    case 'prompts/get':
      const { name: promptName, arguments: promptArgs } = params;

      if (promptName === 'template-execution') {
        const { templateId, variables = {} } = promptArgs;
        const template = promptManager.getTemplate(templateId);
        if (!template) {
          throw new Error(`Template '${templateId}' not found`);
        }

        const processed = promptManager.processTemplate(template, variables);

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: processed.content
              }
            }
          ]
        };
      }

      // Handle template-specific prompts
      const allTemplates = promptManager.getAllTemplates();
      const template = allTemplates.find(t =>
        `${t.name.toLowerCase().replace(/\s+/g, '-')}-${t.version}` === promptName
      );

      if (!template) {
        throw new Error(`Prompt '${promptName}' not found`);
      }

      const variables = promptArgs || {};
      const processed = promptManager.processTemplate(template, variables);

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: processed.content
            }
          }
        ]
      };

    case 'initialize':
      return {
        protocolVersion: '2025-06-18',
        capabilities: SERVER_INFO.capabilities,
        serverInfo: SERVER_INFO,
      };

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

// HTTP endpoint handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle JSON-RPC 2.0 requests
    if (body.jsonrpc === '2.0' && body.method) {
      try {
        const result = await handleJsonRpcRequest(body.method, body.params || {});

        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          result,
        });
      } catch (error) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid JSON-RPC request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('MCP Server error:', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    status: 'running',
    protocol: 'mcp-2025-06-18',
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
    },
  });
}
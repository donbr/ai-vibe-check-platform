import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { promptEvaluator } from "@/utils/promptEvaluator";
import { promptManager } from "@/utils/promptManager";
import { mcpTemplateLoader } from "@/utils/mcpTemplateLoader";

// Initialize MCP template loader
mcpTemplateLoader.loadTemplates().catch(console.error);

const handler = createMcpHandler(
  (server) => {
    // Template Management Tools
    server.tool(
      "list_templates",
      "List all available prompt templates",
      {},
      async () => {
        const templates = promptManager.getAllTemplates();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              templates: templates.map(t => ({
                id: `${t.name}-${t.version}`,
                name: t.name,
                description: t.description,
                category: t.category,
                version: t.version,
                variables: t.variables
              })),
              count: templates.length
            }, null, 2)
          }]
        };
      }
    );

    server.tool(
      "get_template",
      "Get a specific template by ID",
      { templateId: z.string() },
      async ({ templateId }) => {
        const template = promptManager.getTemplate(templateId);
        if (!template) {
          throw new Error(`Template '${templateId}' not found`);
        }
        return {
          content: [{
            type: "text",
            text: JSON.stringify(template, null, 2)
          }]
        };
      }
    );

    server.tool(
      "process_template",
      "Process a template with variables",
      {
        templateId: z.string(),
        variables: z.record(z.any())
      },
      async ({ templateId, variables }) => {
        const template = promptManager.getTemplate(templateId);
        if (!template) {
          throw new Error(`Template '${templateId}' not found`);
        }
        
        const processed = promptManager.processTemplate(template, variables);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(processed, null, 2)
          }]
        };
      }
    );

    // Evaluation Tools
    server.tool(
      "evaluate_template",
      "Evaluate a template against its test cases",
      {
        templateId: z.string(),
        apiKey: z.string(),
        testExecution: z.boolean().optional().default(false)
      },
      async ({ templateId, apiKey, testExecution }) => {
        const template = promptManager.getTemplate(templateId);
        if (!template) {
          throw new Error(`Template '${templateId}' not found`);
        }

        const testExecutor = testExecution ? async (prompt: string, userMessage: string) => {
          // Mock execution for now - replace with actual API call
          return {
            response: `Mock response for: ${userMessage}`,
            responseTime: Math.random() * 2000 + 500,
            tokenCount: Math.floor(Math.random() * 200 + 50)
          };
        } : undefined;

        const evaluation = await promptEvaluator.evaluateTemplate(template, apiKey, testExecutor);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(evaluation, null, 2)
          }]
        };
      }
    );

    server.tool(
      "quick_evaluate",
      "Quick evaluation of template without test execution",
      {
        templateId: z.string(),
        variables: z.record(z.any())
      },
      async ({ templateId, variables }) => {
        const template = promptManager.getTemplate(templateId);
        if (!template) {
          throw new Error(`Template '${templateId}' not found`);
        }

        const evaluation = promptEvaluator.quickEvaluate(template, variables);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(evaluation, null, 2)
          }]
        };
      }
    );

    server.tool(
      "run_test_case",
      "Run a specific test case for a template",
      {
        templateId: z.string(),
        testCaseId: z.string(),
        apiKey: z.string()
      },
      async ({ templateId, testCaseId }) => {
        const template = promptManager.getTemplate(templateId);
        if (!template) {
          throw new Error(`Template '${templateId}' not found`);
        }

        const testCase = template.test_cases?.find(tc => tc.id === testCaseId);
        if (!testCase) {
          throw new Error(`Test case '${testCaseId}' not found in template '${templateId}'`);
        }

        // Process template with test case inputs
        const processed = promptManager.processTemplate(template, testCase.inputs);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              testCase,
              processedPrompt: processed,
              status: "ready_for_execution"
            }, null, 2)
          }]
        };
      }
    );

    // Prompt Registration
    server.registerPrompt(
      "template-execution",
      {
        title: "Template Execution",
        description: "Execute a prompt template with specific variables",
        argsSchema: {
          templateId: z.string(),
          variables: z.record(z.any()).optional().default({})
        }
      },
      ({ templateId, variables }) => {
        const template = promptManager.getTemplate(templateId);
        if (!template) {
          throw new Error(`Template '${templateId}' not found`);
        }

        const processed = promptManager.processTemplate(template, variables);
        
        return {
          messages: [{
            role: "user",
            content: {
              type: "text",
              text: processed.content
            }
          }]
        };
      }
    );

    // Dynamic prompt registration for each template
    const templates = promptManager.getAllTemplates();
    templates.forEach(template => {
      const promptId = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${template.version}`;
      
      server.registerPrompt(
        promptId,
        {
          title: template.name,
          description: template.description,
          argsSchema: template.variables.reduce((schema, variable) => {
            const zodType = variable.type === 'number' ? z.number() : 
                           variable.type === 'boolean' ? z.boolean() : 
                           z.string();
            
            schema[variable.name] = variable.required ? zodType : zodType.optional();
            if (variable.default !== undefined) {
              schema[variable.name] = schema[variable.name].default(variable.default);
            }
            
            return schema;
          }, {} as Record<string, z.ZodTypeAny>)
        },
        (variables) => {
          const processed = promptManager.processTemplate(template, variables);
          
          return {
            messages: [{
              role: "user",
              content: {
                type: "text",
                text: processed.content
              }
            }]
          };
        }
      );
    });
  },
  {
    capabilities: {
      tools: {},
      prompts: {}
    }
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: true
  }
);

export { handler as GET, handler as POST, handler as DELETE };
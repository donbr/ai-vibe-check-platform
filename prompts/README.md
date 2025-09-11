# AI Vibe Check Platform - Prompt Library

This directory contains the advanced prompt management system for the AI Vibe Check Platform.

## Directory Structure

```
prompts/
├── templates/          # Core prompt templates (.prompty files)
│   ├── educational/    # Educational system prompts
│   ├── creative/       # Creative system prompts
│   ├── analytical/     # Analytical system prompts
│   └── professional/   # Professional system prompts
├── examples/           # Few-shot example libraries
├── tests/             # Test cases and evaluation prompts
└── README.md          # This file
```

## Prompt Template Format (.prompty)

Our prompt templates use a YAML frontmatter format inspired by Microsoft Prompty:

```yaml
---
name: "Template Name"
description: "Brief description of the template's purpose"
version: "1.0.0"
authors: 
  - "Author Name"
created: "2024-01-01"
updated: "2024-01-01"
category: "educational|creative|analytical|professional"
tags: ["tag1", "tag2"]
model:
  preferred: "gpt-4o-mini"
  temperature: 0.7
  max_tokens: 1000
variables:
  - name: "variableName"
    type: "string|number|boolean"
    description: "Description of the variable"
    required: true
    default: "default_value"
sample:
  variableName: "Sample value for testing"
metrics:
  usage_count: 0
  avg_response_time: 0
  success_rate: 1.0
security:
  injection_protected: true
  sanitize_inputs: true
---

Your system prompt content here.

Use {{variableName}} for variable substitution.

## Instructions

Detailed instructions for the AI assistant.

## Context

Any additional context or constraints.
```

## Usage

1. Create new templates in the appropriate category subdirectory
2. Use `.prompty` extension for template files
3. Test templates using the evaluation system
4. Version control all changes through Git

## Best Practices

1. **Clear Naming**: Use descriptive names for templates
2. **Versioning**: Update version numbers when making changes
3. **Documentation**: Include comprehensive descriptions and examples
4. **Testing**: Always test templates before production use
5. **Security**: Enable injection protection for user-facing prompts
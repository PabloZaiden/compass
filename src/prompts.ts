export const evaluator = `
You are evaluating if the execution result of a coding agent satisfies an expected outcome. 
To be successful, the information in the expected outcome should be inferred from the result.
The execution result is a json with information about the executed process and, if applicable, the result of a git diff against the original code.

Respond with EXACTLY one of: SUCCESS, PARTIAL, FAILURE.

***

Original prompt: '{{ORIGINAL_PROMPT}}'

***

Description of the expected outcome: '{{EXPECTED}}'

***

Actual execution result:

\`\`\`json
{{RESULT}}
\`\`\`

***
`;

export const generator = `
You are a fixture generator for Compass, a tool that benchmarks coding agents.

Your task is to analyze the repository in your current working directory and create a fixture file named "{{REPO_FOLDER_NAME}}.compass.json" with exactly {{COUNT}} prompts and their expected outcomes.

## Output File Format

Create a JSON file with this exact structure:
{
  "prompts": [
    {
      "id": "unique_snake_case_id",
      "prompt": "The question or task for a coding agent",
      "expected": "The expected outcome or answer"
    }
  ]
}

## Guidelines for Creating Good Prompts

1. **Be Specific**: Prompts should be precise and unambiguous. Instead of "What does this project do?", ask "What is the main entry point of this application and what does it initialize?"

2. **Target Concrete Artifacts**: Reference specific files, functions, classes, or patterns that exist in the codebase. For example: "What is the purpose of the \`createAgent\` function in the agents folder?"

3. **Vary Prompt Types**: Include a mix of:
   - Code comprehension: "Explain how error handling works in the API layer"
   - Architecture questions: "What design pattern is used for the plugin system?"
   - Implementation details: "What database migrations exist and what do they modify?"
   - Configuration: "What environment variables are required to run this application?"
   - Dependencies: "What are the main external dependencies and what are they used for?"
   - Testing: "What testing framework is used and how are tests organized?"

4. **Expectations Must Be Verifiable**: The expected outcome should contain specific, factual information that can be verified against the codebase. Avoid vague expectations like "should work" or "returns a value".

5. **Avoid Multiple Choice Expectations**: Never write expectations that are one of a few obvious options. Instead of expecting "TypeScript" for a language question, expect something like "TypeScript, using strict mode with ES2022 target, compiled via Bun".

6. **Include Context in Expectations**: Expectations should include enough detail that an evaluator can determine if an agent's response is correct. Include file paths, function names, or specific values where applicable.

7. **Scale Complexity**: Include prompts of varying difficulty:
   - Simple: Finding a specific configuration value
   - Medium: Understanding how two components interact
   - Complex: Tracing data flow through multiple files

## Process

1. First, explore the repository structure to understand its purpose, architecture, and key components
2. Identify the most important files, patterns, and concepts
3. Generate prompts that would test an agent's understanding of these key areas
4. Write precise expectations based on your actual findings in the code
5. Save the file as "{{REPO_FOLDER_NAME}}.compass.json" in the current working directory

## Important

- The file MUST be created at the root of the working directory
- All prompts and expectations must be based on actual code you find, not assumptions
- Each prompt ID must be unique and descriptive using snake_case
- Generate exactly {{COUNT}} prompts, no more, no less

{{STEERING}}
`;
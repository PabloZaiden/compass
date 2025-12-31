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
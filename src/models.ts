export interface PromptSpec {
  id: string;
  prompt: string;
  expected: string;
}

export interface EvaluationConfig {
  models?: string[];
  prompts: PromptSpec[];
}

export interface ProcessOutput {
  stdout: string | null;
  stderr: string | null;
  exitCode: number;
}

export interface AgentOutput extends ProcessOutput {
  gitDiff?: string | null;
}

export enum Classification {
  Success = 10,
  Partial = 5,
  Failure = 0,
}

export enum OutputMode {
  Detailed = "detailed",
  Aggregated = "aggregated",
}

export interface RunResult {
  agentType: string;
  model: string;
  evalModel: string;
  promptId: string;
  iteration: number;
  agentOutput: AgentOutput;
  evaluationOutput: ProcessOutput;
  classification: Classification;
  points: number;
}

export interface AggregatedResult {
  model?: string;
  promptId: string;
  averagePoints: number;
  runs: number;
}

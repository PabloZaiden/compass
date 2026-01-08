export type Fixture = { prompts: PromptSpec[] };

export interface PromptSpec {
    id: string;
    prompt: string;
    expected: string;
}

export interface IterationResult {
    agentType: string;
    model: string;
    promptId: string;
    iteration: number;
    agentOutput: AgentOutput;
    evaluationOutput: ProcessOutput;
    classification: keyof typeof Classification;
    points: number;
}

export interface AggregatedResult {
    model: string;
    promptId: string;
    averagePoints: number;
    iterations: number;
}

export interface RunnerResult {
    iterationResults: IterationResult[];
    aggregatedResults: AggregatedResult[];
}


export interface ProcessOutput {
    stdOut: string
    stdErr: string
    exitCode: number
}

export interface AgentOutput extends ProcessOutput {
    gitDiff: string
}

export enum Classification {
    SUCCESS,
    PARTIAL,
    FAILURE
}
export enum OutputMode {
    Detailed,
    Aggregated
}

export function values<T>(type: T): string[] {
    let keys : string[] = [];
    for (let k in type) {
        if (isNaN(Number(k))) {
            keys.push(k);
        }
    }

    return keys;
}

export function parseEnum<T>(type: T, value: string): T[keyof T] | undefined {
    let keys : string[] = values(type);
    const lowerValue = value.toLowerCase();

    const matchedKey = keys.find(k => k.toLowerCase() === lowerValue);
    
    if (!matchedKey) {
        return undefined;
    }

    return (type as any)[matchedKey];
}
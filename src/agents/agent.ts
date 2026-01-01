import type { AgentOutput } from "../models";

export interface AgentOptions {
    allowFullAccess: boolean;
}

export abstract class Agent {
    abstract execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput>;
    abstract init(): Promise<void>;

    name: string = "Agent";
    options: AgentOptions;

    constructor(name : string, options: AgentOptions) {
        this.name = name;
        this.options = options;
    }
}
import type { AgentOutput } from "../models";

export interface AgentOptions {
    allowFullAccess: boolean;
}

export const defaultAgentOptions: AgentOptions = {
    allowFullAccess: false
};

export abstract class Agent {
    abstract execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput>;
    abstract init(): Promise<void>;
    abstract requiredBinaries(): string[];

    name: string = "Agent";
    options: AgentOptions;

    constructor(name: string, options: AgentOptions) {
        this.name = name;
        this.options = options;
    }
}
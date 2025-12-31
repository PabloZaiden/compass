import type { AgentOutput } from "../models";

export abstract class Agent {
    abstract execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput>;
    abstract init(): Promise<void>;

    name: string = "Agent";

    constructor(name : string) {
        this.name = name;
    }
}
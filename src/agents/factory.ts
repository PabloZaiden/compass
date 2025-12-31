import type { Agent } from "./agent";
import { Codex } from "./codex";
import { GitHubCopilot } from "./githubCopilot";

export function createAgent(type: AgentTypes): Agent {
    switch (type) {
        case AgentTypes.GitHubCopilot:
            return new GitHubCopilot();
        case AgentTypes.Codex:
            return new Codex();
        default:
            throw new Error(`Unknown agent type: ${type}`);
    }
}

export enum AgentTypes {
    GitHubCopilot,
    Codex
}

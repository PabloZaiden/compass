import type { Agent } from "./agent";
import { GitHubCopilot } from "./githubCopilot";

export function createAgent(type: AgentTypes): Agent {
    switch (type) {
        case AgentTypes.GitHubCopilot:
            return new GitHubCopilot();
        
        default:
            throw new Error(`Unknown agent type: ${type}`);
    }
}

export enum AgentTypes {
    GitHubCopilot
}

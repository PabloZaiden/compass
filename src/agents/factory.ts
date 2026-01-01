import type { Agent } from "./agent";
import { Codex } from "./codex";
import { GitHubCopilot } from "./githubCopilot";
import { OpenCode } from "./opencode";
import { ClaudeCode } from "./claudeCode";

export function createAgent(type: AgentTypes): Agent {
    switch (type) {
        case AgentTypes.GitHubCopilot:
            return new GitHubCopilot();
        case AgentTypes.Codex:
            return new Codex();
        case AgentTypes.OpenCode:
            return new OpenCode();
        case AgentTypes.ClaudeCode:
            throw new Error("ClaudeCode agent is not yet supported.");
            return new ClaudeCode();
        default:
            throw new Error(`Unknown agent type: ${type}`);
    }
}

export enum AgentTypes {
    GitHubCopilot,
    Codex,
    OpenCode,
    ClaudeCode
}

export const defaultModels: { [key in AgentTypes]: string } = {
    [AgentTypes.GitHubCopilot]: "gpt-5-mini",
    [AgentTypes.Codex]: "gpt-5.1-codex-mini",
    [AgentTypes.OpenCode]: "opencode/big-pickle",
    [AgentTypes.ClaudeCode]: "sonnet"
};

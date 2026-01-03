import type { Agent, AgentOptions } from "./agent";
import { Codex } from "./codex";
import { Copilot } from "./copilot";
import { OpenCode } from "./opencode";
import { ClaudeCode } from "./claudeCode";
import { Gemini } from "./gemini";

export function createAgent(type: AgentTypes, options: AgentOptions): Agent {
    switch (type) {
        case AgentTypes.Copilot:
            return new Copilot(options);
        case AgentTypes.Codex:
            return new Codex(options);
        case AgentTypes.OpenCode:
            return new OpenCode(options);
        case AgentTypes.ClaudeCode:
            throw new Error("ClaudeCode agent is not yet supported.");
            return new ClaudeCode(options);
        case AgentTypes.Gemini:
            return new Gemini(options);
        default:
            throw new Error(`Unknown agent type: ${type}`);
    }
}

export enum AgentTypes {
    Copilot,
    Codex,
    OpenCode,
    ClaudeCode,
    Gemini
}

export const defaultModels: { [key in AgentTypes]: string } = {
    [AgentTypes.Copilot]: "gpt-5-mini",
    [AgentTypes.Codex]: "gpt-5.1-codex-mini",
    [AgentTypes.OpenCode]: "opencode/big-pickle",
    [AgentTypes.ClaudeCode]: "sonnet",
    [AgentTypes.Gemini]: "gemini-2.5-flash"
};

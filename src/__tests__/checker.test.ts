import { describe, test, expect } from "bun:test";
import { Checker } from "../check/checker";
import { AgentTypes } from "../agents/factory";

describe("checker", () => {
    const checker = new Checker();

    test("check all agents", async () => {
        const result = await checker.check();

        expect(result).toBeDefined();
        expect(result.agents).toBeDefined();
        expect(Array.isArray(result.agents)).toBe(true);
        expect(result.agents.length).toBeGreaterThan(0);

        // Each agent should have required fields
        for (const agent of result.agents) {
            expect(agent.agentType).toBeDefined();
            expect(agent.agentName).toBeDefined();
            expect(typeof agent.skipped).toBe("boolean");
            expect(Array.isArray(agent.binaries)).toBe(true);
        }
    });

    test("check Copilot agent", async () => {
        const result = await checker.check("Copilot");

        expect(result).toBeDefined();
        expect(result.error).toBeUndefined();
        expect(result.agents.length).toBe(1);

        const agent = result.agents[0]!;
        expect(agent.agentType).toBe(AgentTypes.Copilot);
        expect(agent.agentName).toBe("Copilot");
    });

    test("check Codex agent", async () => {
        const result = await checker.check("Codex");

        expect(result).toBeDefined();
        expect(result.error).toBeUndefined();
        expect(result.agents.length).toBe(1);

        const agent = result.agents[0]!;
        expect(agent.agentType).toBe(AgentTypes.Codex);
        expect(agent.agentName).toBe("Codex");
    });

    test("check OpenCode agent", async () => {
        const result = await checker.check("OpenCode");

        expect(result).toBeDefined();
        expect(result.error).toBeUndefined();
        expect(result.agents.length).toBe(1);

        const agent = result.agents[0]!;
        expect(agent.agentType).toBe(AgentTypes.OpenCode);
        expect(agent.agentName).toBe("OpenCode");
    });

    test("check ClaudeCode agent", async () => {
        const result = await checker.check("ClaudeCode");

        expect(result).toBeDefined();
        expect(result.error).toBeUndefined();
        expect(result.agents.length).toBe(1);

        const agent = result.agents[0]!;
        expect(agent.agentType).toBe(AgentTypes.ClaudeCode);
        expect(agent.agentName).toBe("ClaudeCode");
        // ClaudeCode is not yet supported, so it should be skipped
        expect(agent.skipped).toBe(true);
    });

    test("check Gemini agent", async () => {
        const result = await checker.check("Gemini");

        expect(result).toBeDefined();
        expect(result.error).toBeUndefined();
        expect(result.agents.length).toBe(1);

        const agent = result.agents[0]!;
        expect(agent.agentType).toBe(AgentTypes.Gemini);
        expect(agent.agentName).toBe("Gemini");
    });

    test("check unknown agent returns error", async () => {
        const result = await checker.check("UnknownAgent");

        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain("Unknown agent type");
        expect(result.agents.length).toBe(0);
    });

    test("check is case-insensitive", async () => {
        const result = await checker.check("opencode");

        expect(result).toBeDefined();
        expect(result.error).toBeUndefined();
        expect(result.agents.length).toBe(1);

        const agent = result.agents[0]!;
        expect(agent.agentType).toBe(AgentTypes.OpenCode);
    });
});

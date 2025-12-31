import { describe, test, expect } from "bun:test";
import { AgentTypes, createAgent } from "../agents/factory";
import { createWatchCompilerHost } from "typescript";

function basicTest(type: AgentTypes, model: string): () => Promise<void> {
  return async () => {
    test("Basic test", async () => {
      const agent = createAgent(type);

      const output = await agent.execute(`Explain what this project is about`, model, ".");

      expect(output).toBeDefined();
      console.log(output);

      expect(output.exitCode).toBe(0);
      expect(output.stdOut).toBeDefined();
      expect(output.stdOut.length).toBeGreaterThan(0);
    }, { timeout: 90 * 1000 }); // 90 seconds
  };
}

const basicTestOptions = {
  timeout: 90 * 1000, // 90 seconds
};

describe(AgentTypes[AgentTypes.GitHubCopilot], basicTest(AgentTypes.GitHubCopilot, "gpt-5-mini"));
describe(AgentTypes[AgentTypes.Codex], basicTest(AgentTypes.Codex, "gpt-5.1-codex-mini"));

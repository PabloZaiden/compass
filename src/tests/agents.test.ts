import { describe, test, expect } from "bun:test";
import { AgentTypes, createAgent } from "../agents/factory";

async function basicTest(type: AgentTypes, model: string) {
  const agent = createAgent(type);

  const output = await agent.execute(`Explain what this project is about`, model, ".");

  expect(output).toBeDefined();
  console.log(output);

  expect(output.exitCode).toBe(0);
  expect(output.stdOut).toBeDefined();
  expect(output.stdOut.length).toBeGreaterThan(0);
}

const basicTestOptions = {
  timeout: 90 * 1000, // 90 seconds
};

describe(AgentTypes[AgentTypes.GitHubCopilot], () => {
  test("Basic test", async () => {
    await basicTest(AgentTypes.GitHubCopilot, "gpt-5-mini");
  }, basicTestOptions);
});

describe(AgentTypes[AgentTypes.Codex], () => {
  test("Basic test", async () => {
    await basicTest(AgentTypes.Codex, "gpt-5.1-codex-mini");
  }, basicTestOptions);
});

describe(AgentTypes[AgentTypes.OpenCode], () => {
  test("Basic test", async () => {
    await basicTest(AgentTypes.OpenCode, "opencode/big-pickle");
  }, basicTestOptions);
});
import { describe, test, expect } from "bun:test";
import { AgentTypes, createAgent, defaultModels } from "../agents/factory";
import { anonymous } from "./helpers";

async function basicTest(type: AgentTypes) {
  const agent = createAgent(type, { allowFullAccess: false});

  const model = defaultModels[type];

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
    await basicTest(AgentTypes.GitHubCopilot);
  }, basicTestOptions);
});

describe(AgentTypes[AgentTypes.Codex], () => {
  test("Basic test", async () => {
    await basicTest(AgentTypes.Codex);
  }, basicTestOptions);
});

describe(anonymous(AgentTypes[AgentTypes.OpenCode]), () => {
  test("Basic test", async () => {
    await basicTest(AgentTypes.OpenCode);
  }, basicTestOptions);
});

describe.skip(AgentTypes[AgentTypes.ClaudeCode], () => {
  test("Basic test", async () => {
    await basicTest(AgentTypes.ClaudeCode);
  }, basicTestOptions);
});
import { describe, test, expect } from "bun:test";
import { Agent } from "../src/agents/agent.ts";
import { TestUtils } from "./utils.ts";

describe("Agent Tests", () => {
  async function basicTest(agentType: string, model: string) {
    const agent = await Agent.create(agentType);

    const output = await agent.execute("Explain what this project is about.", model, TestUtils.repoRoot());
    
    console.log("StdOut:" + output.stdout);
    console.log("StdErr:" + output.stderr);

    expect(output.exitCode).toBe(0);
    expect(output).toBeDefined();
    expect(output.stdout).toBeDefined();
  }

  test("BasicTestGithubCopilot", async () => {
    await basicTest("githubcopilot", "gpt-5-mini");
  });

  test("BasicTestCodex", async () => {
    await basicTest("codex", "gpt-5-mini");
  });

  test("BasicTestOpenCode", async () => {
    await basicTest("opencode", "opencode/gpt-5-nano");
  });
});

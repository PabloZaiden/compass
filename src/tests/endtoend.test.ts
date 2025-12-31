import { describe, test, expect } from "bun:test";
import { AgentTypes } from "../agents/factory";
import { OutputMode, type Fixture } from "../models";
import { Runner } from "../runner";
import type { Config } from "../config/config";

async function endToEnd(type: AgentTypes, model: string) {
  const fixtureFileName = "./src/sample-fixture.json";
  const fixtureFile = Bun.file(fixtureFileName);

  expect(await fixtureFile.exists()).toBe(true);

  const fixtureText = await fixtureFile.text();
  expect(fixtureText).toBeDefined();
  expect(fixtureText.length).toBeGreaterThan(0);

  const fixture = JSON.parse(fixtureText) as Fixture;

  expect(fixture).toBeDefined();
  expect(fixture.prompts.length).toBe(2);

  const config : Config= {
    agentType: type,
    model: model,
    evalModel: model,
    fixture: fixtureFileName,
    iterationCount: 1,
    outputMode: OutputMode.Detailed,
    repoPath: ".",
    stopOnError: true,
    useCache: false
  };

  const runner = new Runner();

  const result = await runner.run(config);

  expect(result.iterationResults).toBeDefined();
  expect(result.iterationResults.length).toBeGreaterThan(0);

  expect(result).toBeDefined();
  expect(result.aggregatedResults).toBeDefined();
  expect(result.aggregatedResults.length).toBe(fixture.prompts.length);

  for (const aggResult of result.aggregatedResults) {
    expect(aggResult.averagePoints).toBe(10);
  }
}

const basicTestOptions = {
  timeout: 2 * 60 * 1000, // 2 minutes
};

describe(AgentTypes[AgentTypes.GitHubCopilot], () => {
  test("Self end-to-end test", async () => {
    await endToEnd(AgentTypes.GitHubCopilot, "gpt-5-mini");
  }, basicTestOptions);
});

describe(AgentTypes[AgentTypes.Codex], () => {
  test("Self end-to-end test", async () => {
    await endToEnd(AgentTypes.Codex, "gpt-5.1-codex-mini");
  }, basicTestOptions);
});

describe(AgentTypes[AgentTypes.OpenCode], () => {
  test("Self end-to-end test", async () => {
    await endToEnd(AgentTypes.OpenCode, "opencode/big-pickle");
  }, basicTestOptions);
});
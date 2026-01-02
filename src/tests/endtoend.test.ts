import { describe, test, expect } from "bun:test";
import { AgentTypes, defaultModels } from "../agents/factory";
import { OutputMode, type Fixture } from "../models";
import { Runner } from "../runner";
import type { Config } from "../config/config";
import { anonymous, repoDir, rootDir } from "./helpers";
import path from "path";

async function endToEnd(type: AgentTypes) {
  const model = defaultModels[type];

  const fixtureFileName = path.join(rootDir, "sample-fixture.json");
  const fixtureFile = Bun.file(fixtureFileName);

  expect(await fixtureFile.exists()).toBe(true);

  const fixtureText = await fixtureFile.text();
  expect(fixtureText).toBeDefined();
  expect(fixtureText.length).toBeGreaterThan(0);

  const fixture = JSON.parse(fixtureText) as Fixture;

  expect(fixture).toBeDefined();
  expect(fixture.prompts.length).toBe(2);

  const config: Config = {
    agentType: type,
    model: model,
    evalModel: model,
    fixture: fixtureFileName,
    iterationCount: 1,
    outputMode: OutputMode.Detailed,
    repoPath: repoDir,
    stopOnError: true,
    useCache: false,
    allowFullAccess: true,
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
    await endToEnd(AgentTypes.GitHubCopilot);
  }, basicTestOptions);
});

describe(AgentTypes[AgentTypes.Codex], () => {
  test("Self end-to-end test", async () => {
    await endToEnd(AgentTypes.Codex);
  }, basicTestOptions);
});

describe(anonymous(AgentTypes[AgentTypes.OpenCode]), () => {
  test("Self end-to-end test", async () => {
    await endToEnd(AgentTypes.OpenCode);
  }, basicTestOptions);
});

describe.skip(AgentTypes[AgentTypes.ClaudeCode], () => {
  test("Self end-to-end test", async () => {
    await endToEnd(AgentTypes.ClaudeCode);
  }, basicTestOptions);
});

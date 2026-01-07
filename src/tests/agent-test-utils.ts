import { expect } from "bun:test";
import { AgentTypes, createAgent, defaultModels } from "../agents/factory";
import path, { dirname } from "path";
import { OutputMode, type Fixture } from "../models";
import { LogLevel } from "../logging";
import { Runner } from "../run/runner";
import type { Config } from "../config/config";
import { Generator } from "../generate/generator";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

const srcDir = dirname(import.meta.dir);
export const repoDir = path.resolve(srcDir, "..");

export const runAgentTests = process.env["COMPASS_TEST_AGENTS"] === "1";

export const basicTestOptions = {
  timeout: 90 * 1000, // 90 seconds
};

export async function basicTest(type: AgentTypes) {
  const agent = createAgent(type, { allowFullAccess: false });

  const model = defaultModels[type];

  const output = await agent.execute(`Explain what this project is about`, model, repoDir);

  expect(output).toBeDefined();
  expect(output.exitCode).toBe(0);
  expect(output.stdOut).toBeDefined();
  expect(output.stdOut.length).toBeGreaterThan(0);
}

export const endToEndTestOptions = {
  timeout: 2 * 60 * 1000, // 2 minutes
};

export async function endToEnd(type: AgentTypes) {
  const model = defaultModels[type];

  const fixtureFileName = path.join(srcDir, "sample-fixture.json");
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
    logLevel: LogLevel.Trace
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

export const generateTestOptions = {
  timeout: 3 * 60 * 1000, // 3 minutes
};

export async function generateFixture(type: AgentTypes) {
  // Create a temp directory to simulate a repo
  const tempDir = await mkdtemp(path.join(tmpdir(), "compass-generate-test-"));

  try {
    // Copy some files from the real repo to give context
    const srcFile = Bun.file(path.join(repoDir, "package.json"));
    await Bun.write(path.join(tempDir, "package.json"), srcFile);

    const readmeFile = Bun.file(path.join(repoDir, "README.md"));
    await Bun.write(path.join(tempDir, "README.md"), readmeFile);

    // Use the Generator class
    const generator = new Generator();
    const result = await generator.generate({
      repoPath: tempDir,
      agentType: type,
      count: 2,
    });

    expect(result.success).toBe(true);
    expect(result.fixture).toBeDefined();
    expect(result.fixture!.prompts).toBeDefined();
    expect(Array.isArray(result.fixture!.prompts)).toBe(true);
    expect(result.fixture!.prompts.length).toBe(2);

    // Validate each prompt has required fields
    for (const p of result.fixture!.prompts) {
      expect(p.id).toBeDefined();
      expect(typeof p.id).toBe("string");
      expect(p.prompt).toBeDefined();
      expect(typeof p.prompt).toBe("string");
      expect(p.expected).toBeDefined();
      expect(typeof p.expected).toBe("string");
    }
  } finally {
    // Cleanup temp directory
    await rm(tempDir, { recursive: true, force: true });
  }
}

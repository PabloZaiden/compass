import { describe, test, expect } from "bun:test";
import { readFile } from "fs/promises";
import { join } from "path";
import { Runner } from "../src/runner.ts";
import { Logger } from "../src/logger.ts";
import { TestUtils } from "./utils.ts";

describe("End-to-End Tests", () => {
  async function selfTest(agentType: string, model: string, evalModel: string) {
    const repoRoot = TestUtils.repoRoot();
    const configPath = join(repoRoot, "Compass", "config", "sample-config.json");

    expect(require("fs").existsSync(configPath)).toBe(true);

    const configContent = await readFile(configPath, "utf-8");
    const config = JSON.parse(configContent);
    const promptCount = config.prompts.length;

    const originalCwd = process.cwd();
    process.chdir(repoRoot);

    const logs: string[] = [];
    Logger.setWriters([(text) => logs.push(text)]);

    let result: string;
    try {
      const runner = new Runner();
      result = await runner.run([
        "--repo-path",
        repoRoot,
        "--config",
        configPath,
        "--agent-type",
        agentType,
        "--model",
        model,
        "--eval-model",
        evalModel,
        "--runs",
        "1",
        "--verbose",
      ]);
    } finally {
      process.chdir(originalCwd);
      Logger.setWriters([(text) => console.log(text)]);
    }

    const output = logs.join("\n");

    expect(output).not.toContain("Error running process:");

    const outputJson = JSON.parse(result);

    console.log("End-to-end test completed. Output JSON:");
    console.log(result);

    expect(outputJson.aggregates).toBeDefined();
    expect(outputJson.aggregates.length).toBe(promptCount);
  }

  test("SelfTestGithubCopilot", async () => {
    await selfTest("githubcopilot", "gpt-5.1-codex-mini", "gpt-5.1-codex-mini");
  }, 300000); // 5 minute timeout

  test("SelfTestCodex", async () => {
    await selfTest("codex", "gpt-5.1-codex-mini", "gpt-5.1-codex-mini");
  }, 300000);
});

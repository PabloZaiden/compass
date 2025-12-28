import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { Agent } from "./agent.ts";
import { ProcessUtils, StringExtensions } from "../utils.ts";
import { Logger, LogLevel } from "../logger.ts";
import type { AgentOutput } from "../models.ts";

export class OpenCode extends Agent {
  private command: string = "opencode";
  private initialized: boolean = false;

  constructor() {
    super();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    Logger.log("Checking for OpenCode binary in PATH", LogLevel.Verbose);

    const checkPath = await ProcessUtils.run(".", "which", "opencode");
    if (checkPath.exitCode !== 0) {
      Logger.log("OpenCode binary not found in PATH, checking ~/.opencode/bin", LogLevel.Verbose);

      const potentialPath = join(homedir(), ".opencode", "bin", "opencode");
      if (existsSync(potentialPath)) {
        Logger.log("Found OpenCode binary in ~/.opencode/bin", LogLevel.Verbose);
        this.command = potentialPath;
      } else {
        throw new Error("OpenCode binary not found in PATH or ~/.opencode/bin");
      }
    }

    Logger.log(`Found OpenCode binary at: ${this.command}`, LogLevel.Verbose);
    this.initialized = true;
  }

  get name(): string {
    return "OpenCode";
  }

  async ensureLogin(): Promise<void> {
    await this.initialize();
    // OpenCode doesn't require login
  }

  async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
    await this.initialize();

    const processOutput = await ProcessUtils.run(
      workingDirectory,
      this.command,
      `run --model ${StringExtensions.escapeArg(model)} ${StringExtensions.escapeArg(prompt)}`
    );

    Logger.log("Collecting git diff after agent execution", LogLevel.Verbose);

    const diff = await ProcessUtils.git(workingDirectory, "--no-pager diff");

    return {
      stdout: processOutput.stdout,
      stderr: processOutput.stderr,
      exitCode: processOutput.exitCode,
      gitDiff: diff.stdout,
    };
  }
}

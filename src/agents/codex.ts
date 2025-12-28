import { spawn } from "child_process";
import { Agent } from "./agent.ts";
import { ProcessUtils, StringExtensions } from "../utils.ts";
import { Logger, LogLevel } from "../logger.ts";
import type { AgentOutput } from "../models.ts";

export class Codex extends Agent {
  get name(): string {
    return "Codex";
  }

  async ensureLogin(): Promise<void> {
    const checkLogin = await ProcessUtils.run(process.cwd(), "codex", "login status");

    if (checkLogin.exitCode !== 0) {
      await new Promise<void>((resolve, reject) => {
        const loginProcess = spawn("codex", ["login", "--device-auth"], {
          cwd: process.cwd(),
          stdio: "inherit",
        });

        loginProcess.on("close", (code) => {
          if (code !== 0) {
            reject(new Error("Codex login failed."));
          } else {
            resolve();
          }
        });

        loginProcess.on("error", (error) => {
          reject(new Error(`Failed to start Codex login: ${error.message}`));
        });
      });
    }
  }

  async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
    const processOutput = await ProcessUtils.run(
      workingDirectory,
      "codex",
      `exec --model ${StringExtensions.escapeArg(model)} --sandbox danger-full-access ${StringExtensions.escapeArg(prompt)}`
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

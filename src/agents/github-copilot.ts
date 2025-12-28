import { Agent } from "./agent.ts";
import { ProcessUtils, StringExtensions } from "../utils.ts";
import { Logger, LogLevel } from "../logger.ts";
import type { AgentOutput } from "../models.ts";

export class GithubCopilot extends Agent {
  get name(): string {
    return "GitHub Copilot";
  }

  async ensureLogin(): Promise<void> {
    // do nothing for now, since there is no non-interactive way to check this.
  }

  async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
    const processOutput = await ProcessUtils.run(
      workingDirectory,
      "copilot",
      `--silent --no-color --model ${StringExtensions.escapeArg(model)} --allow-all-tools --allow-all-paths --add-dir ${StringExtensions.escapeArg(workingDirectory)} -p ${StringExtensions.escapeArg(prompt)}`
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

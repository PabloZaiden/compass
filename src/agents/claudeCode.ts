import type { AgentOutput } from "../models";
import { logger, run } from "../utils";
import { Agent, type AgentOptions } from "./agent";

export class ClaudeCode extends Agent {
    constructor(options: AgentOptions) {
        super("ClaudeCode", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.info(`Executing ClaudeCode with model ${model} on prompt ${prompt}`);

        const allowAllParameters = this.options.allowFullAccess ? ["--dangerously-skip-permissions"] : [];
        const processOutput = await run(
            workingDirectory,
            "claude",
            ...allowAllParameters,
            "--model",
            model,
            "-p",
            prompt
        );

        logger.trace("ClaudeCode stdOut: " + processOutput.stdOut);
        logger.trace("ClaudeCode stdErr: " + processOutput.stdErr);
        logger.trace("ClaudeCode exitCode: " + processOutput.exitCode);

        logger.trace("Collecting git diff after agent execution");

        const diff = await run(workingDirectory, "git", "--no-pager", "diff");

        return {
            stdOut: processOutput.stdOut.trim(),
            stdErr: processOutput.stdErr.trim(),
            exitCode: processOutput.exitCode,
            gitDiff: diff.stdOut.trim()
        };
    }

    override async init(): Promise<void> {
        return;
    }
}

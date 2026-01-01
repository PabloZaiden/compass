import type { AgentOutput } from "../models";
import { logger, run } from "../utils";
import { Agent, type AgentOptions } from "./agent";

export class GitHubCopilot extends Agent {
    constructor(options: AgentOptions) {
        super("GitHub Copilot", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.info(`Executing GitHub Copilot with model ${model} on prompt ${prompt}`);
        
        const allowAllParameters = this.options.allowFullAccess ? ["--allow-all-tools", "--allow-all-paths"] : [];
        const processOutput = await run(
            workingDirectory,
            "copilot",
            "--silent", 
            "--no-color", 
            "--model", model, 
            ...allowAllParameters,
            "--add-dir", workingDirectory, 
            "-p", prompt);

        logger.trace("GitHub Copilot stdOut: " + processOutput.stdOut);
        logger.trace("GitHub Copilot stdErr: " + processOutput.stdErr);
        logger.trace("GitHub Copilot exitCode: " + processOutput.exitCode);

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
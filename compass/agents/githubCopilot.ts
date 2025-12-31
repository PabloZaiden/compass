import type { AgentOutput } from "../models";
import { escapeArg, logger, run } from "../utils";
import { Agent } from "./agent";

export class GitHubCopilot extends Agent {
    constructor() {
        super("GitHub Copilot");
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.info(`Executing GitHub Copilot with model ${model} on prompt ${prompt}`);
        
        const processOutput = await run(
            workingDirectory,
            "copilot",
            "--silent", 
            "--no-color", 
            "--model", model, 
            "--allow-all-tools", 
            "--allow-all-paths", 
            "--add-dir", workingDirectory, 
            "-p", prompt);

        logger.trace("Collecting git diff after agent execution");
        
        const diff = await run(workingDirectory, "git", "--no-pager", "diff");

        return {
            stdOut: processOutput.stdOut,
            stdErr: processOutput.stdErr,
            exitCode: processOutput.exitCode,
            gitDiff: diff.stdOut
        };
    }

    override init(): Promise<void> {
        return Promise.resolve();    
    }
    
}
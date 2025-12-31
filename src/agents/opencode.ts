import type { AgentOutput } from "../models";
import { escapeArg, logger, run } from "../utils";
import { Agent } from "./agent";

export class OpenCode extends Agent {
    constructor() {
        super("OpenCode");
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.info(`Executing Codex with model ${model} on prompt ${prompt}`);
        
        const processOutput = await run(
            workingDirectory,
            "opencode",
            "run",
            "--model", model, 
            prompt);

        logger.trace("OpenCode stdOut: " + processOutput.stdOut);
        logger.trace("OpenCode stdErr: " + processOutput.stdErr);
        logger.trace("OpenCode exitCode: " + processOutput.exitCode);

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
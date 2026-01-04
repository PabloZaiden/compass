import type { AgentOutput } from "../models";
import { logger, run, stripAnsiCodes } from "../utils";
import { Agent, type AgentOptions } from "./agent";

export class OpenCode extends Agent {
    constructor(options: AgentOptions) {
        super("OpenCode", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.trace(`Executing OpenCode with model ${model} on prompt ${prompt}`);
        
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
            stdOut: stripAnsiCodes(processOutput.stdOut.trim()),
            stdErr: stripAnsiCodes(processOutput.stdErr.trim()),
            exitCode: processOutput.exitCode,
            gitDiff: diff.stdOut.trim()
        };
    }

    override async init(): Promise<void> {
        return;
    }
    
}
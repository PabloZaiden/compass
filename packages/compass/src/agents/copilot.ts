import type { AgentOutput } from "../models";
import { run } from "../utils";
import { logger } from "../logging";
import { Agent, type AgentOptions } from "./agent";

export class Copilot extends Agent {
    constructor(options: AgentOptions) {
        super("Copilot", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.trace(`Executing Copilot with model ${model} on prompt ${prompt}`);
        
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

        logger.trace("Collecting git diff after agent execution");
        
        const diff = await run(workingDirectory, "git", "--no-pager", "diff");

        return {
            stdOut: Bun.stripANSI(processOutput.stdOut.trim()),
            stdErr: Bun.stripANSI(processOutput.stdErr.trim()),
            exitCode: processOutput.exitCode,
            gitDiff: diff.stdOut.trim()
        };
    }

    override async init(): Promise<void> {
        return;
    }

    override requiredBinaries(): string[] {
        return ["copilot"];
    }
}
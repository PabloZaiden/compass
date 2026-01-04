import { stripANSI } from "bun";
import type { AgentOutput } from "../models";
import { run } from "../utils";
import { logger } from "../logging";
import { Agent, type AgentOptions } from "./agent";

export class Gemini extends Agent {
    constructor(options: AgentOptions) {
        super("Gemini CLI", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.trace(`Executing Gemini CLI with model ${model} on prompt ${prompt}`);
        
        const yoloParameters = this.options.allowFullAccess ? ["--yolo"] : [];
        const processOutput = await run(
            workingDirectory,
            "gemini",
            prompt,
            "--model", model,
            "--output-format", "text",
            ...yoloParameters);

        logger.trace("Gemini CLI stdOut: " + processOutput.stdOut);
        logger.trace("Gemini CLI stdErr: " + processOutput.stdErr);
        logger.trace("Gemini CLI exitCode: " + processOutput.exitCode);

        logger.trace("Collecting git diff after agent execution");
        
        const diff = await run(workingDirectory, "git", "--no-pager", "diff");

        return {
            stdOut: stripANSI(processOutput.stdOut.trim()),
            stdErr: stripANSI(processOutput.stdErr.trim()),
            exitCode: processOutput.exitCode,
            gitDiff: diff.stdOut.trim()
        };
    }

    override async init(): Promise<void> {
        return;
    }
    
}

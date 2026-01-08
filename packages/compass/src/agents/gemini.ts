import type { AgentOutput } from "../models";
import { run } from "../utils";
import { AppContext, type Logger } from "@pablozaiden/terminator";
import { Agent, type AgentOptions } from "./agent";

/**
 * Get the current logger from AppContext.
 */
function getLogger(): Logger {
    return AppContext.current.logger;
}

export class Gemini extends Agent {
    constructor(options: AgentOptions) {
        super("Gemini CLI", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        getLogger().trace(`Executing Gemini CLI with model ${model} on prompt ${prompt}`);
        
        const yoloParameters = this.options.allowFullAccess ? ["--yolo"] : [];
        const processOutput = await run(
            workingDirectory,
            "gemini",
            prompt,
            "--model", model,
            "--output-format", "text",
            ...yoloParameters);

        getLogger().trace("Collecting git diff after agent execution");
        
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
        return ["gemini"];
    }
}

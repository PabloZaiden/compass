import type { AgentOutput } from "../models";
import { run } from "../utils";
import { AppContext, type Logger } from "@pablozaiden/terminatui";
import { Agent, type AgentOptions } from "./agent";

/**
 * Get the current logger from AppContext.
 */
function getLogger(): Logger {
    return AppContext.current.logger;
}

export class OpenCode extends Agent {
    constructor(options: AgentOptions) {
        super("OpenCode", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string, signal?: AbortSignal): Promise<AgentOutput> {
        getLogger().trace(`Executing OpenCode with model ${model} on prompt ${prompt}`);
        
        const processOutput = await run(
            workingDirectory,
            ["opencode", "run", "--model", model, prompt],
            signal);

        getLogger().trace("Collecting git diff after agent execution");
        
        const diff = await run(workingDirectory, ["git", "--no-pager", "diff"], signal);

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
        return ["opencode"];
    }
}
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

export class ClaudeCode extends Agent {
    constructor(options: AgentOptions) {
        super("ClaudeCode", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string, signal?: AbortSignal): Promise<AgentOutput> {
        getLogger().trace(`Executing ClaudeCode with model ${model} on prompt ${prompt}`);

        const allowAllParameters = this.options.allowFullAccess ? ["--dangerously-skip-permissions"] : [];
        const processOutput = await run(
            workingDirectory,
            ["claude", ...allowAllParameters, "--model", model, "-p", prompt],
            signal
        );

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
        return ["claude"];
    }
}

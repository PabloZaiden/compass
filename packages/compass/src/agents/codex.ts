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

export class Codex extends Agent {
    constructor(options: AgentOptions) {
        super("Codex", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        getLogger().trace(`Executing Codex with model ${model} on prompt ${prompt}`);
        
        const sandboxParameters = this.options.allowFullAccess ? ["--sandbox", "danger-full-access"] : [];
        const processOutput = await run(
            workingDirectory,
            "codex",
            "exec",
            "--model", model, 
            ...sandboxParameters,
            prompt);

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
        const checkLogin = await run(".", "codex", "login", "status");

        if (checkLogin.exitCode !== 0) {
            const loginProcess = Bun.spawn(
                ["codex", "login", "--device-auth"], 
                { 
                    stdin: "inherit", 
                    stdout: "inherit", 
                    stderr: "inherit" 
                }
            );
            
            await loginProcess.exited;

            if (loginProcess.exitCode !== 0) {
                throw new Error("Failed to log in to Codex CLI.");
            }
             
        }
    }

    override requiredBinaries(): string[] {
        return ["codex"];
    }
}
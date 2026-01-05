import type { AgentOutput } from "../models";
import { run } from "../utils";
import { logger } from "../logging";
import { Agent, type AgentOptions } from "./agent";

export class Codex extends Agent {
    constructor(options: AgentOptions) {
        super("Codex", options);
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.trace(`Executing Codex with model ${model} on prompt ${prompt}`);
        
        const sandboxParameters = this.options.allowFullAccess ? ["--sandbox", "danger-full-access"] : [];
        const processOutput = await run(
            workingDirectory,
            "codex",
            "exec",
            "--model", model, 
            ...sandboxParameters,
            prompt);

        logger.trace("Codex stdOut: " + processOutput.stdOut);
        logger.trace("Codex stdErr: " + processOutput.stdErr);
        logger.trace("Codex exitCode: " + processOutput.exitCode);

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
    
}
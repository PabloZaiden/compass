import type { AgentOutput } from "../models";
import { logger, run } from "../utils";
import { Agent } from "./agent";

export class Codex extends Agent {
    constructor() {
        super("Codex");
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        logger.info(`Executing Codex with model ${model} on prompt ${prompt}`);
        
        const processOutput = await run(
            workingDirectory,
            "codex",
            "exec",
            "--model", model, 
            "--sandbox", "danger-full-access",
            prompt);

        logger.trace("Codex stdOut: " + processOutput.stdOut);
        logger.trace("Codex stdErr: " + processOutput.stdErr);
        logger.trace("Codex exitCode: " + processOutput.exitCode);

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
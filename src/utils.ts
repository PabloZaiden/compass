import { EventEmitter } from "events";
import { Logger } from "tslog";
import type { ProcessOutput } from "./models";

/// Executes a command in a given working directory and returns the process output.
export async function run(workingDirectory: string, ...commandWithArgs: string[]): Promise<ProcessOutput> {
    const commandForLogging = commandWithArgs[0] + " " + commandWithArgs.slice(1).map(arg => escapeArg(arg)).join(" ");
    logger.trace(`Running command: ${commandForLogging} in directory: ${workingDirectory}`);

    const process = Bun.spawn({
        cmd: commandWithArgs,
        cwd: workingDirectory,
        stdout: "pipe",
        stderr: "pipe",
        stdin: "ignore"
    })

    const [stdOut, stdErr, exitCode] = await Promise.all([
        new Response(process.stdout).text(),
        new Response(process.stderr).text(),
        process.exited
    ]);

    return {
        stdOut,
        stdErr,
        exitCode
    };
}

export async function copyDirectory(sourceDir: string, destinationDir: string): Promise<void> {
    const exit = await Bun.spawn({
        cmd: ["cp", "-r", sourceDir + "/", destinationDir],
    }).exited;

    if (exit !== 0) {
        throw new Error(`Failed to copy directory from ${sourceDir} to ${destinationDir}. Exit code: ${exit}`);
    }
}

export function escapeArg(arg: string): string {
    return `"${arg.replaceAll('"', '\\"')}"`;
}


export type TuiLogEvent = {
    message: string;
    level: LogLevel;
    timestamp: Date;
};

const logEventEmitter = new EventEmitter();
let tuiLoggingEnabled = false;

export function setTuiLoggingEnabled(enabled: boolean): void {
    tuiLoggingEnabled = enabled;
}

export function onLogEvent(listener: (event: TuiLogEvent) => void): () => void {
    logEventEmitter.on("log", listener);
    return () => logEventEmitter.off("log", listener);
}

export const logger = new Logger({
    type: "pretty",
    overwrite: {
        transportFormatted: (logMetaMarkup, logArgs, logErrors, logMeta) => {
            const baseLine = `${logMetaMarkup}${logArgs.join(" ")}${logErrors.join("")}`;
            const levelFromMeta = typeof (logMeta as any)?.logLevelId === "number" ? (logMeta as any).logLevelId as LogLevel : LogLevel.Info;

            if (tuiLoggingEnabled) {
                logEventEmitter.emit("log", {
                    message: baseLine,
                    level: levelFromMeta,
                    timestamp: new Date(),
                } satisfies TuiLogEvent);
            } else {
                // Everything pretty goes to stderr, never stdout
                process.stderr.write(baseLine + "\n");
            }
        },
    },
});

export enum LogLevel {
    Silly = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warn = 4,
    Error = 5,
    Fatal = 6
}
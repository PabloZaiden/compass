import type { ProcessOutput } from "./models";
import { AppContext, type Logger } from "@pablozaiden/terminator";

/**
 * Get the current logger from AppContext.
 */
function getLogger(): Logger {
    return AppContext.current.logger;
}

/// Reads a stream and logs each chunk as it arrives, populating the chunks array with the content.
async function readAndLogStream(
    stream: ReadableStream<Uint8Array>,
    chunks: string[],
    prefix: string
): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        chunks.push(text);
        buffer += text;

        // Log complete lines as they arrive
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
            if (line.trim()) {
                getLogger().trace(`${prefix}: ${line}`);
            }
        }
    }

    // Log any remaining content in the buffer
    if (buffer.trim()) {
        getLogger().trace(`${prefix}: ${buffer}`);
    }
}

/// Executes a command in a given working directory and returns the process output.
/// Streams stdout and stderr to the logger as the command executes.
/// Supports cancellation via AbortSignal - will kill the process when aborted.
export async function run(
    workingDirectory: string,
    commandWithArgs: string[],
    signal?: AbortSignal
): Promise<ProcessOutput> {
    const commandForLogging = commandWithArgs[0] + " " + commandWithArgs.slice(1).map(arg => escapeArg(arg)).join(" ");
    getLogger().trace(`Running command: ${commandForLogging} in directory: ${workingDirectory}`);

    // Check if already aborted before starting
    if (signal?.aborted) {
        const error = new Error("Command was cancelled before starting");
        error.name = "AbortError";
        throw error;
    }

    const process = Bun.spawn({
        cmd: commandWithArgs,
        cwd: workingDirectory,
        stdout: "pipe",
        stderr: "pipe",
        stdin: "ignore"
    });

    // Set up abort handler to kill the process
    const abortHandler = () => {
        getLogger().trace(`Killing process due to abort signal`);
        process.kill();
    };
    
    if (signal) {
        signal.addEventListener("abort", abortHandler, { once: true });
    }

    try {
        const stdOutChunks: string[] = [];
        const stdErrChunks: string[] = [];

        await Promise.all([
            readAndLogStream(process.stdout, stdOutChunks, "stdout"),
            readAndLogStream(process.stderr, stdErrChunks, "stderr"),
        ]);

        const exitCode = await process.exited;

        // Check if we were aborted
        if (signal?.aborted) {
            const error = new Error("Command was cancelled");
            error.name = "AbortError";
            throw error;
        }

        getLogger().trace(`Command exited with code: ${exitCode}`);

        return {
            stdOut: stdOutChunks.join(""),
            stdErr: stdErrChunks.join(""),
            exitCode
        };
    } finally {
        // Clean up abort listener
        if (signal) {
            signal.removeEventListener("abort", abortHandler);
        }
    }
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
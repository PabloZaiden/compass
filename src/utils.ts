import type { ProcessOutput } from "./models";
import { logger } from "./logging";

/// Reads a stream and logs each chunk as it arrives, returning the full content.
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
                logger.trace(`${prefix}: ${line}`);
            }
        }
    }

    // Log any remaining content in the buffer
    if (buffer.trim()) {
        logger.trace(`${prefix}: ${buffer}`);
    }
}

/// Executes a command in a given working directory and returns the process output.
/// Streams stdout and stderr to the logger as the command executes.
export async function run(workingDirectory: string, ...commandWithArgs: string[]): Promise<ProcessOutput> {
    const commandForLogging = commandWithArgs[0] + " " + commandWithArgs.slice(1).map(arg => escapeArg(arg)).join(" ");
    logger.trace(`Running command: ${commandForLogging} in directory: ${workingDirectory}`);

    const process = Bun.spawn({
        cmd: commandWithArgs,
        cwd: workingDirectory,
        stdout: "pipe",
        stderr: "pipe",
        stdin: "ignore"
    });

    const stdOutChunks: string[] = [];
    const stdErrChunks: string[] = [];

    await Promise.all([
        readAndLogStream(process.stdout, stdOutChunks, "stdout"),
        readAndLogStream(process.stderr, stdErrChunks, "stderr"),
    ]);

    const exitCode = await process.exited;

    logger.trace(`Command exited with code: ${exitCode}`);

    return {
        stdOut: stdOutChunks.join(""),
        stdErr: stdErrChunks.join(""),
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
import { spawn } from "child_process";
import { cp, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { Logger, LogLevel } from "./logger.ts";
import type { ProcessOutput } from "./models.ts";

export class FileSystemUtils {
  static async copyDirectory(sourceDir: string, destinationDir: string): Promise<void> {
    try {
      await mkdir(destinationDir, { recursive: true });
      await cp(sourceDir, destinationDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to copy directory from ${sourceDir} to ${destinationDir}: ${error}`);
    }
  }
}

export class StringExtensions {
  static escapeArg(arg: string): string {
    // Escape shell arguments - proper shell escaping for use in command strings
    // Replace double quotes with escaped quotes and wrap in quotes
    if (arg.includes("'")) {
      // If arg contains single quotes, use double quotes and escape any double quotes
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    // Otherwise use single quotes (safer for most cases)
    return `'${arg}'`;
  }

  static toJsonString(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }
}

export class ProcessUtils {
  static async git(cwd: string, arguments_: string): Promise<ProcessOutput> {
    return this.run(cwd, "git", arguments_);
  }

  static async run(workingDirectory: string, command: string, arguments_: string): Promise<ProcessOutput> {
    Logger.log(
      `Running command: ${command} ${arguments_} in ${workingDirectory}`,
      LogLevel.Verbose
    );

    try {
      return await new Promise((resolve) => {
        let stdout = "";
        let stderr = "";

        // Construct the full command string for the shell
        const fullCommand = `${command} ${arguments_}`;

        const child = spawn(fullCommand, {
          cwd: workingDirectory,
          shell: true,
        });

        child.stdout?.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr?.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("error", (error) => {
          Logger.log(`Error running process: ${error.message}`, LogLevel.Error);
          resolve({
            stdout: null,
            stderr: `PROCESS_ERROR: ${error.message}`,
            exitCode: -1,
          });
        });

        child.on("close", (code) => {
          resolve({
            stdout: stdout || null,
            stderr: stderr || null,
            exitCode: code ?? -1,
          });
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.log(`Error running process: ${errorMessage}`, LogLevel.Error);
      return {
        stdout: null,
        stderr: `PROCESS_ERROR: ${errorMessage}`,
        exitCode: -1,
      };
    }
  }
}

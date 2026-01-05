import { parseArgs } from "util";

export type Command = "interactive" | "run" | "help";

export interface ParsedCliOptions {
    repo?: string;
    fixture?: string;
    agent?: string;
    iterations?: string;
    "output-mode"?: string;
    "log-level"?: string;
    "use-cache"?: boolean;
    "stop-on-error"?: boolean;
    "allow-full-access"?: boolean;
    model?: string;
    "eval-model"?: string;
}

export interface ParsedCli {
    command: Command;
    options: ParsedCliOptions;
    positionals: string[];
}

const cliOptions = {
    repo: { type: "string" },
    fixture: { type: "string" },
    agent: { type: "string" },
    iterations: { type: "string" },
    "output-mode": { type: "string" },
    "log-level": { type: "string" },
    "use-cache": { type: "boolean" },
    "stop-on-error": { type: "boolean" },
    "allow-full-access": { type: "boolean" },
    model: { type: "string" },
    "eval-model": { type: "string" },
} as const;

const validCommands: Command[] = ["interactive", "run", "help"];

export function parseCliArgs(args: string[]): ParsedCli {
    // First, check if the first arg is a command
    const firstArg = args[0];
    let command: Command = "interactive";
    let remainingArgs = args;

    if (firstArg && validCommands.includes(firstArg as Command)) {
        command = firstArg as Command;
        remainingArgs = args.slice(1);
    } else if (firstArg && !firstArg.startsWith("-")) {
        // Unknown command
        throw new Error(`Unknown command: ${firstArg}. Valid commands are: ${validCommands.join(", ")}`);
    }

    const { values, positionals } = parseArgs({
        args: remainingArgs,
        options: cliOptions,
        strict: true,
        // Positionals are currently not used by any commands; disallow them to catch mistakes early.
        allowPositionals: false,
        allowNegative: true,
    });

    return {
        command,
        options: values as ParsedCliOptions,
        positionals,
    };
}

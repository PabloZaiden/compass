import { parseArgs } from "util";
import {
    modeRegistry,
    getRegisteredModes,
    type ExecutionMode,
} from "../modes";

// Re-export option types from options module
export type { RunOptions, CheckOptions } from "../options";
export type { InteractiveOptions } from "../interactive/mode";

/**
 * Command types - derived from registered modes plus "help"
 */
export type Command = "interactive" | "run" | "check" | "help";

/**
 * Empty options type for help command
 */
export interface HelpOptions {}

/**
 * Union type for all options (for backward compatibility)
 */
export type ParsedCliOptions = Record<string, unknown>;

/**
 * Discriminated union for parsed CLI result
 */
export type ParsedCli =
    | { command: "run"; options: ParsedCliOptions; commandPath: string[] }
    | { command: "interactive"; options: ParsedCliOptions; commandPath: string[] }
    | { command: "check"; options: ParsedCliOptions; commandPath: string[] }
    | { command: "help"; options: HelpOptions; commandPath: string[] };

/**
 * Extracts the command chain from arguments.
 * A command chain consists of all non-flag arguments (those not starting with "--")
 * that appear before any flags. Everything from the first flag onward is passed
 * to parseArgs, which uses the mode's schema to determine which flags take values.
 */
export function extractCommandChain(args: string[]): { commandPath: string[]; flagArgs: string[] } {
    const firstFlagIndex = args.findIndex(arg => arg.startsWith("--"));

    if (firstFlagIndex === -1) {
        // No flags, everything is command path
        return { commandPath: [...args], flagArgs: [] };
    }

    return {
        commandPath: args.slice(0, firstFlagIndex),
        flagArgs: args.slice(firstFlagIndex),
    };
}

/**
 * Resolves a command path to a mode and validates it.
 * Returns the resolved mode and any remaining path segments.
 */
export function resolveCommandPath(
    commandPath: string[]
): { command: Command; mode: ExecutionMode; remainingPath: string[]; showHelp: boolean } {
    const validCommands = getRegisteredModes();

    if (commandPath.length === 0) {
        // Default to interactive
        return {
            command: "interactive" as Command,
            mode: modeRegistry["interactive"]!,
            remainingPath: [],
            showHelp: false,
        };
    }

    // Check for help as implicit subcommand
    const lastSegment = commandPath[commandPath.length - 1]!;
    const isHelpRequest = lastSegment === "help";
    const pathWithoutHelp = isHelpRequest ? commandPath.slice(0, -1) : commandPath;

    // If just "help" by itself
    if (pathWithoutHelp.length === 0 && isHelpRequest) {
        return {
            command: "help" as Command,
            mode: { name: "help", description: "Show help", options: {}, execute: async () => {} },
            remainingPath: [],
            showHelp: true,
        };
    }

    const rootCommand = pathWithoutHelp[0]!;

    if (!validCommands.includes(rootCommand)) {
        throw new Error(`Unknown command: ${rootCommand}. Valid commands are: ${validCommands.join(", ")}`);
    }

    const command = rootCommand as Command;
    let mode: ExecutionMode = modeRegistry[command]!;
    const remainingPath = pathWithoutHelp.slice(1);

    // Traverse submodes if any
    let currentPath = remainingPath;
    while (currentPath.length > 0 && mode.submodes) {
        const submodeName = currentPath[0]!;
        if (mode.submodes[submodeName]) {
            mode = mode.submodes[submodeName]!;
            currentPath = currentPath.slice(1);
        } else if (submodeName === "help") {
            // Help as subcommand - stop here
            break;
        } else {
            // Unknown submode
            throw new Error(
                `Unknown subcommand: ${submodeName}. Valid subcommands for '${command}' are: ${Object.keys(
                    mode.submodes
                ).join(", ")}, help`
            );
        }
    }

    return { command, mode, remainingPath: currentPath, showHelp: isHelpRequest };
}

/**
 * Parses CLI arguments into a structured result.
 * First extracts the command chain from non-flag arguments,
 * then parses flags according to the mode's schema.
 */
export function parseCliArgs(args: string[]): ParsedCli {
    // Step 1: Extract command chain and flag arguments
    const { commandPath, flagArgs } = extractCommandChain(args);

    // Step 2: Resolve command and get its option schema
    const { command, mode, showHelp } = resolveCommandPath(commandPath);

    // If showing help, return early with help command
    if (showHelp) {
        return { command: "help", options: {}, commandPath };
    }

    // Step 3: Parse flags using the mode's schema
    const { values } = parseArgs({
        args: flagArgs,
        options: mode.options,
        strict: true,
        allowPositionals: false,
        allowNegative: true,
    });

    // Step 4: Return typed result based on command
    return { command, options: values as ParsedCliOptions, commandPath };
}

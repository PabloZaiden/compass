import type { ParseArgsConfig } from "util";
import type { OptionDescription } from "../options/schema";

/**
 * Schema for command-line options, compatible with Node's parseArgs.
 */
export type OptionsSchema = ParseArgsConfig["options"];

// Re-export OptionDescription for convenience
export type { OptionDescription } from "../options/schema";

/**
 * ExecutionMode interface - the core abstraction for all CLI commands.
 *
 * Each mode is a self-contained unit that defines:
 * - Its name and description
 * - CLI options schema and descriptions
 * - Optional nested submodes
 * - The execution logic
 *
 * Modes self-register by being exported from their respective folders.
 */
export interface ExecutionMode<TOptions = unknown> {
    /** The command name (e.g., "run", "check", "interactive") */
    readonly name: string;

    /** Human-readable description for help text */
    readonly description: string;

    /** CLI options schema for parseArgs */
    readonly options: OptionsSchema;

    /** Descriptions of options for help text */
    readonly optionDescriptions?: Record<string, OptionDescription>;

    /** Nested submodes (for multi-level commands) */
    readonly submodes?: Record<string, ExecutionMode>;

    /** Example usage strings for help text */
    readonly examples?: string[];

    /**
     * Execute the mode with the given options.
     * @param options - Parsed CLI options
     * @returns A promise that resolves when execution is complete
     */
    execute(options: TOptions): Promise<void>;
}

/**
 * Registry of all available execution modes.
 * Modes register themselves by adding to this object.
 */
export const modeRegistry: Record<string, ExecutionMode> = {};

/**
 * Registers a mode in the global registry.
 * This is called automatically when a mode module is imported.
 */
export function registerMode(mode: ExecutionMode): void {
    modeRegistry[mode.name] = mode;
}

/**
 * Gets a list of all registered mode names.
 */
export function getRegisteredModes(): string[] {
    return Object.keys(modeRegistry);
}

/**
 * Gets a mode by name from the registry.
 */
export function getMode(name: string): ExecutionMode | undefined {
    return modeRegistry[name];
}

/**
 * Resolves a command path (e.g., ["run"] or ["check"]) to a mode.
 * Supports nested submodes.
 */
export function resolveMode(
    commandPath: string[]
): { mode: ExecutionMode; remainingPath: string[] } | undefined {
    if (commandPath.length === 0) {
        return undefined;
    }

    const rootModeName = commandPath[0]!;
    const rootMode = modeRegistry[rootModeName];

    if (!rootMode) {
        return undefined;
    }

    let currentMode = rootMode;
    let index = 1;

    // Traverse submodes
    while (index < commandPath.length && currentMode.submodes) {
        const submodeName = commandPath[index]!;
        const submode = currentMode.submodes[submodeName];

        if (!submode) {
            break;
        }

        currentMode = submode;
        index++;
    }

    return {
        mode: currentMode,
        remainingPath: commandPath.slice(index),
    };
}

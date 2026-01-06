import { parseCliArgs, extractCommandChain, type ParsedCli } from "./parser";
import { printHelp } from "./help";
import { modeRegistry } from "../modes";
import { logger } from "../logging";

// Re-export types for external consumers
export {
    parseCliArgs,
    type ParsedCliOptions,
    type ParsedCli,
    type Command,
    type RunOptions,
    type InteractiveOptions,
    type CheckOptions,
} from "./parser";
export { printHelp } from "./help";

/**
 * Main CLI entry point.
 * Parses arguments, resolves the mode, and executes it.
 */
export async function runCli(args: string[]): Promise<void> {
    // Extract command chain first so we can show context-aware help on errors
    const { commandPath } = extractCommandChain(args);

    let parsed: ParsedCli;
    try {
        parsed = parseCliArgs(args);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error.message);
        } else {
            logger.error("Failed to parse command-line arguments:", error);
        }
        // Show help for the command that was being parsed
        printHelp(commandPath.length > 0 ? commandPath : undefined);
        process.exitCode = 1;
        return;
    }

    // Handle help command specially
    if (parsed.command === "help") {
        printHelp(parsed.commandPath);
        return;
    }

    // Get the mode from registry and execute
    const mode = modeRegistry[parsed.command];
    if (!mode) {
        logger.error(`Unknown command: ${parsed.command}`);
        printHelp();
        process.exitCode = 1;
        return;
    }

    try {
        await mode.execute(parsed.options);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error.message);
        } else {
            logger.error("An unexpected error occurred:", error);
        }
        process.exitCode = 1;
    }
}

import { registerMode, type ExecutionMode } from "../modes/mode";
import { Runner } from "./runner";
import { runConfigFromParsedOptions } from "../runconfig/process";
import { logger } from "../logging";
import {
    runOptionsSchema,
    type RunOptions,
    toParseArgsOptions,
    toOptionDescriptions,
    applyCommonOptions,
} from "../options";

/**
 * RunMode - executes evaluation runs against a repository.
 * 
 * Uses runOptionsSchema as the single source of truth for:
 * - CLI option definitions
 * - parseArgs configuration
 * - Help text generation
 * - Default values
 */
export const runMode: ExecutionMode<RunOptions> = {
    name: "run",
    description: "Run the evaluation with the specified configuration",
    options: toParseArgsOptions(runOptionsSchema),
    optionDescriptions: toOptionDescriptions(runOptionsSchema),
    examples: [
        "compass run --repo ./my-repo --fixture ./prompts.json --agent opencode",
        "compass run --repo ./repo --fixture ./fix.json --agent codex --use-cache",
    ],

    async execute(options: RunOptions): Promise<void> {
        applyCommonOptions(options);

        const config = await runConfigFromParsedOptions(options);

        const runner = new Runner();

        try {
            const result = await runner.run(config);
            logger.info("Run completed successfully");
            Bun.stdout.write(JSON.stringify(result, null, 2) + "\n");
        } catch (error) {
            logger.error("Run failed:", error);
            process.exit(1);
        }
    },
};

// Self-register
registerMode(runMode);

// Re-export for convenience
export { type RunOptions } from "../options";

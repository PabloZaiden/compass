import { registerMode, type ExecutionMode } from "../modes/mode";
import {
    checkOptionsSchema,
    type CheckOptions,
    toParseArgsOptions,
    toOptionDescriptions,
    getStringOption,
    applyCommonOptions,
} from "../options";
import { Checker } from "./checker";

/**
 * CheckMode - verifies that required agent dependencies are installed.
 *
 * Uses checkOptionsSchema as the single source of truth for:
 * - CLI option definitions
 * - parseArgs configuration  
 * - Help text generation
 */
export const checkMode: ExecutionMode<CheckOptions> = {
    name: "check",
    description: "Check if all required agent dependencies are installed",
    options: toParseArgsOptions(checkOptionsSchema),
    optionDescriptions: toOptionDescriptions(checkOptionsSchema),
    examples: [
        "compass check                    # Check all agent dependencies",
        "compass check --agent copilot    # Check Copilot dependencies only",
    ],

    async execute(options: CheckOptions): Promise<void> {
        applyCommonOptions(options);

        const agentFilter = getStringOption(options, checkOptionsSchema, "agent");

        const checker = new Checker();
        const result = await checker.check(agentFilter);
        
        checker.logResults(result);

        if (!result.success) {
            process.exitCode = 1;
        }
    },
};

// Self-register
registerMode(checkMode);

// Re-export for convenience
export { type CheckOptions } from "../options";

import { registerMode, type ExecutionMode } from "../modes/mode";
import { logger } from "../logging";
import { AgentTypes, createAgent } from "../agents/factory";
import { defaultAgentOptions } from "../agents/agent";
import { parseEnum } from "../models";
import {
    checkOptionsSchema,
    type CheckOptions,
    toParseArgsOptions,
    toOptionDescriptions,
    getStringOption,
} from "../options";

/**
 * Get all numeric values from a numeric enum.
 */
function getEnumValues<T extends object>(enumObj: T): number[] {
    return Object.values(enumObj).filter((v): v is number => typeof v === "number");
}

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
        const agentFilter = getStringOption(options, checkOptionsSchema, "agent");
        let hasErrors = false;

        // Get all agent types as numeric enum values
        const allAgentTypes = getEnumValues(AgentTypes);

        // Get agent types to check
        const agentTypesToCheck: AgentTypes[] = [];

        if (agentFilter) {
            // Find matching agent type by name using parseEnum
            const matchingType = parseEnum(AgentTypes, agentFilter);

            if (matchingType === undefined) {
                logger.error(`Unknown agent type: ${agentFilter}`);
                logger.info(`Valid agent types: ${allAgentTypes.map((t) => AgentTypes[t]).join(", ")}`);
                process.exitCode = 1;
                return;
            }

            agentTypesToCheck.push(matchingType);
        } else {
            // Check all agents
            agentTypesToCheck.push(...allAgentTypes);
        }

        logger.info("Checking agent dependencies...");

        for (const agentType of agentTypesToCheck) {
            const agentName = AgentTypes[agentType];

            let agent;
            try {
                agent = createAgent(agentType, defaultAgentOptions);
            } catch (error) {
                logger.warn(`\n${agentName}: (skipped - ${error instanceof Error ? error.message : "not supported"})`);
                continue;
            }

            const binaries = agent.requiredBinaries();

            logger.info(`\n${agentName}:`);

            for (const binary of binaries) {
                const path = Bun.which(binary);

                if (path) {
                    logger.info(`  ✓ ${binary} found at ${path}`);
                } else {
                    logger.error(`  ✗ ${binary} not found in PATH`);
                    hasErrors = true;
                }
            }
        }

        if (hasErrors) {
            logger.error("\nSome dependencies are missing. Please install them and try again.");
            process.exitCode = 1;
        } else {
            logger.info("\nAll dependencies are available.");
        }
    },
};

// Self-register
registerMode(checkMode);

// Re-export for convenience
export { type CheckOptions } from "../options";

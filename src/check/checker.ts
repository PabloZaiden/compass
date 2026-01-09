import { AgentTypes, createAgent } from "../agents/factory";
import { defaultAgentOptions } from "../agents/agent";
import { parseEnum } from "../models";
import { AppContext, type Logger } from "@pablozaiden/terminatui";

/**
 * Get the current logger from AppContext.
 */
function getLogger(): Logger {
    return AppContext.current.logger;
}

/**
 * Get all numeric values from a numeric enum.
 */
function getEnumValues<T extends object>(enumObj: T): number[] {
    return Object.values(enumObj).filter((v): v is number => typeof v === "number");
}

/**
 * Result for a single binary check.
 */
export interface BinaryCheckResult {
    /** Name of the binary */
    binary: string;
    /** Whether the binary was found */
    found: boolean;
    /** Path to the binary if found */
    path?: string;
}

/**
 * Result for a single agent's dependency check.
 */
export interface AgentCheckResult {
    /** Agent type that was checked */
    agentType: AgentTypes;
    /** Agent name */
    agentName: string;
    /** Whether the agent was skipped (e.g., not supported) */
    skipped: boolean;
    /** Reason for skipping (if skipped) */
    skipReason?: string;
    /** Results for each required binary */
    binaries: BinaryCheckResult[];
}

/**
 * Result of the dependency check.
 */
export interface CheckerResult {
    /** Whether all checks passed (no missing dependencies) */
    success: boolean;
    /** Results for each agent checked */
    agents: AgentCheckResult[];
    /** Error message if agent filter was invalid */
    error?: string;
}

/**
 * Checker - verifies that required agent dependencies are installed.
 */
export class Checker {
    /**
     * Check dependencies for agents.
     * @param agentFilter Optional agent name to check only that agent
     */
    async check(agentFilter?: string): Promise<CheckerResult> {
        // Get all agent types as numeric enum values
        const allAgentTypes = getEnumValues(AgentTypes);

        // Get agent types to check
        const agentTypesToCheck: AgentTypes[] = [];

        if (agentFilter) {
            // Find matching agent type by name using parseEnum
            const matchingType = parseEnum(AgentTypes, agentFilter);

            if (matchingType === undefined) {
                return {
                    success: false,
                    agents: [],
                    error: `Unknown agent type: ${agentFilter}. Valid types: ${allAgentTypes.map((t) => AgentTypes[t]).join(", ")}`,
                };
            }

            agentTypesToCheck.push(matchingType);
        } else {
            // Check all agents
            agentTypesToCheck.push(...allAgentTypes);
        }

        const agentResults: AgentCheckResult[] = [];
        let hasErrors = false;

        for (const agentType of agentTypesToCheck) {
            const agentName = AgentTypes[agentType];

            let agent;
            try {
                agent = createAgent(agentType, defaultAgentOptions);
            } catch (error) {
                agentResults.push({
                    agentType,
                    agentName,
                    skipped: true,
                    skipReason: error instanceof Error ? error.message : "not supported",
                    binaries: [],
                });
                continue;
            }

            const requiredBinaries = agent.requiredBinaries();
            const binaryResults: BinaryCheckResult[] = [];

            for (const binary of requiredBinaries) {
                const path = Bun.which(binary);

                if (path) {
                    binaryResults.push({ binary, found: true, path });
                } else {
                    binaryResults.push({ binary, found: false });
                    hasErrors = true;
                }
            }

            agentResults.push({
                agentType,
                agentName,
                skipped: false,
                binaries: binaryResults,
            });
        }

        return {
            success: !hasErrors,
            agents: agentResults,
        };
    }

    /**
     * Log the results of a check to the console.
     */
    logResults(result: CheckerResult): void {
        if (result.error) {
            getLogger().error(result.error);
            return;
        }

        getLogger().info("Checking agent dependencies...");

        for (const agentResult of result.agents) {
            if (agentResult.skipped) {
                getLogger().warn(`\n${agentResult.agentName}: (skipped - ${agentResult.skipReason})`);
                continue;
            }

            getLogger().info(`\n${agentResult.agentName}:`);

            for (const binary of agentResult.binaries) {
                if (binary.found) {
                    getLogger().info(`  ✓ ${binary.binary} found at ${binary.path}`);
                } else {
                    getLogger().error(`  ✗ ${binary.binary} not found in PATH`);
                }
            }
        }

        if (result.success) {
            getLogger().info("\nAll dependencies are available.");
        } else {
            getLogger().error("\nSome dependencies are missing. Please install them and try again.");
        }
    }
}

import type { OptionSchema } from "./schema";
import { AgentTypes } from "../agents/factory";
import { values } from "../models";

/**
 * Lazy evaluation helper for dynamic agent types.
 */
const getAgentTypes = () => values(AgentTypes).join(", ");

/**
 * Schema for the "generate" command options.
 * This is the single source of truth for:
 * - CLI option names and types
 * - parseArgs configuration
 * - Help text descriptions
 * - Default values
 * - Required/optional status
 * 
 * Note: Logging options (--log-level, --detailed-logs) are handled
 * automatically by the terminator framework at the application level.
 */
export const generateOptionsSchema = {
    repo: {
        type: "string",
        description: "Path to the repository to analyze",
        placeholder: "path",
        required: true,
    },
    agent: {
        type: "string",
        description: "Agent type to use for generation",
        placeholder: "type",
        required: true,
        validValues: getAgentTypes,
    },
    count: {
        type: "string",
        description: "Number of prompts to generate",
        placeholder: "",
        required: true,
    },
    model: {
        type: "string",
        description: "Model to use for the agent",
        placeholder: "name",
    },
    steering: {
        type: "string",
        description: "Additional instructions to steer generation",
        placeholder: "text",
    },
    "use-cache": {
        type: "boolean",
        description: "Enable/disable caching of agent responses",
        default: false,
    },
} as const satisfies OptionSchema;

/**
 * Type derived from the generate options schema.
 */
export type GenerateOptions = {
    repo: string;
    agent: string;
    count: string;
    model?: string;
    steering?: string;
    "use-cache"?: boolean;
};

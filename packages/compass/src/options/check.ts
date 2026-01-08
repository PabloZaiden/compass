import type { OptionSchema } from "./schema";
import { AgentTypes } from "../agents/factory";
import { values } from "../models";

/**
 * Lazy evaluation helper for dynamic enum values.
 */
const getAgentTypes = () => values(AgentTypes).join(", ");

/**
 * Schema for the "check" command options.
 * 
 * Note: Logging options (--log-level, --detailed-logs) are handled
 * automatically by the terminator framework at the application level.
 */
export const checkOptionsSchema = {
    agent: {
        type: "string",
        description: "Check dependencies for a specific agent only",
        placeholder: "type",
        validValues: getAgentTypes,
    },
} as const satisfies OptionSchema;

/**
 * Type for parsed check options (derived from schema).
 */
export type CheckOptions = {
    agent?: string;
};

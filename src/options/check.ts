import type { OptionSchema } from "./schema";
import { AgentTypes } from "../agents/factory";
import { values } from "../models";

/**
 * Lazy evaluation helper for dynamic enum values.
 */
const getAgentTypes = () => values(AgentTypes).join(", ");

/**
 * Schema for the "check" command options.
 */
export const checkOptionsSchema = {
    agent: {
        type: "string",
        description: "Check dependencies for a specific agent only",
        placeholder: "type",
        validValues: getAgentTypes,
    },
    "detailed-logs": {
        type: "boolean",
        description: "Show detailed logs with timestamp and level",
        default: false,
    },
} as const satisfies OptionSchema;

/**
 * Type for parsed check options (derived from schema).
 */
export type CheckOptions = {
    [K in keyof typeof checkOptionsSchema]?: 
        (typeof checkOptionsSchema)[K]["type"] extends "string" ? string : boolean;
};

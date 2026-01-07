import type { OptionSchema } from "./schema";
import { AgentTypes } from "../agents/factory";
import { values } from "../models";
import { commonOptionsSchema, type CommonOptions } from "./common";

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
    ...commonOptionsSchema,
} as const satisfies OptionSchema;

/**
 * Type for parsed check options (derived from schema).
 */
export type CheckOptions = CommonOptions & {
    agent?: string;
};

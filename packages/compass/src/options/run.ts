import type { OptionSchema } from "./schema";
import { AgentTypes } from "../agents/factory";
import { OutputMode, values } from "../models";
import { commonOptionsSchema, type CommonOptions } from "./common";

/**
 * Lazy evaluation helpers for dynamic enum values.
 */
const getAgentTypes = () => values(AgentTypes).join(", ");
const getOutputModes = () => values(OutputMode).join(", ");

/**
 * Schema for the "run" command options.
 * This is the single source of truth for:
 * - CLI option names and types
 * - parseArgs configuration
 * - Help text descriptions
 * - Default values
 * - Required/optional status
 */
export const runOptionsSchema = {
    repo: {
        type: "string",
        description: "Path to the repository to evaluate",
        placeholder: "path",
        required: true,
    },
    fixture: {
        type: "string",
        description: "Path to the fixture JSON file",
        placeholder: "path",
        required: true,
    },
    agent: {
        type: "string",
        description: "Agent type to use",
        placeholder: "type",
        required: true,
        validValues: getAgentTypes,
    },
    iterations: {
        type: "string",
        description: "Number of iterations per prompt",
        placeholder: "n",
        default: "1",
    },
    "output-mode": {
        type: "string",
        description: "Output format",
        placeholder: "mode",
        validValues: getOutputModes,
        default: "Aggregated",
    },
    "use-cache": {
        type: "boolean",
        description: "Enable/disable caching of agent responses",
        default: false,
    },
    "stop-on-error": {
        type: "boolean",
        description: "Stop/continue execution on first error",
        default: true,
    },
    "allow-full-access": {
        type: "boolean",
        description: "Allow/restrict full repository access",
        default: true,
    },
    model: {
        type: "string",
        description: "Model to use for the agent",
        placeholder: "name",
        default: "based on --agent",
    },
    "eval-model": {
        type: "string",
        description: "Model to use for evaluation",
        placeholder: "name",
        default: "based on --agent",
    },
    ...commonOptionsSchema,
} as const satisfies OptionSchema;

/**
 * Type for parsed run options (derived from schema).
 */
export type RunOptions = CommonOptions & {
    repo?: string;
    fixture?: string;
    agent?: string;
    iterations?: string;
    "output-mode"?: string;
    "use-cache"?: boolean;
    "stop-on-error"?: boolean;
    "allow-full-access"?: boolean;
    model?: string;
    "eval-model"?: string;
};

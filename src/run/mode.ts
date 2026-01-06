import {
    registerMode,
    type ExecutionMode,
    type OptionDescription,
    type OptionsSchema,
} from "../modes/mode";
import { Runner } from "./runner";
import { fromParsedOptions } from "../config/process";
import { logger, LogLevel } from "../logging";
import { AgentTypes } from "../agents/factory";
import { OutputMode, values } from "../models";

/**
 * Options for the run mode.
 */
export interface RunOptions {
    repo?: string;
    fixture?: string;
    agent?: string;
    iterations?: string;
    "output-mode"?: string;
    "log-level"?: string;
    "use-cache"?: boolean;
    "stop-on-error"?: boolean;
    "allow-full-access"?: boolean;
    model?: string;
    "eval-model"?: string;
}

// Lazy evaluation helpers for dynamic values
const getAgentTypes = () => values(AgentTypes).join(", ");
const getOutputModes = () => values(OutputMode).join(", ");
const getLogLevels = () => values(LogLevel).join(", ");

const runOptionsSchema: OptionsSchema = {
    repo: { type: "string" },
    fixture: { type: "string" },
    agent: { type: "string" },
    iterations: { type: "string" },
    "output-mode": { type: "string" },
    "log-level": { type: "string" },
    "use-cache": { type: "boolean" },
    "stop-on-error": { type: "boolean" },
    "allow-full-access": { type: "boolean" },
    model: { type: "string" },
    "eval-model": { type: "string" },
} as const;

const runOptionDescriptions: Record<string, OptionDescription> = {
    repo: {
        description: "Path to the repository to evaluate (required)",
        placeholder: "path",
    },
    fixture: {
        description: "Path to the fixture JSON file (required)",
        placeholder: "path",
    },
    agent: {
        description: "Agent type to use (required)",
        placeholder: "type",
        validValues: getAgentTypes,
    },
    iterations: {
        description: "Number of iterations per prompt",
        placeholder: "n",
        default: "1",
    },
    "output-mode": {
        description: "Output format",
        placeholder: "mode",
        validValues: getOutputModes,
        default: "Aggregated",
    },
    "log-level": {
        description: "Logging verbosity",
        placeholder: "level",
        validValues: getLogLevels,
        default: "Info",
    },
    "use-cache": {
        description: "Enable/disable caching of agent responses",
        default: "false",
    },
    "stop-on-error": {
        description: "Stop/continue execution on first error",
        default: "true",
    },
    "allow-full-access": {
        description: "Allow/restrict full repository access",
        default: "true",
    },
    model: {
        description: "Model to use for the agent",
        placeholder: "name",
        default: "based on --agent",
    },
    "eval-model": {
        description: "Model to use for evaluation",
        placeholder: "name",
        default: "based on --agent",
    },
};

/**
 * RunMode - executes evaluation runs against a repository.
 */
export const runMode: ExecutionMode<RunOptions> = {
    name: "run",
    description: "Run the evaluation with the specified configuration",
    options: runOptionsSchema,
    optionDescriptions: runOptionDescriptions,
    examples: [
        "compass run --repo ./my-repo --fixture ./prompts.json --agent opencode",
        "compass run --repo ./repo --fixture ./fix.json --agent codex --use-cache",
    ],

    async execute(options: RunOptions): Promise<void> {
        const config = await fromParsedOptions(options);
        logger.settings.minLevel = config.logLevel;

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

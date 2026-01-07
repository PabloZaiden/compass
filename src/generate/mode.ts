import path from "node:path";
import { registerMode, type ExecutionMode } from "../modes/mode";
import { AgentTypes, defaultModels } from "../agents/factory";
import { logger } from "../logging";
import {
    generateOptionsSchema,
    type GenerateOptions,
    toParseArgsOptions,
    toOptionDescriptions,
    getRequiredStringOption,
    getStringOption,
    parseEnumOption,
    applyCommonOptions,
} from "../options";
import { Generator } from "./generator";

/**
 * GenerateMode - generates compass fixture files for a repository.
 *
 * Uses generateOptionsSchema as the single source of truth for:
 * - CLI option definitions
 * - parseArgs configuration
 * - Help text generation
 * - Default values
 */
export const generateMode: ExecutionMode<GenerateOptions> = {
    name: "generate",
    description: "Generate a compass fixture file for a repository",
    options: toParseArgsOptions(generateOptionsSchema),
    optionDescriptions: toOptionDescriptions(generateOptionsSchema),
    examples: [
        "compass generate --repo ./my-repo --agent opencode --count 5",
        "compass generate --repo ./my-repo --agent copilot --count 10 --model gpt-5",
        'compass generate --repo ./my-repo --agent gemini --count 10 --steering "Focus on API endpoints"',
    ],

    async execute(options: GenerateOptions): Promise<void> {
        applyCommonOptions(options);

        // Extract options
        const repoPath = path.resolve(getRequiredStringOption(options, generateOptionsSchema, "repo"));
        const agentTypeStr = getRequiredStringOption(options, generateOptionsSchema, "agent");
        const agentType = parseEnumOption(agentTypeStr, AgentTypes, "agent");
        const countStr = getRequiredStringOption(options, generateOptionsSchema, "count");
        const steering = getStringOption(options, generateOptionsSchema, "steering");

        // Model with agent-based default
        let model = getStringOption(options, generateOptionsSchema, "model");
        if (model === undefined) {
            model = defaultModels[agentType];
        }

        // Validate count is a positive integer
        const count = parseInt(countStr, 10);
        if (isNaN(count) || count <= 0) {
            logger.error("Count must be a positive integer");
            process.exit(1);
        }

        const generator = new Generator();
        const result = await generator.generate({
            repoPath,
            agentType,
            count,
            model,
            steering,
        });

        if (result.success) {
            process.exit(0);
        } else {
            logger.error(result.error ?? "Generation failed");
            process.exit(1);
        }
    },
};

// Self-register
registerMode(generateMode);

// Re-export for convenience
export { type GenerateOptions } from "../options";

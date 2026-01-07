import path from "node:path";
import { registerMode, type ExecutionMode } from "../modes/mode";
import { createAgent, AgentTypes } from "../agents/factory";
import { generator } from "../prompts";
import { logger } from "../logging";
import {
    generateOptionsSchema,
    type GenerateOptions,
    toParseArgsOptions,
    toOptionDescriptions,
    getRequiredStringOption,
    getStringOption,
    parseEnumOption,
} from "../options";

/**
 * Default model for generation if not specified.
 */
const DEFAULT_MODEL = "";

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
        "compass generate --repo ./my-repo --agent copilot --count 10",
        "compass generate --repo ./my-repo --agent opencode --count 5 --model gpt-4",
        'compass generate --repo ./my-repo --agent gemini --count 10 --steering "Focus on API endpoints"',
    ],

    async execute(options: GenerateOptions): Promise<void> {
        // Extract options
        const repoPath = path.resolve(getRequiredStringOption(options, generateOptionsSchema, "repo"));
        const agentTypeStr = getRequiredStringOption(options, generateOptionsSchema, "agent");
        const agentType = parseEnumOption(agentTypeStr, AgentTypes, "agent");
        const count = getRequiredStringOption(options, generateOptionsSchema, "count");
        const model = getStringOption(options, generateOptionsSchema, "model") ?? DEFAULT_MODEL;
        const steering = getStringOption(options, generateOptionsSchema, "steering");

        // Validate count is a positive integer
        const countNum = parseInt(count, 10);
        if (isNaN(countNum) || countNum <= 0) {
            logger.error("Count must be a positive integer");
            process.exit(1);
        }

        // Get repo folder name
        const repoFolderName = path.basename(repoPath);
        const expectedFileName = `${repoFolderName}.compass.json`;
        const expectedFilePath = path.join(repoPath, expectedFileName);

        // Build the prompt
        let steeringSection = "";
        if (steering && steering.trim()) {
            steeringSection = `## Additional Instructions\n\n${steering.trim()}`;
        }

        const prompt = generator
            .replace("{{REPO_FOLDER_NAME}}", repoFolderName)
            .replace("{{COUNT}}", count)
            .replace("{{STEERING}}", steeringSection);

        logger.info(`Generating fixture for repository: ${repoPath}`);
        logger.info(`Expected output: ${expectedFileName}`);
        logger.info(`Prompt count: ${count}`);
        logger.info(`Agent: ${agentType}`);
        if (model) {
            logger.info(`Model: ${model}`);
        }
        if (steering) {
            logger.info(`Steering: ${steering}`);
        }

        // Create and initialize the agent
        const agent = createAgent(agentType, {
            allowFullAccess: true,
        });

        try {
            await agent.init();
        } catch (error) {
            logger.error("Failed to initialize agent:", error);
            process.exit(1);
        }

        // Execute the agent
        try {
            logger.info("Running agent to generate fixture...");
            await agent.execute(prompt, model, repoPath);
        } catch (error) {
            logger.error("Agent execution failed:", error);
            process.exit(1);
        }

        // Check if the fixture file was created
        const file = Bun.file(expectedFilePath);
        const exists = await file.exists();

        if (exists) {
            logger.info(`✓ Fixture file created successfully: ${expectedFilePath}`);
            
            // Validate it's valid JSON
            try {
                const content = await file.text();
                const parsed = JSON.parse(content);
                
                if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
                    logger.warn("Warning: Fixture file does not contain a 'prompts' array");
                } else {
                    logger.info(`✓ Fixture contains ${parsed.prompts.length} prompts`);
                }
            } catch {
                logger.warn("Warning: Fixture file is not valid JSON");
            }
            
            process.exit(0);
        } else {
            logger.error(`✗ Fixture file was not created: ${expectedFilePath}`);
            logger.error("The agent did not create the expected output file.");
            process.exit(1);
        }
    },
};

// Self-register
registerMode(generateMode);

// Re-export for convenience
export { type GenerateOptions } from "../options";

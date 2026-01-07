import path from "node:path";
import { createAgent, AgentTypes, defaultModels } from "../agents/factory";
import { generator } from "../prompts";
import { logger } from "../logging";
import type { Fixture } from "../models";

/**
 * Configuration for fixture generation.
 */
export interface GeneratorConfig {
    /** Path to the repository to analyze */
    repoPath: string;
    /** Agent type to use for generation */
    agentType: AgentTypes;
    /** Number of prompts to generate */
    count: number;
    /** Model to use (defaults to agent's default model) */
    model?: string;
    /** Additional steering instructions */
    steering?: string;
}

/**
 * Result of fixture generation.
 */
export interface GeneratorResult {
    /** Whether the fixture was successfully created */
    success: boolean;
    /** Path to the generated fixture file */
    filePath: string;
    /** The parsed fixture content (if successful and valid) */
    fixture?: Fixture;
    /** Error message (if unsuccessful) */
    error?: string;
}

/**
 * Generator - creates compass fixture files for repositories.
 */
export class Generator {
    /**
     * Generate a fixture file for a repository.
     */
    async generate(config: GeneratorConfig): Promise<GeneratorResult> {
        const { repoPath, agentType, count, steering } = config;
        const model = config.model ?? defaultModels[agentType];

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
            .replaceAll("{{REPO_FOLDER_NAME}}", repoFolderName)
            .replaceAll("{{COUNT}}", String(count))
            .replaceAll("{{STEERING}}", steeringSection);


        logger.info(`Generating fixture for ${repoFolderName} with ${count} prompts using ${AgentTypes[agentType]}`);
        logger.trace(`Repository path: ${repoPath}`);
        logger.trace(`Expected output: ${expectedFileName}`);
        logger.trace(`Model: ${model}`);
        if (steering) {
            logger.trace(`Steering: ${steering}`);
        }

        logger.trace("Generated prompt for fixture generation: \n" + prompt);

        // Create and initialize the agent
        const agent = createAgent(agentType, {
            allowFullAccess: true,
        });

        try {
            await agent.init();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error("Failed to initialize agent:", error);
            return {
                success: false,
                filePath: expectedFilePath,
                error: `Failed to initialize agent: ${message}`,
            };
        }

        // Execute the agent
        try {
            logger.trace("Running agent to generate fixture...");
            await agent.execute(prompt, model, repoPath);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error("Agent execution failed:", error);
            return {
                success: false,
                filePath: expectedFilePath,
                error: `Agent execution failed: ${message}`,
            };
        }

        // Check if the fixture file was created
        const file = Bun.file(expectedFilePath);
        const exists = await file.exists();

        if (!exists) {
            logger.error(`✗ Fixture file was not created: ${expectedFilePath}`);
            return {
                success: false,
                filePath: expectedFilePath,
                error: "The agent did not create the expected output file.",
            };
        }

        logger.info(`✓ Fixture created: ${expectedFileName}`);

        // Validate it's valid JSON
        try {
            const content = await file.text();
            const parsed = JSON.parse(content) as Fixture;

            if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
                logger.warn("Warning: Fixture file does not contain a 'prompts' array");
                return {
                    success: false,
                    filePath: expectedFilePath,
                    error: "Fixture file does not contain a 'prompts' array",
                };
            }

            logger.trace(`Fixture contains ${parsed.prompts.length} prompts`);
            return {
                success: true,
                filePath: expectedFilePath,
                fixture: parsed,
            };
        } catch {
            logger.warn("Warning: Fixture file is not valid JSON");
            return {
                success: false,
                filePath: expectedFilePath,
                error: "Fixture file is not valid JSON",
            };
        }
    }
}

import path from "node:path";
import { createAgent, AgentTypes, defaultModels } from "../agents/factory";
import { Cache } from "../agents/cache";
import { generator } from "../prompts";
import { AppContext, type Logger } from "@pablozaiden/terminator";

/**
 * Get the current logger from AppContext.
 */
function getLogger(): Logger {
    return AppContext.current.logger;
}
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
    /** Whether to use caching for agent responses */
    useCache?: boolean;
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
    async generate(config: GeneratorConfig, signal?: AbortSignal): Promise<GeneratorResult> {
        const { repoPath, agentType, count, steering, useCache } = config;
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


        getLogger().info(`Generating fixture for ${repoFolderName} with ${count} prompts using ${AgentTypes[agentType]}`);
        getLogger().trace(`Repository path: ${repoPath}`);
        getLogger().trace(`Expected output: ${expectedFileName}`);
        getLogger().trace(`Model: ${model}`);
        getLogger().trace(`Use cache: ${useCache ?? false}`);
        if (steering) {
            getLogger().trace(`Steering: ${steering}`);
        }

        getLogger().trace("Generated prompt for fixture generation: \n" + prompt);

        // Create and initialize the agent
        const agentOptions = {
            allowFullAccess: true,
        };

        let agent = createAgent(agentType, agentOptions);
        
        // Wrap with cache if enabled
        if (useCache) {
            agent = new Cache(agent, agentOptions, repoPath, "generate");
        }

        // Check for cancellation before init
        if (signal?.aborted) {
            const abortError = new Error("Generation was cancelled");
            abortError.name = "AbortError";
            throw abortError;
        }

        try {
            await agent.init();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            getLogger().error("Failed to initialize agent:", error);
            return {
                success: false,
                filePath: expectedFilePath,
                error: `Failed to initialize agent: ${message}`,
            };
        }

        // Execute the agent
        try {
            // Check for cancellation before execute
            if (signal?.aborted) {
                const abortError = new Error("Generation was cancelled");
                abortError.name = "AbortError";
                throw abortError;
            }

            getLogger().trace("Running agent to generate fixture...");
            await agent.execute(prompt, model, repoPath, signal);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            getLogger().error("Agent execution failed:", error);
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
            getLogger().error(`✗ Fixture file was not created: ${expectedFilePath}`);
            return {
                success: false,
                filePath: expectedFilePath,
                error: "The agent did not create the expected output file.",
            };
        }

        getLogger().info(`✓ Fixture created: ${expectedFileName}`);

        // Validate it's valid JSON
        try {
            const content = await file.text();
            const parsed = JSON.parse(content) as Fixture;

            if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
                getLogger().warn("Warning: Fixture file does not contain a 'prompts' array");
                return {
                    success: false,
                    filePath: expectedFilePath,
                    error: "Fixture file does not contain a 'prompts' array",
                };
            }

            getLogger().trace(`Fixture contains ${parsed.prompts.length} prompts`);
            return {
                success: true,
                filePath: expectedFilePath,
                fixture: parsed,
            };
        } catch {
            getLogger().warn("Warning: Fixture file is not valid JSON");
            return {
                success: false,
                filePath: expectedFilePath,
                error: "Fixture file is not valid JSON",
            };
        }
    }
}

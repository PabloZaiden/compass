import { useState, useCallback } from "react";
import { Generator, type GeneratorResult } from "../../generate/generator";
import { logger } from "../../logging";
import type { GenerateConfig } from "./useGenerateConfig";

export interface GenerateOutcome {
    success: boolean;
    filePath?: string;
    error?: string;
}

export interface UseGeneratorResult {
    isGenerating: boolean;
    generatedPath: string | null;
    error: string | null;
    generate: (config: GenerateConfig) => Promise<GenerateOutcome>;
    reset: () => void;
}

export function useGenerator(): UseGeneratorResult {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPath, setGeneratedPath] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (config: GenerateConfig): Promise<GenerateOutcome> => {
        if (isGenerating) return { success: false, error: "Already generating" };

        setIsGenerating(true);
        setGeneratedPath(null);
        setError(null);

        try {
            logger.info("Starting fixture generation...");
            const generator = new Generator();
            const result: GeneratorResult = await generator.generate({
                repoPath: config.repoPath,
                agentType: config.agentType,
                count: config.count,
                model: config.model || undefined,
                steering: config.steering || undefined,
                useCache: config.useCache,
            });

            if (result.success) {
                setGeneratedPath(result.filePath);
                logger.info(`Fixture generated successfully: ${result.filePath}`);
                return { success: true, filePath: result.filePath };
            } else {
                const errorMessage = result.error ?? "Generation failed";
                setError(errorMessage);
                logger.error(`Generation failed: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            logger.error(`Generation failed: ${errorMessage}`);
            return { success: false, error: errorMessage };
        } finally {
            setIsGenerating(false);
        }
    }, [isGenerating]);

    const reset = useCallback(() => {
        setGeneratedPath(null);
        setError(null);
    }, []);

    return { isGenerating, generatedPath, error, generate, reset };
}

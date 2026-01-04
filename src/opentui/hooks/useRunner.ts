import { useState, useCallback } from "react";
import { Runner } from "../../runner";
import { logger } from "../../logging";
import type { Config } from "../../config/config";
import type { RunnerResult } from "../../models";

export interface UseRunnerResult {
    isRunning: boolean;
    result: RunnerResult | null;
    error: string | null;
    run: (config: Config) => Promise<void>;
    reset: () => void;
}

export function useRunner(): UseRunnerResult {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<RunnerResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async (config: Config) => {
        if (isRunning) return;

        setIsRunning(true);
        setResult(null);
        setError(null);

        try {
            logger.info("Starting benchmark run...");
            const runner = new Runner();
            const runResult = await runner.run(config);
            setResult(runResult);
            logger.info("Run completed successfully");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            logger.error(`Run failed: ${errorMessage}`);
        } finally {
            setIsRunning(false);
        }
    }, [isRunning]);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return { isRunning, result, error, run, reset };
}

import { useState, useCallback } from "react";
import { Runner } from "../../runner";
import { logger } from "../../logging";
import type { Config } from "../../config/config";
import type { RunnerResult } from "../../models";

export interface RunOutcome {
    success: boolean;
    result?: RunnerResult;
    error?: string;
}

export interface UseRunnerResult {
    isRunning: boolean;
    result: RunnerResult | null;
    error: string | null;
    run: (config: Config) => Promise<RunOutcome>;
    reset: () => void;
}

export function useRunner(): UseRunnerResult {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<RunnerResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async (config: Config): Promise<RunOutcome> => {
        if (isRunning) return { success: false, error: "Already running" };

        setIsRunning(true);
        setResult(null);
        setError(null);

        try {
            logger.info("Starting benchmark run...");
            const runner = new Runner();
            const runResult = await runner.run(config);
            setResult(runResult);
            logger.info("Run completed successfully");
            return { success: true, result: runResult };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            logger.error(`Run failed: ${errorMessage}`);
            return { success: false, error: errorMessage };
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

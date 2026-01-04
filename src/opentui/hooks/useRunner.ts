import { useState, useCallback } from "react";
import { Runner } from "../../runner";
import { logger } from "../../utils";
import type { Config } from "../../config/config";
import type { RunnerResult } from "../../models";
import type { FormValues } from "../types";

export interface UseRunnerResult {
    isRunning: boolean;
    result: RunnerResult | null;
    error: string | null;
    run: (values: FormValues) => Promise<void>;
    reset: () => void;
}

function formValuesToConfig(values: FormValues): Config {
    return {
        repoPath: values.repoPath,
        fixture: values.fixture,
        agentType: values.agentType,
        iterationCount: parseInt(values.iterationCount, 10) || 1,
        outputMode: values.outputMode,
        useCache: values.useCache,
        stopOnError: values.stopOnError,
        allowFullAccess: values.allowFullAccess,
        logLevel: values.logLevel,
        model: values.model,
        evalModel: values.evalModel,
    };
}

export function useRunner(): UseRunnerResult {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<RunnerResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async (values: FormValues) => {
        if (isRunning) return;

        setIsRunning(true);
        setResult(null);
        setError(null);

        try {
            logger.info("Starting benchmark run...");
            const runner = new Runner();
            const config = formValuesToConfig(values);
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

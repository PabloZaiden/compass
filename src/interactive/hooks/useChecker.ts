import { useState, useCallback } from "react";
import { Checker, type CheckerResult } from "../../check/checker";
import { logger } from "../../logging";

export interface CheckOutcome {
    success: boolean;
    error?: string;
}

export interface UseCheckerResult {
    isChecking: boolean;
    checkResult: CheckerResult | null;
    error: string | null;
    check: () => Promise<CheckOutcome>;
    reset: () => void;
}

export function useChecker(): UseCheckerResult {
    const [isChecking, setIsChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<CheckerResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const check = useCallback(async (): Promise<CheckOutcome> => {
        if (isChecking) return { success: false, error: "Already checking" };

        setIsChecking(true);
        setCheckResult(null);
        setError(null);

        try {
            logger.info("Checking agent dependencies...");
            const checker = new Checker();
            const result = await checker.check();

            setCheckResult(result);
            
            // Log the results
            checker.logResults(result);

            if (result.success) {
                logger.info("All dependency checks passed");
                return { success: true };
            } else {
                const errorMessage = result.error ?? "Some dependencies are missing";
                return { success: false, error: errorMessage };
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            logger.error(`Check failed: ${errorMessage}`);
            return { success: false, error: errorMessage };
        } finally {
            setIsChecking(false);
        }
    }, [isChecking]);

    const reset = useCallback(() => {
        setCheckResult(null);
        setError(null);
    }, []);

    return { isChecking, checkResult, error, check, reset };
}

import { useState, useCallback } from "react";
import type { CommandResult } from "../../core/command.ts";

/**
 * Outcome of command execution.
 */
export interface ExecutionOutcome<TResult = CommandResult> {
    success: boolean;
    result?: TResult;
    error?: Error;
}

export interface UseCommandExecutorResult<TResult = CommandResult> {
    /** Whether the command is currently executing */
    isExecuting: boolean;
    /** The result from the last execution */
    result: TResult | null;
    /** Error from the last execution, if any */
    error: Error | null;
    /** Execute the command - returns outcome when complete */
    execute: (...args: unknown[]) => Promise<ExecutionOutcome<TResult>>;
    /** Reset the state */
    reset: () => void;
}

/**
 * Hook for executing commands with loading/error/result state.
 * 
 * @param executeFn - The async function to execute
 * @returns Executor state and functions
 * 
 * @example
 * ```tsx
 * const { isExecuting, result, error, execute } = useCommandExecutor(
 *     async (config) => {
 *         return await runCommand(config);
 *     }
 * );
 * 
 * const outcome = await execute(config);
 * if (outcome.success) { ... }
 * ```
 */
export function useCommandExecutor<TResult = CommandResult>(
    executeFn: (...args: unknown[]) => Promise<TResult | void>
): UseCommandExecutorResult<TResult> {
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<TResult | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async (...args: unknown[]): Promise<ExecutionOutcome<TResult>> => {
        setIsExecuting(true);
        setError(null);
        setResult(null);

        try {
            const res = await executeFn(...args);
            if (res !== undefined) {
                setResult(res);
                return { success: true, result: res };
            }
            return { success: true };
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            setError(err);
            return { success: false, error: err };
        } finally {
            setIsExecuting(false);
        }
    }, [executeFn]);

    const reset = useCallback(() => {
        setIsExecuting(false);
        setResult(null);
        setError(null);
    }, []);

    return { isExecuting, result, error, execute, reset };
}

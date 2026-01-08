import { useState, useCallback, useRef } from "react";
import type { CommandResult } from "../../core/command.ts";
import { AbortError } from "../../core/command.ts";

/**
 * Outcome of command execution.
 */
export interface ExecutionOutcome<TResult = CommandResult> {
    success: boolean;
    result?: TResult;
    error?: Error;
    /** Whether the command was cancelled */
    cancelled?: boolean;
}

export interface UseCommandExecutorResult<TResult = CommandResult> {
    /** Whether the command is currently executing */
    isExecuting: boolean;
    /** The result from the last execution */
    result: TResult | null;
    /** Error from the last execution, if any */
    error: Error | null;
    /** Whether the last execution was cancelled */
    wasCancelled: boolean;
    /** Execute the command - returns outcome when complete */
    execute: (...args: unknown[]) => Promise<ExecutionOutcome<TResult>>;
    /** Cancel the currently running command */
    cancel: () => void;
    /** Reset the state */
    reset: () => void;
}

/**
 * Hook for executing commands with loading/error/result state and cancellation support.
 * 
 * @param executeFn - The async function to execute. Receives an AbortSignal as the last argument.
 * @returns Executor state and functions
 * 
 * @example
 * ```tsx
 * const { isExecuting, result, error, execute, cancel } = useCommandExecutor(
 *     async (config, signal) => {
 *         return await runCommand(config, signal);
 *     }
 * );
 * 
 * const outcome = await execute(config);
 * if (outcome.cancelled) { ... }
 * if (outcome.success) { ... }
 * ```
 */
export function useCommandExecutor<TResult = CommandResult>(
    executeFn: (...args: unknown[]) => Promise<TResult | void>
): UseCommandExecutorResult<TResult> {
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<TResult | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [wasCancelled, setWasCancelled] = useState(false);
    
    // Keep track of the current AbortController
    const abortControllerRef = useRef<AbortController | null>(null);

    const execute = useCallback(async (...args: unknown[]): Promise<ExecutionOutcome<TResult>> => {
        // Cancel any previous execution
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create a new AbortController for this execution
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        
        setIsExecuting(true);
        setError(null);
        setResult(null);
        setWasCancelled(false);

        try {
            // Pass the signal as the last argument
            const res = await executeFn(...args, abortController.signal);
            
            // Check if we were aborted
            if (abortController.signal.aborted) {
                setWasCancelled(true);
                return { success: false, cancelled: true };
            }
            
            if (res !== undefined) {
                setResult(res);
                return { success: true, result: res };
            }
            return { success: true };
        } catch (e) {
            // Check if this was a cancellation
            if (abortController.signal.aborted || e instanceof AbortError || (e instanceof Error && e.name === "AbortError")) {
                setWasCancelled(true);
                return { success: false, cancelled: true };
            }
            
            const err = e instanceof Error ? e : new Error(String(e));
            setError(err);
            return { success: false, error: err };
        } finally {
            setIsExecuting(false);
            if (abortControllerRef.current === abortController) {
                abortControllerRef.current = null;
            }
        }
    }, [executeFn]);

    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        // Cancel any running execution
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsExecuting(false);
        setResult(null);
        setError(null);
        setWasCancelled(false);
    }, []);

    return { isExecuting, result, error, wasCancelled, execute, cancel, reset };
}

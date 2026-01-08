import { useState, useEffect, useCallback } from "react";

/**
 * Log levels for display styling.
 */
export enum LogLevel {
    Silly = "silly",
    Trace = "trace",
    Debug = "debug",
    Info = "info",
    Warn = "warn",
    Error = "error",
    Fatal = "fatal",
}

/**
 * Log entry for display.
 */
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
}

/**
 * Log event emitted by the log source.
 */
export interface LogEvent {
    level: LogLevel;
    message: string;
}

/**
 * Log source that can be subscribed to.
 */
export interface LogSource {
    /** Subscribe to log events, returns unsubscribe function */
    subscribe: (callback: (event: LogEvent) => void) => () => void;
}

export interface UseLogStreamResult {
    /** All collected log entries */
    logs: LogEntry[];
    /** Clear all logs */
    clearLogs: () => void;
    /** Add a log entry manually */
    addLog: (level: LogLevel, message: string) => void;
}

/**
 * Hook for subscribing to a log stream.
 * 
 * @param source - Optional log source to subscribe to
 * @returns Log stream state and functions
 * 
 * @example
 * ```tsx
 * const { logs, clearLogs } = useLogStream(myLogSource);
 * ```
 */
export function useLogStream(source?: LogSource): UseLogStreamResult {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // Subscribe to log source
    useEffect(() => {
        if (!source) return;

        const unsubscribe = source.subscribe((event: LogEvent) => {
            setLogs((prev) => {
                const newEntry: LogEntry = {
                    timestamp: new Date(),
                    level: event.level,
                    message: event.message,
                };
                return [...prev, newEntry];
            });
        });

        return () => {
            unsubscribe?.();
        };
    }, [source]);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const addLog = useCallback((level: LogLevel, message: string) => {
        setLogs((prev) => [
            ...prev,
            { timestamp: new Date(), level, message },
        ]);
    }, []);

    return { logs, clearLogs, addLog };
}

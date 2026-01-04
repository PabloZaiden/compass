import { useState, useEffect, useCallback } from "react";
import { onLogEvent, type TuiLogEvent } from "../../logging";
import type { LogEntry } from "../types";

const MAX_LOGS = 100;

export interface UseLogStreamResult {
    logs: LogEntry[];
    clearLogs: () => void;
}

export function useLogStream(): UseLogStreamResult {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const unsubscribe = onLogEvent((event: TuiLogEvent) => {
            setLogs((prev) => {
                const newEntry: LogEntry = {
                    timestamp: new Date(),
                    level: event.level,
                    message: event.message,
                };
                const newLogs = [...prev, newEntry];
                // Keep only last MAX_LOGS to prevent memory issues
                return newLogs.slice(-MAX_LOGS);
            });
        });

        return () => {
            unsubscribe?.();
        };
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    return { logs, clearLogs };
}

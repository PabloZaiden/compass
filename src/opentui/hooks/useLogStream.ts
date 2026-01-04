import { useState, useEffect, useCallback } from "react";
import { onLogEvent, type TuiLogEvent } from "../../logging";
import type { LogEntry } from "../utils";

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
                return [...prev, newEntry];
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

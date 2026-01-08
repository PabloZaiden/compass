import { EventEmitter } from "events";
import { Logger } from "tslog";

export type TuiLogEvent = {
    message: string;
    level: LogLevel;
    timestamp: Date;
};

const logEventEmitter = new EventEmitter();
let tuiLoggingEnabled = false;
let detailedLogsEnabled = false;

export function setTuiLoggingEnabled(enabled: boolean): void {
    tuiLoggingEnabled = enabled;
}

export function setDetailedLogs(enabled: boolean): void {
    detailedLogsEnabled = enabled;
}

export function onLogEvent(listener: (event: TuiLogEvent) => void): () => void {
    logEventEmitter.on("log", listener);
    return () => logEventEmitter.off("log", listener);
}

export const logger = new Logger({
    type: "pretty",
    overwrite: {
        transportFormatted: (logMetaMarkup, logArgs, logErrors, logMeta) => {
            const baseLine = `${logMetaMarkup}${logArgs.join(" ")}${logErrors.join("")}`;
            const simpleLine = `${logArgs.join(" ")}${logErrors.join("")}`;
            const levelFromMeta = typeof (logMeta as any)?.logLevelId === "number" ? (logMeta as any).logLevelId as LogLevel : LogLevel.Info;

            // Use detailed format (with date/level) or simple format (message only)
            const output = detailedLogsEnabled ? baseLine : simpleLine;

            if (tuiLoggingEnabled) {
                logEventEmitter.emit("log", {
                    message: output,
                    level: levelFromMeta,
                    timestamp: new Date(),
                } satisfies TuiLogEvent);
            } else {
                process.stderr.write(output + "\n");
            }
        },
    },
});

export enum LogLevel {
    Silly = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warn = 4,
    Error = 5,
    Fatal = 6
}

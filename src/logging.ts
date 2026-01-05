import { EventEmitter } from "events";
import { Logger } from "tslog";

export type TuiLogEvent = {
    message: string;
    level: LogLevel;
    timestamp: Date;
};

const logEventEmitter = new EventEmitter();
let tuiLoggingEnabled = false;

export function setTuiLoggingEnabled(enabled: boolean): void {
    tuiLoggingEnabled = enabled;
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
            const levelFromMeta = typeof (logMeta as any)?.logLevelId === "number" ? (logMeta as any).logLevelId as LogLevel : LogLevel.Info;

            if (tuiLoggingEnabled) {
                logEventEmitter.emit("log", {
                    message: baseLine,
                    level: levelFromMeta,
                    timestamp: new Date(),
                } satisfies TuiLogEvent);
            } else {
                // Everything pretty goes to stderr, never stdout
                process.stderr.write(baseLine + "\n");
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

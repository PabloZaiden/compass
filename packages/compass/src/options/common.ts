import type { OptionSchema } from "./schema";
import { logger, setDetailedLogs, LogLevel } from "../logging";
import { parseEnum, values } from "../models";

/**
 * Lazy evaluation helper for log levels.
 */
const getLogLevels = () => values(LogLevel).join(", ");
const defaultLogLevel = LogLevel.Info;
const defaultDetailedLogs = false;

/**
 * Common options shared across all modes.
 * These are merged into mode-specific schemas.
 */
export const commonOptionsSchema = {
    "log-level": {
        type: "string",
        description: "Logging verbosity",
        placeholder: "level",
        validValues: getLogLevels,
        default: LogLevel[defaultLogLevel],
    },
    "detailed-logs": {
        type: "boolean",
        description: "Show detailed logs with timestamp and level",
        default: defaultDetailedLogs,
    },
} as const satisfies OptionSchema;

/**
 * Type for common options.
 */
export type CommonOptions = {
    "log-level"?: string;
    "detailed-logs"?: boolean;
};


/**
 * Applies common options (log-level, detailed-logs) to the logger.
 * Call this at the start of each mode's execute function.
 */
export function applyCommonOptions(options: CommonOptions): void {
    const detailedLogs = options["detailed-logs"] ?? defaultDetailedLogs;
    setDetailedLogs(detailedLogs);

    const logLevelStr = options["log-level"] ?? LogLevel[defaultLogLevel];
    const logLevel = parseEnum(LogLevel, logLevelStr);
    if (logLevel !== undefined) {
        logger.settings.minLevel = logLevel;
    }
}
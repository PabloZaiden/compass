import { EventEmitter } from "events";
import { Logger as TsLogger } from "tslog";

/**
 * Log levels from least to most severe.
 */
export enum LogLevel {
  Silly = 0,
  Trace = 1,
  Debug = 2,
  Info = 3,
  Warn = 4,
  Error = 5,
  Fatal = 6,
}

/**
 * Event emitted when a log message is written.
 */
export interface LogEvent {
  message: string;
  level: LogLevel;
  timestamp: Date;
}

/**
 * Logger configuration options.
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Whether to use detailed format (with timestamp/level) */
  detailed?: boolean;
  /** Whether to route logs to TUI event emitter instead of stderr */
  tuiMode?: boolean;
}

/**
 * Logger class that wraps tslog and supports TUI mode.
 * Can be instantiated multiple times for different contexts.
 */
export class Logger {
  private readonly tsLogger: TsLogger<unknown>;
  private readonly eventEmitter = new EventEmitter();
  private tuiMode: boolean;
  private detailed: boolean;

  constructor(config: LoggerConfig = {}) {
    this.tuiMode = config.tuiMode ?? false;
    this.detailed = config.detailed ?? false;

    this.tsLogger = new TsLogger({
      type: "pretty",
      minLevel: config.minLevel ?? LogLevel.Info,
      overwrite: {
        transportFormatted: (
          logMetaMarkup: string,
          logArgs: unknown[],
          logErrors: string[],
          logMeta: unknown
        ) => {
          const baseLine = `${logMetaMarkup}${(logArgs as string[]).join(" ")}${logErrors.join("")}`;
          const simpleLine = `${(logArgs as string[]).join(" ")}${logErrors.join("")}`;
          const meta = logMeta as Record<string, unknown>;
          const levelFromMeta =
            typeof meta?.["logLevelId"] === "number"
              ? (meta["logLevelId"] as LogLevel)
              : LogLevel.Info;

          const output = this.detailed ? baseLine : simpleLine;

          if (this.tuiMode) {
            this.eventEmitter.emit("log", {
              message: output,
              level: levelFromMeta,
              timestamp: new Date(),
            } satisfies LogEvent);
          } else {
            process.stderr.write(output + "\n");
          }
        },
      },
    });
  }

  /**
   * Subscribe to log events (for TUI mode).
   */
  onLogEvent(listener: (event: LogEvent) => void): () => void {
    this.eventEmitter.on("log", listener);
    return () => this.eventEmitter.off("log", listener);
  }

  /**
   * Enable or disable TUI mode.
   */
  setTuiMode(enabled: boolean): void {
    this.tuiMode = enabled;
  }

  /**
   * Enable or disable detailed log format.
   */
  setDetailed(enabled: boolean): void {
    this.detailed = enabled;
  }

  // Logging methods
  silly(...args: unknown[]): void {
    this.tsLogger.silly(...args);
  }

  trace(...args: unknown[]): void {
    this.tsLogger.trace(...args);
  }

  debug(...args: unknown[]): void {
    this.tsLogger.debug(...args);
  }

  info(...args: unknown[]): void {
    this.tsLogger.info(...args);
  }

  warn(...args: unknown[]): void {
    this.tsLogger.warn(...args);
  }

  error(...args: unknown[]): void {
    this.tsLogger.error(...args);
  }

  fatal(...args: unknown[]): void {
    this.tsLogger.fatal(...args);
  }
}

/**
 * Create a new logger instance with the given configuration.
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  return new Logger(config);
}

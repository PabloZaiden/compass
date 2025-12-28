export enum LogLevel {
  Verbose = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
}

export class Logger {
  private static writers: Array<(text: string) => void> = [(text) => console.log(text)];
  private static _currentLogLevel: LogLevel = LogLevel.Verbose;

  static get currentLogLevel(): LogLevel {
    return this._currentLogLevel;
  }

  static set currentLogLevel(level: LogLevel) {
    this._currentLogLevel = level;
  }

  static setWriters(writers: Array<(text: string) => void>): void {
    this.writers = writers;
  }

  static log(message: string, level: LogLevel = LogLevel.Info, includeTimestamp: boolean = true): void;
  static log(message: string, obj: unknown, level: LogLevel, includeTimestamp: boolean): void;
  static log(
    message: string,
    objOrLevel?: unknown | LogLevel,
    levelOrIncludeTimestamp?: LogLevel | boolean,
    includeTimestamp: boolean = true
  ): void {
    let level: LogLevel;
    let finalMessage: string;

    if (typeof objOrLevel === "number" && objOrLevel in LogLevel) {
      // log(message, level, includeTimestamp)
      level = objOrLevel as LogLevel;
      finalMessage = message;
      if (typeof levelOrIncludeTimestamp === "boolean") {
        includeTimestamp = levelOrIncludeTimestamp;
      }
    } else if (objOrLevel !== undefined && typeof objOrLevel !== "number") {
      // log(message, obj, level, includeTimestamp)
      level = (levelOrIncludeTimestamp as LogLevel) ?? LogLevel.Info;
      finalMessage = `${message}\n${JSON.stringify(objOrLevel, null, 2)}`;
    } else {
      // Default case
      level = LogLevel.Info;
      finalMessage = message;
    }

    if (level < this._currentLogLevel) return;

    // Unescape the message (similar to C# Regex.Unescape)
    finalMessage = finalMessage
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\");

    if (includeTimestamp) {
      const now = new Date();
      const timestamp = now.toTimeString().split(" ")[0]; // HH:mm:ss format
      finalMessage = `[${timestamp}] ${finalMessage}`;
    }

    this.logToWriter(finalMessage);
  }

  private static logToWriter(text: string): void {
    for (const writer of this.writers) {
      writer(text);
    }
  }
}

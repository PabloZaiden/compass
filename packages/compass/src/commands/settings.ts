import { Command, ConfigValidationError, LogLevel, type AppContext, type OptionSchema, type OptionValues, type CommandResult } from "@pablozaiden/terminator";

const settingsOptions = {
  "log-level": {
    type: "string",
    description: "Minimum log level to emit",
    default: "info",
    enum: ["silly", "trace", "debug", "info", "warn", "error", "fatal"],
    label: "Log Level",
    order: 1,
  },
  "detailed-logs": {
    type: "boolean",
    description: "Include timestamp and level in log output",
    default: false,
    label: "Detailed Logs",
    order: 2,
  },
} as const satisfies OptionSchema;

type SettingsOptions = OptionValues<typeof settingsOptions>;

interface SettingsConfig {
  logLevel: LogLevel;
  detailedLogs: boolean;
}

const logLevelMap: Record<string, LogLevel> = {
  silly: LogLevel.Silly,
  trace: LogLevel.Trace,
  debug: LogLevel.Debug,
  info: LogLevel.Info,
  warn: LogLevel.Warn,
  error: LogLevel.Error,
  fatal: LogLevel.Fatal,
};

function parseLogLevel(value?: string): LogLevel {
  if (!value) return LogLevel.Info;
  const level = logLevelMap[value.toLowerCase()];
  if (level === undefined) {
    throw new ConfigValidationError(`Invalid log level: ${value}`, "log-level");
  }
  return level;
}

export class SettingsCommand extends Command<typeof settingsOptions, SettingsConfig> {
  readonly name = "settings";
  readonly description = "Configure logging level and detailed logs";
  readonly options = settingsOptions;

  override readonly actionLabel = "Save Settings";
  override readonly immediateExecution = false;

  override buildConfig(_ctx: AppContext, opts: SettingsOptions): SettingsConfig {
    const logLevel = parseLogLevel(opts["log-level"] as string | undefined);
    const detailedLogs = Boolean(opts["detailed-logs"]);

    return { logLevel, detailedLogs };
  }

  override async executeCli(ctx: AppContext, config: SettingsConfig): Promise<void> {
    this.applySettings(ctx, config);
    ctx.logger.info(`Logging set to ${LogLevel[config.logLevel]}${config.detailedLogs ? " with detailed format" : ""}`);
  }

  override async executeTui(ctx: AppContext, config: SettingsConfig): Promise<CommandResult> {
    this.applySettings(ctx, config);
    return {
      success: true,
      message: `Logging set to ${LogLevel[config.logLevel]}${config.detailedLogs ? " with detailed format" : ""}`,
    };
  }

  private applySettings(ctx: AppContext, config: SettingsConfig): void {
    ctx.logger.setMinLevel(config.logLevel);
    ctx.logger.setDetailed(config.detailedLogs);
  }
}

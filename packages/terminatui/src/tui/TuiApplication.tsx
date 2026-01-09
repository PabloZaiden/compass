import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { Application, type ApplicationConfig } from "../core/application.ts";
import type { AnyCommand } from "../core/command.ts";
import { TuiApp } from "./TuiApp.tsx";
import { Theme } from "./theme.ts";
import type { LogSource, LogEvent } from "./hooks/index.ts";
import { LogLevel as TuiLogLevel } from "./hooks/index.ts";
import { LogLevel as CoreLogLevel, type LogEvent as CoreLogEvent } from "../core/logger.ts";
import type { FieldConfig } from "./components/types.ts";
import { createSettingsCommand } from "../builtins/settings.ts";
import { loadPersistedParameters } from "./utils/parameterPersistence.ts";

/**
 * Custom field configuration for TUI forms.
 * Allows adding application-specific fields that aren't part of command options.
 */
export interface CustomField extends FieldConfig {
    /** Default value for the field */
    default?: unknown;
    /** Called when the field value changes */
    onChange?: (value: unknown, allValues: Record<string, unknown>) => void;
}

/**
 * Extended configuration for TUI-enabled applications.
 */
export interface TuiApplicationConfig extends ApplicationConfig {
    /** Enable interactive TUI mode */
    enableTui?: boolean;
    /** Log source for TUI log panel */
    logSource?: LogSource;
    /** Custom fields to add to the TUI form */
    customFields?: CustomField[];
}

/**
 * Application class with built-in TUI support.
 * 
 * Extends the base Application to provide automatic TUI rendering
 * when running interactively or with the --interactive flag.
 * 
 * @example
 * ```typescript
 * class MyApp extends TuiApplication {
 *   constructor() {
 *     super({
 *       name: "myapp",
 *       version: "1.0.0",
 *       commands: [new RunCommand(), new ConfigCommand()],
 *       enableTui: true,
 *     });
 *   }
 * }
 * 
 * await new MyApp().run(process.argv.slice(2));
 * ```
 */
export class TuiApplication extends Application {
    private readonly enableTui: boolean;
    private readonly logSource?: LogSource;
    private readonly customFields?: CustomField[];

    constructor(config: TuiApplicationConfig) {
        super(config);
        this.enableTui = config.enableTui ?? true;
        this.logSource = config.logSource;
        this.customFields = config.customFields;
    }

    /**
     * Run the application.
     * 
     * If no arguments are provided and TUI is enabled, launches the TUI.
     * Otherwise, runs in CLI mode.
     */
    override async run(argv: string[] = process.argv.slice(2)): Promise<void> {
        // Check for --interactive or -i flag
        const hasInteractiveFlag = argv.includes("--interactive") || argv.includes("-i");
        const filteredArgs = argv.filter((arg) => arg !== "--interactive" && arg !== "-i");

        // Launch TUI if:
        // 1. Explicit --interactive flag, or
        // 2. No args and TUI is enabled
        if (hasInteractiveFlag || (filteredArgs.length === 0 && this.enableTui)) {
            await this.runTui();
            return;
        }

        // Otherwise run CLI mode
        await super.run(filteredArgs);
    }

    /**
     * Launch the interactive TUI.
     */
    async runTui(): Promise<void> {
        // Get all commands that support TUI or have options
        const commands = this.getExecutableCommands();

        // Load and apply persisted settings (log-level, detailed-logs)
        this.loadPersistedSettings();

        // Enable TUI mode on the logger so logs go to the event emitter
        // instead of stderr (which would corrupt the TUI display)
        this.context.logger.setTuiMode(true);

        // Create a log source from the logger if one wasn't provided
        const logSource = this.logSource ?? this.createLogSourceFromLogger();

        const renderer = await createCliRenderer({
            useAlternateScreen: true,
            useConsole: false,
            exitOnCtrlC: true,
            backgroundColor: Theme.background,
            useMouse: true,
            enableMouseMovement: true,
            openConsoleOnError: false,
        });

        return new Promise<void>((resolve) => {
            const handleExit = () => {
                // Restore CLI mode on exit
                this.context.logger.setTuiMode(false);
                renderer.destroy();
                resolve();
            };

            const root = createRoot(renderer);
            root.render(
                <TuiApp
                    name={this.name}
                    displayName={this.displayName}
                    version={this.version}
                    commands={commands}
                    context={this.context}
                    logSource={logSource}
                    customFields={this.customFields}
                    onExit={handleExit}
                />
            );

            renderer.start();
        });
    }

    /**
     * Create a LogSource adapter from the application logger.
     */
    private createLogSourceFromLogger(): LogSource {
        const logger = this.context.logger;
        
        // Map core log levels to TUI log levels
        const mapLogLevel = (level: CoreLogLevel): TuiLogLevel => {
            switch (level) {
                case CoreLogLevel.Silly: return TuiLogLevel.Silly;
                case CoreLogLevel.Trace: return TuiLogLevel.Trace;
                case CoreLogLevel.Debug: return TuiLogLevel.Debug;
                case CoreLogLevel.Info: return TuiLogLevel.Info;
                case CoreLogLevel.Warn: return TuiLogLevel.Warn;
                case CoreLogLevel.Error: return TuiLogLevel.Error;
                case CoreLogLevel.Fatal: return TuiLogLevel.Fatal;
                default: return TuiLogLevel.Info;
            }
        };

        return {
            subscribe: (callback: (event: LogEvent) => void) => {
                return logger.onLogEvent((coreEvent: CoreLogEvent) => {
                    callback({
                        level: mapLogLevel(coreEvent.level),
                        message: coreEvent.message,
                    });
                });
            },
        };
    }

    /**
     * Load persisted settings and apply them to the logger.
     * Settings are saved when the user uses the Settings command.
     */
    private loadPersistedSettings(): void {
        try {
            const settings = loadPersistedParameters(this.name, "settings");
            
            // Apply log-level if set
            if (settings["log-level"]) {
                const levelStr = String(settings["log-level"]).toLowerCase();
                const level = Object.entries(CoreLogLevel).find(
                    ([key, val]) => typeof val === "number" && key.toLowerCase() === levelStr
                )?.[1] as CoreLogLevel | undefined;
                if (level !== undefined) {
                    this.context.logger.setMinLevel(level);
                }
            }
            
            // Apply detailed-logs if set
            if (settings["detailed-logs"] !== undefined) {
                this.context.logger.setDetailed(Boolean(settings["detailed-logs"]));
            }
        } catch {
            // Silently ignore errors loading settings
        }
    }

    /**
     * Get commands that can be used in TUI.
     * Filters out internal commands like version/help, and adds built-in settings.
     */
    private getExecutableCommands(): AnyCommand[] {
        const userCommands = this.registry
            .list()
            .filter((cmd) => {
                // Exclude version and help from main menu
                if (cmd.name === "version" || cmd.name === "help") {
                    return false;
                }
                // Exclude settings if already defined by user (they shouldn't)
                if (cmd.name === "settings") {
                    return false;
                }
                // Include commands that have options or execute methods
                return true;
            });

        // Add built-in settings command at the end
        return [...userCommands, createSettingsCommand()];
    }
}

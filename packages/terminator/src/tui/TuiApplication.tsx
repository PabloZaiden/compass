import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { Application, type ApplicationConfig } from "../core/application.ts";
import type { Command } from "../core/command.ts";
import { TuiApp } from "./TuiApp.tsx";
import { Theme } from "./theme.ts";
import type { LogSource } from "./hooks/index.ts";
import type { FieldConfig } from "./components/types.ts";

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
                renderer.destroy();
                resolve();
            };

            const root = createRoot(renderer);
            root.render(
                <TuiApp
                    name={this.name}
                    version={this.version}
                    commands={commands}
                    context={this.context}
                    logSource={this.logSource}
                    customFields={this.customFields}
                    onExit={handleExit}
                />
            );

            renderer.start();
        });
    }

    /**
     * Get commands that can be used in TUI.
     * Filters out internal commands like version/help.
     */
    private getExecutableCommands(): Command[] {
        return this.registry
            .list()
            .filter((cmd) => {
                // Exclude version and help from main menu
                if (cmd.name === "version" || cmd.name === "help") {
                    return false;
                }
                // Include commands that have options or execute methods
                return true;
            });
    }
}

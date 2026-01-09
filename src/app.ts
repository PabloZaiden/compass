import { TuiApplication } from "@pablozaiden/terminatui";
import { RunCommand, CheckCommand, GenerateCommand } from "./commands/index.ts";
import pkg from "../package.json";

/**
 * CompassApp - Main application class for Compass.
 * 
 * Extends the Terminatui TuiApplication class with Compass-specific
 * commands and configuration. TuiApplication provides built-in TUI
 * support that auto-generates UI from command definitions.
 * 
 * The SettingsCommand (log level, detailed logs) is automatically
 * provided by the framework.
 */
export class CompassApp extends TuiApplication {
  constructor() {
    super({
      name: "compass",
      displayName: "🧭 Compass",
      version: pkg.version,
      commitHash: pkg.config?.commitHash,
      commands: [
        new RunCommand(),
        new CheckCommand(),
        new GenerateCommand(),
        // SettingsCommand is automatically added by TuiApplication
      ],
      // Enable built-in TUI (default when no args)
      enableTui: true,
      logger: {
        detailed: false,
      },
    });

    // Set up lifecycle hooks
    this.setHooks({
      onError: async (ctx, error) => {
        ctx.logger.error(`Error: ${error.message}`);
        process.exitCode = 1;
      },
    });
  }
}

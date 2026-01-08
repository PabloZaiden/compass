import { TuiApplication } from "@pablozaiden/terminator";
import { RunCommand, CheckCommand, GenerateCommand, SettingsCommand } from "./commands/index.ts";
import pkg from "../package.json";

/**
 * CompassApp - Main application class for Compass.
 * 
 * Extends the Terminator TuiApplication class with Compass-specific
 * commands and configuration. TuiApplication provides built-in TUI
 * support that auto-generates UI from command definitions.
 */
export class CompassApp extends TuiApplication {
  constructor() {
    super({
      name: "compass",
      version: pkg.version,
      commitHash: pkg.config?.commitHash,
      commands: [
        new RunCommand(),
        new CheckCommand(),
        new GenerateCommand(),
        new SettingsCommand(),
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

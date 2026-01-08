import { Application } from "@pablozaiden/terminator";
import { RunCommand, CheckCommand, GenerateCommand, InteractiveCommand } from "./commands/index.ts";
import { getVersion } from "./version/index.ts";

/**
 * CompassApp - Main application class for Compass.
 * 
 * Extends the Terminator Application class with Compass-specific
 * commands and configuration.
 */
export class CompassApp extends Application {
  constructor() {
    super({
      name: "compass",
      version: getVersion(),
      commands: [
        new RunCommand(),
        new CheckCommand(),
        new GenerateCommand(),
        new InteractiveCommand(),
      ],
      defaultCommand: "interactive",
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

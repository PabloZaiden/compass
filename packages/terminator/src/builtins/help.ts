import { Command, type AnyCommand } from "../core/command.ts";
import type { AppContext } from "../core/context.ts";
import { generateCommandHelp, generateAppHelp } from "../core/help.ts";
import type { OptionSchema } from "../types/command.ts";

/**
 * Built-in help command that is auto-injected as a subcommand into all commands.
 * When invoked, it displays help for the parent command.
 * 
 * This command is created internally by the Application class and should not
 * be instantiated directly.
 */
export class HelpCommand extends Command<OptionSchema> {
  readonly name = "help";
  readonly description = "Show help for this command";
  readonly options = {} as const;

  private parentCommand: AnyCommand | null = null;
  private allCommands: AnyCommand[] = [];
  private appName: string;
  private appVersion: string;

  constructor(config: {
    parentCommand?: AnyCommand;
    allCommands?: AnyCommand[];
    appName: string;
    appVersion: string;
  }) {
    super();
    this.parentCommand = config.parentCommand ?? null;
    this.allCommands = config.allCommands ?? [];
    this.appName = config.appName;
    this.appVersion = config.appVersion;
  }

  override async execute(_ctx: AppContext): Promise<void> {
    let helpText: string;

    if (this.parentCommand) {
      // Show help for the parent command
      helpText = generateCommandHelp(this.parentCommand, {
        appName: this.appName,
        version: this.appVersion,
      });
    } else {
      // Show help for the entire application
      helpText = generateAppHelp(this.allCommands, {
        appName: this.appName,
        version: this.appVersion,
      });
    }

    console.log(helpText);
  }
}

/**
 * Create a help command for a specific parent command.
 */
export function createHelpCommandForParent(
  parentCommand: AnyCommand,
  appName: string,
  appVersion: string
): HelpCommand {
  return new HelpCommand({
    parentCommand,
    appName,
    appVersion,
  });
}

/**
 * Create a help command for the application root.
 */
export function createRootHelpCommand(
  allCommands: AnyCommand[],
  appName: string,
  appVersion: string
): HelpCommand {
  return new HelpCommand({
    allCommands,
    appName,
    appVersion,
  });
}

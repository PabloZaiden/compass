import { defineCommand, type Command } from "../types/command.ts";
import { generateHelp } from "../cli/help.ts";

interface HelpCommandOptions {
  getCommands: () => Command[];
  appName?: string;
  version?: string;
}

/**
 * Create a help command
 */
export function createHelpCommand(options: HelpCommandOptions) {
  const { getCommands, appName = "cli", version } = options;

  return defineCommand({
    name: "help",
    description: "Show help information",
    aliases: ["--help", "-h"],
    hidden: true,
    options: {
      command: {
        type: "string" as const,
        description: "Command to show help for",
      },
    },
    execute: (ctx) => {
      const commands = getCommands();
      const commandName = ctx.options["command"];

      if (commandName && typeof commandName === "string") {
        const cmd = commands.find((c) => c.name === commandName);
        if (cmd) {
          console.log(generateHelp(cmd, { appName, version }));
          return;
        }
      }

      // Show root help
      const rootCommand = defineCommand({
        name: appName,
        description: `${appName} CLI`,
        subcommands: Object.fromEntries(commands.map((c) => [c.name, c])),
        execute: () => {},
      });

      console.log(generateHelp(rootCommand, { appName, version }));
    },
  });
}

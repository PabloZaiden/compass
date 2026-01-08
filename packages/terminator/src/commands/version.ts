import { defineCommand } from "../types/command.ts";

/**
 * Create a version command
 */
export function createVersionCommand(version: string) {
  return defineCommand({
    name: "version",
    description: "Show version information",
    aliases: ["--version", "-v"],
    execute: () => {
      console.log(version);
    },
  });
}

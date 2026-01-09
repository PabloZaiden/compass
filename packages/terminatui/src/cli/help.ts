import type { Command, OptionDef } from "../types/command.ts";
import { colors } from "./output/colors.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCommand = Command<any, any>;

/**
 * Format usage line for a command
 */
export function formatUsage(
  command: AnyCommand,
  appName = "cli"
): string {
  const parts = [appName, command.name];

  if (command.subcommands && Object.keys(command.subcommands).length > 0) {
    parts.push("[command]");
  }

  if (command.options && Object.keys(command.options).length > 0) {
    parts.push("[options]");
  }

  return parts.join(" ");
}

/**
 * Format subcommands list
 */
export function formatCommands(command: AnyCommand): string {
  if (!command.subcommands) return "";

  const entries = Object.entries(command.subcommands)
    .filter(([, cmd]) => !cmd.hidden)
    .map(([name, cmd]) => {
      const aliases = cmd.aliases?.length ? ` (${cmd.aliases.join(", ")})` : "";
      return `  ${colors.cyan(name)}${aliases}  ${cmd.description}`;
    });

  if (entries.length === 0) return "";

  return ["Commands:", ...entries].join("\n");
}

/**
 * Format options list
 */
export function formatOptions(command: AnyCommand): string {
  if (!command.options) return "";

  const entries = Object.entries(command.options).map(([name, defUntyped]) => {
    const def = defUntyped as OptionDef;
    const alias = def.alias ? `-${def.alias}, ` : "    ";
    const flag = `${alias}--${name}`;
    const required = def.required ? colors.red("*") : "";
    const defaultVal = def.default !== undefined ? ` (default: ${def.default})` : "";
    const enumVals = def.enum ? ` [${def.enum.join("|")}]` : "";

    return `  ${colors.yellow(flag)}${required}  ${def.description}${enumVals}${defaultVal}`;
  });

  if (entries.length === 0) return "";

  return ["Options:", ...entries].join("\n");
}

/**
 * Format examples list
 */
export function formatExamples(command: AnyCommand): string {
  if (!command.examples?.length) return "";

  const entries = command.examples.map(
    (ex) => `  ${colors.dim("$")} ${ex.command}\n    ${colors.dim(ex.description)}`
  );

  return ["Examples:", ...entries].join("\n");
}

/**
 * Format global options (log-level, detailed-logs)
 */
export function formatGlobalOptions(): string {
  const entries = [
    `  ${colors.yellow("--log-level")} <level>  Set log level [silly|trace|debug|info|warn|error|fatal]`,
    `  ${colors.yellow("--detailed-logs")}      Enable detailed log output`,
    `  ${colors.yellow("--no-detailed-logs")}   Disable detailed log output`,
  ];

  return ["Global Options:", ...entries].join("\n");
}

/**
 * Get command summary line
 */
export function getCommandSummary(command: AnyCommand): string {
  const aliases = command.aliases?.length ? ` (${command.aliases.join(", ")})` : "";
  return `${command.name}${aliases}: ${command.description}`;
}

/**
 * Generate full help text for a command
 */
export function generateHelp(
  command: AnyCommand,
  options: { appName?: string; version?: string } = {}
): string {
  const { appName = "cli", version } = options;
  const sections: string[] = [];

  // Header
  if (version) {
    sections.push(`${colors.bold(appName)} ${colors.dim(`v${version}`)}`);
  }

  // Description
  sections.push(command.description);

  // Usage
  sections.push(`\n${colors.bold("Usage:")}\n  ${formatUsage(command, appName)}`);

  // Commands
  const commandsSection = formatCommands(command);
  if (commandsSection) {
    sections.push(`\n${commandsSection}`);
  }

  // Options
  const optionsSection = formatOptions(command);
  if (optionsSection) {
    sections.push(`\n${optionsSection}`);
  }

  // Examples
  const examplesSection = formatExamples(command);
  if (examplesSection) {
    sections.push(`\n${examplesSection}`);
  }

  return sections.join("\n");
}

/**
 * Generate help text for a specific command (includes global options)
 */
export function generateCommandHelp(
  command: AnyCommand,
  appName = "cli"
): string {
  const sections: string[] = [];

  // Description
  sections.push(command.description);

  // Usage
  sections.push(`\n${colors.bold("Usage:")}\n  ${formatUsage(command, appName)}`);

  // Options
  const optionsSection = formatOptions(command);
  if (optionsSection) {
    sections.push(`\n${optionsSection}`);
  }

  // Global Options
  sections.push(`\n${formatGlobalOptions()}`);

  // Examples
  const examplesSection = formatExamples(command);
  if (examplesSection) {
    sections.push(`\n${examplesSection}`);
  }

  return sections.join("\n");
}

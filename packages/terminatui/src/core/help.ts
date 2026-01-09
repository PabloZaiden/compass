import { type AnyCommand } from "./command.ts";
import type { OptionDef } from "../types/command.ts";
import { colors } from "../cli/output/colors.ts";

/**
 * Options for generating help text.
 */
export interface HelpOptions {
  /** Application name (used in usage line) */
  appName?: string;
  /** Application version (shown in header) */
  version?: string;
  /** Command path leading to this command (e.g., ["app", "remote", "add"]) */
  commandPath?: string[];
}

/**
 * Format the usage line for a command.
 */
export function formatUsage(command: AnyCommand, options: HelpOptions = {}): string {
  const { appName = "cli", commandPath = [] } = options;

  const parts = [appName, ...commandPath];

  // Add command name if not already in path
  if (commandPath.length === 0 || commandPath[commandPath.length - 1] !== command.name) {
    parts.push(command.name);
  }

  if (command.hasSubCommands()) {
    parts.push("[command]");
  }

  if (command.options && Object.keys(command.options).length > 0) {
    parts.push("[options]");
  }

  return parts.join(" ");
}

/**
 * Format subcommands list.
 */
export function formatSubCommands(command: AnyCommand): string {
  if (!command.subCommands?.length) return "";

  const entries = command.subCommands.map((cmd) => {
    const modes: string[] = [];
    if (cmd.supportsCli()) modes.push("cli");
    if (cmd.supportsTui()) modes.push("tui");
    const modeHint = modes.length ? colors.dim(` [${modes.join("/")}]`) : "";

    return `  ${colors.cyan(cmd.name)}${modeHint}  ${cmd.description}`;
  });

  if (entries.length === 0) return "";

  return [colors.bold("Commands:"), ...entries].join("\n");
}

/**
 * Format options list.
 */
export function formatOptions(command: AnyCommand): string {
  if (!command.options || Object.keys(command.options).length === 0) return "";

  const entries = Object.entries(command.options).map(([name, defUntyped]) => {
    const def = defUntyped as OptionDef;
    const alias = def.alias ? `-${def.alias}, ` : "    ";
    const flag = `${alias}--${name}`;
    const required = def.required ? colors.red(" (required)") : "";
    const defaultVal =
      def.default !== undefined ? colors.dim(` [default: ${def.default}]`) : "";
    const enumVals = def.enum ? colors.dim(` [${def.enum.join(" | ")}]`) : "";
    const typeHint = colors.dim(` <${def.type}>`);

    return `  ${colors.yellow(flag)}${typeHint}${required}\n      ${def.description}${enumVals}${defaultVal}`;
  });

  return [colors.bold("Options:"), ...entries].join("\n");
}

/**
 * Format global options section (available on all commands).
 */
export function formatGlobalOptions(): string {
  const entries = [
    `  ${colors.yellow("    --log-level")}${colors.dim(" <string>")}\n      Set minimum log level${colors.dim(" [silly | trace | debug | info | warn | error | fatal]")}`,
    `  ${colors.yellow("    --detailed-logs")}\n      Include timestamp and level prefix in log output`,
    `  ${colors.yellow("    --no-detailed-logs")}\n      Disable detailed log format`,
  ];

  return [colors.bold("Global Options:"), ...entries].join("\n");
}

/**
 * Format examples list.
 */
export function formatExamples(command: AnyCommand): string {
  if (!command.examples?.length) return "";

  const entries = command.examples.map(
    (ex) => `  ${colors.dim("$")} ${ex.command}\n      ${colors.dim(ex.description)}`
  );

  return [colors.bold("Examples:"), ...entries].join("\n");
}

/**
 * Generate full help text for a command.
 * 
 * @param command The command to generate help for
 * @param options Help generation options
 * @returns Formatted help text
 */
export function generateCommandHelp(command: AnyCommand, options: HelpOptions = {}): string {
  const { appName = "cli", version } = options;
  const sections: string[] = [];

  // Header with version
  if (version) {
    sections.push(`${colors.bold(appName)} ${colors.dim(`v${version}`)}\n`);
  }

  // Description
  sections.push(command.description);

  // Long description if available
  if (command.longDescription) {
    sections.push(`\n${command.longDescription}`);
  }

  // Execution modes
  const modes: string[] = [];
  if (command.supportsCli()) modes.push("CLI");
  if (command.supportsTui()) modes.push("TUI");
  if (modes.length > 0) {
    sections.push(`\n${colors.dim(`Supports: ${modes.join(", ")}`)}`);
  }

  // Usage
  sections.push(`\n${colors.bold("Usage:")}\n  ${formatUsage(command, options)}`);

  // Subcommands
  const subCommandsSection = formatSubCommands(command);
  if (subCommandsSection) {
    sections.push(`\n${subCommandsSection}`);
  }

  // Options
  const optionsSection = formatOptions(command);
  if (optionsSection) {
    sections.push(`\n${optionsSection}`);
  }

  // Global options (available on all commands)
  sections.push(`\n${formatGlobalOptions()}`);

  // Examples
  const examplesSection = formatExamples(command);
  if (examplesSection) {
    sections.push(`\n${examplesSection}`);
  }

  // Help hint
  if (command.hasSubCommands()) {
    sections.push(
      `\n${colors.dim(`Run '${appName} ${command.name} <command> help' for more information on a command.`)}`
    );
  }

  return sections.join("\n");
}

/**
 * Generate help text for the application root (list of all commands).
 * 
 * @param commands List of top-level commands
 * @param options Help generation options
 * @returns Formatted help text
 */
export function generateAppHelp(commands: AnyCommand[], options: HelpOptions = {}): string {
  const { appName = "cli", version } = options;
  const sections: string[] = [];

  // Header
  if (version) {
    sections.push(`${colors.bold(appName)} ${colors.dim(`v${version}`)}\n`);
  }

  // Usage
  sections.push(`${colors.bold("Usage:")}\n  ${appName} [command] [options]\n`);

  // Commands
  if (commands.length > 0) {
    const entries = commands.map((cmd) => {
      const modes: string[] = [];
      if (cmd.supportsCli()) modes.push("cli");
      if (cmd.supportsTui()) modes.push("tui");
      const modeHint = modes.length ? colors.dim(` [${modes.join("/")}]`) : "";

      return `  ${colors.cyan(cmd.name)}${modeHint}  ${cmd.description}`;
    });

    sections.push([colors.bold("Commands:"), ...entries].join("\n"));
  }

  // Help hint
  sections.push(
    `\n${colors.dim(`Run '${appName} <command> help' for more information on a command.`)}`
  );

  return sections.join("\n");
}

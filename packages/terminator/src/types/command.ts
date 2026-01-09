/**
 * Option definition for command-line arguments
 */
export interface OptionDef {
  type: "string" | "number" | "boolean" | "array";
  description: string;
  alias?: string;
  default?: unknown;
  required?: boolean;
  env?: string;
  enum?: readonly string[];
  min?: number;
  max?: number;

  // TUI-specific properties
  /** Display label in TUI form (defaults to key name) */
  label?: string;
  /** Display order in TUI form (lower = first) */
  order?: number;
  /** Group name for organizing fields in TUI */
  group?: string;
  /** Placeholder text for input fields */
  placeholder?: string;
  /** Hide this field from TUI (still available in CLI) */
  tuiHidden?: boolean;
}

/**
 * Schema defining all options for a command
 */
export type OptionSchema = Record<string, OptionDef>;

/**
 * Inferred option values from a schema
 */
export type OptionValues<T extends OptionSchema> = {
  [K in keyof T]: T[K]["type"] extends "string" ? string
  : T[K]["type"] extends "number" ? number
  : T[K]["type"] extends "boolean" ? boolean
  : T[K]["type"] extends "array" ? string[]
  : unknown;
};

/**
 * Context passed to command executors
 */
export interface CommandContext<T extends OptionSchema = OptionSchema> {
  options: OptionValues<T>;
  args: string[];
  commandPath: string[];
}

/**
 * Command executor function
 */
export type CommandExecutor<T extends OptionSchema = OptionSchema> = (
  ctx: CommandContext<T>
) => void | Promise<void>;

/**
 * Command definition
 */
export interface Command<
  T extends OptionSchema = OptionSchema,
  R = void,
> {
  name: string;
  description: string;
  aliases?: string[];
  hidden?: boolean;
  options?: T;
  subcommands?: Record<string, Command>;
  examples?: Array<{ command: string; description: string }>;
  execute: (ctx: CommandContext<T>) => R | Promise<R>;
  beforeExecute?: (ctx: CommandContext<T>) => void | Promise<void>;
  afterExecute?: (ctx: CommandContext<T>) => void | Promise<void>;
}

/**
 * TUI command with a render function
 */
export interface TuiCommand<T extends OptionSchema = OptionSchema>
  extends Omit<Command<T>, "execute"> {
  render: (ctx: CommandContext<T>) => React.ReactNode;
}

/**
 * Define a CLI command
 */
export function defineCommand<T extends OptionSchema = OptionSchema>(
  config: Command<T>
): Command<T> {
  return config;
}

/**
 * Define a TUI command
 */
export function defineTuiCommand<T extends OptionSchema = OptionSchema>(
  config: TuiCommand<T>
): TuiCommand<T> {
  return config;
}

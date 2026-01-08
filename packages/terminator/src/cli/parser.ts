import type { Command, OptionSchema, OptionValues } from "../types/command.ts";
import { parseArgs, type ParseArgsConfig } from "util";

/**
 * Result of parsing CLI arguments
 */
export interface ParseResult<T extends OptionSchema = OptionSchema> {
  command: Command<T> | null;
  commandPath: string[];
  options: OptionValues<T>;
  args: string[];
  showHelp: boolean;
  error?: ParseError;
}

/**
 * Error during parsing
 */
export interface ParseError {
  type: "unknown_command" | "invalid_option" | "missing_required" | "validation";
  message: string;
  field?: string;
}

/**
 * Extract command chain from args (commands before flags)
 */
export function extractCommandChain(args: string[]): {
  commands: string[];
  remaining: string[];
} {
  const commands: string[] = [];
  let i = 0;

  for (; i < args.length; i++) {
    const arg = args[i];
    if (arg?.startsWith("-")) {
      break;
    }
    if (arg) {
      commands.push(arg);
    }
  }

  return {
    commands,
    remaining: args.slice(i),
  };
}

/**
 * Convert option schema to parseArgs config
 */
export function schemaToParseArgsOptions(schema: OptionSchema): {
  options: ParseArgsConfig["options"];
} {
  const options: NonNullable<ParseArgsConfig["options"]> = {};

  for (const [name, def] of Object.entries(schema)) {
    const parseArgsType = def.type === "boolean" ? "boolean" : "string";
    
    const opt: NonNullable<ParseArgsConfig["options"]>[string] = {
      type: parseArgsType,
      multiple: def.type === "array",
    };
    
    // Only include short if alias is defined (parseArgs doesn't like undefined)
    if (def.alias) {
      opt.short = def.alias;
    }
    
    // Only include default if defined
    // For non-boolean types, parseArgs expects string defaults
    if (def.default !== undefined) {
      if (parseArgsType === "string" && typeof def.default !== "string") {
        opt.default = String(def.default);
      } else {
        opt.default = def.default as string | boolean | string[] | boolean[];
      }
    }
    
    options[name] = opt;
  }

  return { options };
}

/**
 * Parse and coerce option values
 */
export function parseOptionValues<T extends OptionSchema>(
  schema: T,
  values: Record<string, unknown>
): OptionValues<T> {
  const result: Record<string, unknown> = {};

  for (const [name, def] of Object.entries(schema)) {
    let value = values[name];

    // Check environment variable
    if (value === undefined && def.env) {
      value = process.env[def.env];
    }

    // Apply default
    if (value === undefined && def.default !== undefined) {
      value = def.default;
    }

    // Coerce type
    if (value !== undefined) {
      if (def.type === "number" && typeof value === "string") {
        value = Number(value);
      } else if (def.type === "boolean" && typeof value === "string") {
        value = value === "true" || value === "1";
      }

      // Validate enum
      if (def.enum && !def.enum.includes(String(value))) {
        throw new Error(`Invalid value "${value}" for option "${name}". Must be one of: ${def.enum.join(", ")}`);
      }
    }

    result[name] = value;
  }

  return result as OptionValues<T>;
}

/**
 * Validate option values
 */
export function validateOptions<T extends OptionSchema>(
  schema: T,
  values: OptionValues<T>
): ParseError[] {
  const errors: ParseError[] = [];

  for (const [name, def] of Object.entries(schema)) {
    const value = values[name as keyof typeof values];

    if (def.required && value === undefined) {
      errors.push({
        type: "missing_required",
        message: `Missing required option: ${name}`,
        field: name,
      });
    }

    if (def.type === "number" && typeof value === "number") {
      if (def.min !== undefined && value < def.min) {
        errors.push({
          type: "validation",
          message: `Option "${name}" must be at least ${def.min}`,
          field: name,
        });
      }
      if (def.max !== undefined && value > def.max) {
        errors.push({
          type: "validation",
          message: `Option "${name}" must be at most ${def.max}`,
          field: name,
        });
      }
    }
  }

  return errors;
}

interface ParseCliArgsOptions<T extends OptionSchema> {
  args: string[];
  commands: Record<string, Command<T>>;
  defaultCommand?: string;
}

/**
 * Parse CLI arguments into a result
 */
export function parseCliArgs<T extends OptionSchema>(
  options: ParseCliArgsOptions<T>
): ParseResult<T> {
  const { args, commands, defaultCommand } = options;
  const { commands: commandChain, remaining } = extractCommandChain(args);

  // Check for help flag
  const showHelp = remaining.includes("--help") || remaining.includes("-h");

  // Find command
  const commandName = commandChain[0] ?? defaultCommand;
  if (!commandName) {
    return {
      command: null,
      commandPath: [],
      options: {} as OptionValues<T>,
      args: remaining,
      showHelp,
    };
  }

  const command = commands[commandName];
  if (!command) {
    return {
      command: null,
      commandPath: commandChain,
      options: {} as OptionValues<T>,
      args: remaining,
      showHelp,
      error: {
        type: "unknown_command",
        message: `Unknown command: ${commandName}`,
      },
    };
  }

  // Parse options
  const schema = command.options ?? ({} as T);
  const parseArgsConfig = schemaToParseArgsOptions(schema);

  let parsedValues: Record<string, unknown> = {};
  try {
    const { values } = parseArgs({
      args: remaining,
      ...parseArgsConfig,
      allowPositionals: false,
    });
    parsedValues = values;
  } catch {
    // Ignore parse errors for now
  }

  const optionValues = parseOptionValues(schema, parsedValues);

  return {
    command,
    commandPath: commandChain,
    options: optionValues,
    args: remaining,
    showHelp,
  };
}

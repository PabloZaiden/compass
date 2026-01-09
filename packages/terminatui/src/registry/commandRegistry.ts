import type { Command, OptionSchema } from "../types/command.ts";

/**
 * Command registry for managing commands
 */
export interface CommandRegistry<T extends OptionSchema = OptionSchema> {
  register(command: Command<T>): void;
  get(name: string): Command<T> | undefined;
  resolve(nameOrAlias: string): Command<T> | undefined;
  has(nameOrAlias: string): boolean;
  list(): Command<T>[];
  getNames(): string[];
  getCommandMap(): Record<string, Command<T>>;
}

/**
 * Create a command registry
 */
export function createCommandRegistry<
  T extends OptionSchema = OptionSchema,
>(): CommandRegistry<T> {
  const commands = new Map<string, Command<T>>();
  const aliases = new Map<string, string>();

  return {
    register(command: Command<T>): void {
      if (commands.has(command.name)) {
        throw new Error(`Command "${command.name}" is already registered`);
      }

      commands.set(command.name, command);

      if (command.aliases) {
        for (const alias of command.aliases) {
          if (aliases.has(alias) || commands.has(alias)) {
            throw new Error(`Alias "${alias}" conflicts with existing command or alias`);
          }
          aliases.set(alias, command.name);
        }
      }
    },

    get(name: string): Command<T> | undefined {
      return commands.get(name);
    },

    resolve(nameOrAlias: string): Command<T> | undefined {
      // Try direct name first
      const cmd = commands.get(nameOrAlias);
      if (cmd) return cmd;

      // Try alias
      const resolvedName = aliases.get(nameOrAlias);
      if (resolvedName) {
        return commands.get(resolvedName);
      }

      return undefined;
    },

    has(nameOrAlias: string): boolean {
      return commands.has(nameOrAlias) || aliases.has(nameOrAlias);
    },

    list(): Command<T>[] {
      return Array.from(commands.values());
    },

    getNames(): string[] {
      return Array.from(commands.keys());
    },

    getCommandMap(): Record<string, Command<T>> {
      return Object.fromEntries(commands);
    },
  };
}

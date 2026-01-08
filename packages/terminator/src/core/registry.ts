import { type AnyCommand } from "./command.ts";

/**
 * Registry for managing commands.
 * Provides registration, lookup, and resolution of command paths.
 */
export class CommandRegistry {
  private readonly commands = new Map<string, AnyCommand>();

  /**
   * Register a command.
   * @param command The command to register
   * @throws If a command with the same name is already registered
   */
  register(command: AnyCommand): void {
    command.validate();

    if (this.commands.has(command.name)) {
      throw new Error(`Command '${command.name}' is already registered`);
    }

    this.commands.set(command.name, command);
  }

  /**
   * Register multiple commands.
   * @param commands Array of commands to register
   */
  registerAll(commands: AnyCommand[]): void {
    for (const command of commands) {
      this.register(command);
    }
  }

  /**
   * Get a command by name.
   * @param name Command name
   * @returns The command or undefined if not found
   */
  get(name: string): AnyCommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Check if a command is registered.
   * @param name Command name
   */
  has(name: string): boolean {
    return this.commands.has(name);
  }

  /**
   * Get all registered commands.
   * @returns Array of all commands
   */
  list(): AnyCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get command names.
   * @returns Array of command names
   */
  names(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Resolve a command path to a command.
   * Supports nested subcommands like ["run", "check", "help"].
   * 
   * @param path Array of command names forming the path
   * @returns Object with resolved command, remaining path, and full path
   */
  resolve(path: string[]): ResolveResult {
    if (path.length === 0) {
      return { command: undefined, remainingPath: [], resolvedPath: [] };
    }

    const [first, ...rest] = path;
    if (!first) {
      return { command: undefined, remainingPath: path, resolvedPath: [] };
    }

    const command = this.get(first);

    if (!command) {
      return { command: undefined, remainingPath: path, resolvedPath: [] };
    }

    // Resolve nested subcommands
    let current = command;
    const resolvedPath: string[] = [first];
    let remainingPath: string[] = rest;

    while (remainingPath.length > 0) {
      const nextName = remainingPath[0];
      if (!nextName) break;

      const subCommand = current.getSubCommand(nextName);

      if (!subCommand) {
        break;
      }

      current = subCommand;
      resolvedPath.push(nextName);
      remainingPath = remainingPath.slice(1);
    }

    return { command: current, remainingPath, resolvedPath };
  }

  /**
   * Clear all registered commands.
   * Useful for testing.
   */
  clear(): void {
    this.commands.clear();
  }

  /**
   * Get the number of registered commands.
   */
  get size(): number {
    return this.commands.size;
  }
}

/**
 * Result of resolving a command path.
 */
export interface ResolveResult {
  /** The resolved command, or undefined if not found */
  command: AnyCommand | undefined;
  /** Path elements that couldn't be resolved (remaining after last matched command) */
  remainingPath: string[];
  /** Path elements that were successfully resolved */
  resolvedPath: string[];
}

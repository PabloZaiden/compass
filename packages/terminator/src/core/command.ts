import type { AppContext } from "./context.ts";
import type { OptionSchema, OptionValues } from "../types/command.ts";

/**
 * Example for command help documentation.
 */
export interface CommandExample {
  /** The command invocation */
  command: string;
  /** Description of what the example does */
  description: string;
}

/**
 * Abstract base class for commands.
 * 
 * Extend this class to create commands that can run in CLI mode, TUI mode, or both.
 * The framework enforces that at least one execute method is implemented.
 * 
 * @example
 * ```typescript
 * class RunCommand extends Command<typeof runOptions> {
 *   name = "run";
 *   description = "Run the application";
 *   options = runOptions;
 * 
 *   async executeCli(ctx: AppContext, opts: OptionValues<typeof runOptions>) {
 *     // CLI implementation
 *   }
 * }
 * ```
 */
export abstract class Command<TOptions extends OptionSchema = OptionSchema> {
  /** Command name used in CLI */
  abstract readonly name: string;

  /** Short description shown in help */
  abstract readonly description: string;

  /** Option schema defining accepted arguments */
  abstract readonly options: TOptions;

  /** Nested subcommands */
  subCommands?: Command[];

  /** Example usages for help text */
  examples?: CommandExample[];

  /** Extended description for detailed help */
  longDescription?: string;

  /**
   * Execute the command in CLI mode.
   * Implement this for commands that support command-line execution.
   */
  executeCli?(ctx: AppContext, opts: OptionValues<TOptions>): Promise<void> | void;

  /**
   * Execute the command in TUI mode.
   * Implement this for commands that support interactive terminal UI.
   */
  executeTui?(ctx: AppContext, opts: OptionValues<TOptions>): Promise<void> | void;

  /**
   * Called before execute. Use for validation, resource acquisition, etc.
   * If this throws, execute will not be called but afterExecute will still run.
   */
  beforeExecute?(ctx: AppContext, opts: OptionValues<TOptions>): Promise<void> | void;

  /**
   * Called after execute, even if execute threw an error.
   * Use for cleanup, logging, etc.
   * @param error The error thrown by beforeExecute or execute, if any
   */
  afterExecute?(
    ctx: AppContext,
    opts: OptionValues<TOptions>,
    error?: Error
  ): Promise<void> | void;

  /**
   * Check if this command supports CLI mode.
   */
  supportsCli(): boolean {
    return typeof this.executeCli === "function";
  }

  /**
   * Check if this command supports TUI mode.
   */
  supportsTui(): boolean {
    return typeof this.executeTui === "function";
  }

  /**
   * Validate that the command has at least one execute method.
   * Called by the framework during registration.
   */
  validate(): void {
    if (!this.supportsCli() && !this.supportsTui()) {
      throw new Error(
        `Command '${this.name}' must implement at least one of: executeCli, executeTui`
      );
    }
  }

  /**
   * Get a subcommand by name.
   */
  getSubCommand(name: string): Command | undefined {
    return this.subCommands?.find((cmd) => cmd.name === name);
  }

  /**
   * Check if this command has subcommands.
   */
  hasSubCommands(): boolean {
    return (this.subCommands?.length ?? 0) > 0;
  }
}

import type { ReactNode } from "react";
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
 * Result of command execution for TUI display.
 */
export interface CommandResult {
  /** Whether the command succeeded */
  success: boolean;
  /** Result data to display */
  data?: unknown;
  /** Error message if failed */
  error?: string;
  /** Summary message */
  message?: string;
}

/**
 * Context passed to command execute methods.
 * Includes the abort signal for cancellation support.
 */
export interface CommandExecutionContext {
  /** Signal to check for cancellation */
  signal: AbortSignal;
}

/**
 * Error thrown when a command is aborted/cancelled.
 */
export class AbortError extends Error {
  constructor(message = "Command was cancelled") {
    super(message);
    this.name = "AbortError";
  }
}

/**
 * Error thrown when configuration validation fails in buildConfig.
 * This provides a structured way to report validation errors.
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ConfigValidationError";
  }
}

/**
 * Type alias for any command regardless of its options or config types.
 * Use this when storing commands in collections or passing them around
 * without caring about the specific type parameters.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCommand = Command<any, any>;

/**
 * Abstract base class for commands.
 * 
 * Extend this class to create commands that can run in CLI mode, TUI mode, or both.
 * The framework enforces that at least one execute method is implemented.
 * 
 * Commands can optionally implement `buildConfig` to transform and validate parsed
 * options into a typed configuration object before execution.
 * 
 * @typeParam TOptions - The option schema type (defines what CLI flags are accepted)
 * @typeParam TConfig - The configuration type passed to execute methods. Defaults to
 *   OptionValues<TOptions> if buildConfig is not implemented.
 * 
 * @example
 * ```typescript
 * interface RunConfig {
 *   repoPath: string;
 *   iterations: number;
 * }
 * 
 * class RunCommand extends Command<typeof runOptions, RunConfig> {
 *   name = "run";
 *   description = "Run the application";
 *   options = runOptions;
 * 
 *   async buildConfig(ctx: AppContext, opts: OptionValues<typeof runOptions>): Promise<RunConfig> {
 *     const repoPath = path.resolve(opts.repo);
 *     if (!existsSync(repoPath)) {
 *       throw new ConfigValidationError(`Repository not found: ${repoPath}`, "repo");
 *     }
 *     return { repoPath, iterations: parseInt(opts.iterations) };
 *   }
 * 
 *   async execute(ctx: AppContext, config: RunConfig) {
 *     // config is already validated
 *     return { success: true, data: result };
 *   }
 * }
 * ```
 */
export abstract class Command<
  TOptions extends OptionSchema = OptionSchema,
  TConfig = OptionValues<TOptions>
> {
  /** Command name used in CLI */
  abstract readonly name: string;

  /** Display name for TUI (human-readable, e.g., "Run Evaluation") */
  displayName?: string;

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

  // TUI-specific properties

  /** Label for the action button (e.g., "Run", "Generate", "Save") */
  actionLabel?: string;

  /** Whether this command runs immediately without config screen (like "check") */
  immediateExecution?: boolean;

  /**
   * Build and validate a configuration object from parsed options.
   * 
   * Override this method to transform raw CLI options into a typed configuration
   * object, and perform any validation that requires the parsed values (e.g.,
   * checking that a directory exists, validating combinations of options).
   * 
   * If not overridden, the parsed options are passed directly to execute methods.
   * 
   * @throws ConfigValidationError if validation fails
   * @returns The validated configuration object
   */
  buildConfig?(ctx: AppContext, opts: OptionValues<TOptions>): Promise<TConfig> | TConfig;

  /**
   * Execute the command.
   * The framework will call this method for both CLI and TUI modes.
   * 
   * @param ctx - Application context
   * @param config - The configuration object (from buildConfig, or raw options if buildConfig is not implemented)
   * @param execCtx - Execution context with abort signal for cancellation support
   * @returns Optional result for display in TUI results panel
   */
  abstract execute(ctx: AppContext, config: TConfig, execCtx?: CommandExecutionContext): Promise<CommandResult | void> | CommandResult | void;

  /**
   * Called before buildConfig. Use for early validation, resource acquisition, etc.
   * If this throws, buildConfig and execute will not be called but afterExecute will still run.
   */
  beforeExecute?(ctx: AppContext, opts: OptionValues<TOptions>): Promise<void> | void;

  /**
   * Called after execute, even if execute threw an error.
   * Use for cleanup, logging, etc.
   * @param error The error thrown by beforeExecute, buildConfig, or execute, if any
   */
  afterExecute?(
    ctx: AppContext,
    opts: OptionValues<TOptions>,
    error?: Error
  ): Promise<void> | void;

  /**
   * Custom result renderer for TUI.
   * If not provided, results are displayed as JSON.
   */
  renderResult?(result: CommandResult): ReactNode;

  /**
   * Get content to copy to clipboard.
   * Called when user presses Ctrl+Y in results panel.
   * Return undefined if nothing should be copied.
   */
  getClipboardContent?(result: CommandResult): string | undefined;

  /**
   * Called when a config value changes in the TUI.
   * 
   * Override this to update related fields when one field changes.
   * For example, changing "agent" could automatically update "model"
   * to the default model for that agent.
   * 
   * @param key - The key of the field that changed
   * @param value - The new value
   * @param allValues - All current config values (including the new value)
   * @returns Updated values to merge, or undefined if no changes needed
   * 
   * @example
   * ```typescript
   * onConfigChange(key: string, value: unknown, allValues: Record<string, unknown>) {
   *   if (key === "agent") {
   *     return { model: getDefaultModelForAgent(value as string) };
   *   }
   *   return undefined;
   * }
   * ```
   */
  onConfigChange?(
    key: string,
    value: unknown,
    allValues: Record<string, unknown>
  ): Record<string, unknown> | undefined;

  /**
   * Check if this command supports CLI mode.
   */
  supportsCli(): boolean {
    return true;
  }

  /**
   * Check if this command supports TUI mode.
   */
  supportsTui(): boolean {
    return true;
  }

  /**
   * Check if this command implements buildConfig.
   */
  hasConfig(): boolean {
    return typeof this.buildConfig === "function";
  }

  /**
   * Validate the command.
   * Called by the framework during registration.
   */
  validate(): void {
    // No validation needed - execute is abstract and required
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

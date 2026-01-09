import { AppContext, type AppConfig } from "./context.ts";
import { type AnyCommand, ConfigValidationError, type CommandResult } from "./command.ts";
import { CommandRegistry } from "./registry.ts";
import { ExecutionMode } from "../types/execution.ts";
import { LogLevel, type LoggerConfig } from "./logger.ts";
import { generateAppHelp, generateCommandHelp } from "./help.ts";
import {
  createVersionCommand,
  createHelpCommandForParent,
  createRootHelpCommand,
} from "../builtins/index.ts";
import {
  extractCommandChain,
  schemaToParseArgsOptions,
  parseOptionValues,
  validateOptions,
} from "../cli/parser.ts";
import { parseArgs, type ParseArgsConfig } from "util";

/**
 * Global options available on all commands.
 * These are handled by the framework before dispatching to commands.
 */
export interface GlobalOptions {
  "log-level"?: string;
  "detailed-logs"?: boolean;
}

/**
 * Application configuration options.
 */
export interface ApplicationConfig {
  /** Application name (used in CLI, help, version) */
  name: string;
  /** Display name for TUI (human-readable, e.g., "My App") */
  displayName?: string;
  /** Application version */
  version: string;
  /** Optional commit hash for version display (shows "(dev)" if not set) */
  commitHash?: string;
  /** Commands to register */
  commands: AnyCommand[];
  /** Default command when no args provided (by name) */
  defaultCommand?: string;
  /** Logger configuration */
  logger?: LoggerConfig;
  /** Additional config values */
  config?: Record<string, unknown>;
}

/**
 * Application lifecycle hooks.
 */
export interface ApplicationHooks {
  /** Called before running any command */
  onBeforeRun?: (ctx: AppContext, commandName: string) => Promise<void> | void;
  /** Called after command completes (success or failure) */
  onAfterRun?: (ctx: AppContext, commandName: string, error?: Error) => Promise<void> | void;
  /** Called when an error occurs */
  onError?: (ctx: AppContext, error: Error) => Promise<void> | void;
}

/**
 * Main application class.
 * 
 * The Application is the entry point for a Terminatui-based CLI/TUI app.
 * It manages the command registry, context, lifecycle, and execution flow.
 * 
 * @example
 * ```typescript
 * const app = new Application({
 *   name: "myapp",
 *   version: "1.0.0",
 *   commands: [new RunCommand(), new CheckCommand()],
 *   defaultCommand: "interactive",
 * });
 * 
 * await app.run(process.argv.slice(2));
 * ```
 */
export class Application {
  readonly name: string;
  readonly displayName: string;
  readonly version: string;
  readonly commitHash?: string;
  readonly registry: CommandRegistry;
  readonly context: AppContext;

  private readonly defaultCommandName?: string;
  private hooks: ApplicationHooks = {};

  constructor(config: ApplicationConfig) {
    this.name = config.name;
    this.displayName = config.displayName ?? config.name;
    this.version = config.version;
    this.commitHash = config.commitHash;
    this.defaultCommandName = config.defaultCommand;

    // Create context
    const appConfig: AppConfig = {
      name: config.name,
      version: config.version,
      ...config.config,
    };
    this.context = new AppContext(appConfig, config.logger);
    AppContext.setCurrent(this.context);

    // Create registry and register commands
    this.registry = new CommandRegistry();
    this.registerCommands(config.commands);
  }

  /**
   * Register commands and inject help subcommands.
   */
  private registerCommands(commands: AnyCommand[]): void {
    // Register version command at top level
    this.registry.register(createVersionCommand(this.name, this.version, this.commitHash));

    // Register user commands with help injected
    for (const command of commands) {
      this.injectHelpCommand(command);
      this.registry.register(command);
    }

    // Register root help command
    this.registry.register(createRootHelpCommand(commands, this.name, this.version));
  }

  /**
   * Recursively inject help subcommand into a command and its subcommands.
   */
  private injectHelpCommand(command: AnyCommand): void {
    // Create help subcommand for this command
    const helpCmd = createHelpCommandForParent(command, this.name, this.version);

    // Initialize subCommands array if needed
    if (!command.subCommands) {
      command.subCommands = [];
    }

    // Add help as subcommand
    command.subCommands.push(helpCmd);

    // Recursively inject into subcommands
    for (const subCommand of command.subCommands) {
      if (subCommand.name !== "help") {
        this.injectHelpCommand(subCommand);
      }
    }
  }

  /**
   * Set lifecycle hooks.
   */
  setHooks(hooks: ApplicationHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Run the application with the given arguments.
   * 
   * @param argv Command-line arguments (typically process.argv.slice(2))
   */
  async run(argv: string[]): Promise<void> {
    try {
      // Parse global options first
      const { globalOptions, remainingArgs } = this.parseGlobalOptions(argv);
      this.applyGlobalOptions(globalOptions);

      // Extract command path from args
      const { commands: commandPath, remaining: flagArgs } = extractCommandChain(remainingArgs);

      // Resolve command
      const { command, remainingPath } = this.resolveCommand(commandPath);

      if (!command) {
        // No command found - show help or run default
        if (this.defaultCommandName && commandPath.length === 0) {
          const defaultCmd = this.registry.get(this.defaultCommandName);
          if (defaultCmd) {
            await this.executeCommand(defaultCmd, flagArgs, []);
            return;
          }
        }

        // Show help
        console.log(generateAppHelp(this.registry.list(), {
          appName: this.name,
          version: this.version,
        }));
        return;
      }

      // Check for unknown command in path
      if (remainingPath.length > 0 && remainingPath[0] !== "help") {
        console.error(`Unknown command: ${remainingPath.join(" ")}`);
        process.exitCode = 1;
        return;
      }

      // Execute the command
      await this.executeCommand(command, flagArgs, commandPath);
    } catch (error) {
      await this.handleError(error as Error);
    }
  }

  /**
   * Resolve a command from the path.
   */
  private resolveCommand(commandPath: string[]): {
    command: AnyCommand | undefined;
    remainingPath: string[];
  } {
    if (commandPath.length === 0) {
      return { command: undefined, remainingPath: [] };
    }

    const result = this.registry.resolve(commandPath);
    return {
      command: result.command,
      remainingPath: result.remainingPath,
    };
  }

  /**
   * Execute a command with full lifecycle.
   */
  private async executeCommand(
    command: AnyCommand,
    flagArgs: string[],
    commandPath: string[]
  ): Promise<void> {
    // Determine execution mode
    const mode = this.detectExecutionMode(command, flagArgs);

    // Parse options
    const schema = command.options ?? {};
    const parseArgsConfig = schemaToParseArgsOptions(schema);

    let parsedValues: Record<string, unknown> = {};
    let parseError: string | undefined;
    
    try {
      const parseArgsOptions = {
        args: flagArgs,
        options: parseArgsConfig.options as ParseArgsConfig["options"],
        allowPositionals: false,
        strict: true, // Enable strict mode to catch unknown options
      };
      const result = parseArgs(parseArgsOptions);
      parsedValues = result.values;
    } catch (err) {
      // Capture parse error (e.g., unknown option)
      parseError = (err as Error).message;
    }

    // If there was a parse error, show it and help
    if (parseError) {
      console.error(`Error: ${parseError}\n`);
      console.log(generateCommandHelp(command, {
        appName: this.name,
        commandPath: commandPath.length > 0 ? commandPath : [command.name],
      }));
      process.exitCode = 1;
      return;
    }

    let options;
    try {
      options = parseOptionValues(schema, parsedValues);
    } catch (err) {
      // Enum validation error from parseOptionValues
      console.error(`Error: ${(err as Error).message}\n`);
      console.log(generateCommandHelp(command, {
        appName: this.name,
        commandPath: commandPath.length > 0 ? commandPath : [command.name],
      }));
      process.exitCode = 1;
      return;
    }

    // Validate options (required, min/max, etc.)
    const errors = validateOptions(schema, options);
    if (errors.length > 0) {
      for (const error of errors) {
        console.error(`Error: ${error.message}`);
      }
      console.log(); // Blank line
      console.log(generateCommandHelp(command, {
        appName: this.name,
        commandPath: commandPath.length > 0 ? commandPath : [command.name],
      }));
      process.exitCode = 1;
      return;
    }

    // Call onBeforeRun hook
    if (this.hooks.onBeforeRun) {
      await this.hooks.onBeforeRun(this.context, command.name);
    }

    let error: Error | undefined;

    try {
      // Call beforeExecute hook on command
      if (command.beforeExecute) {
        await command.beforeExecute(this.context, options);
      }

      // Build config if command implements buildConfig, otherwise pass options as-is
      let config: unknown;
      if (command.buildConfig) {
        config = await command.buildConfig(this.context, options);
      } else {
        config = options;
      }

      // Execute the command with the config
      const result = await command.execute(this.context, config);
      
      // In CLI mode, handle result output
      if (mode === ExecutionMode.Cli && result) {
        const commandResult = result as CommandResult;
        if (commandResult.success) {
          // Output data as JSON to stdout if present
          if (commandResult.data !== undefined) {
            console.log(JSON.stringify(commandResult.data, null, 2));
          }
        } else {
          // Set exit code for failures
          process.exitCode = 1;
        }
      }
    } catch (e) {
      error = e as Error;
    } finally {
      // Always call afterExecute hook
      if (command.afterExecute) {
        try {
          await command.afterExecute(this.context, options, error);
        } catch (afterError) {
          // afterExecute error takes precedence if no prior error
          if (!error) {
            error = afterError as Error;
          }
        }
      }
    }

    // Call onAfterRun hook
    if (this.hooks.onAfterRun) {
      await this.hooks.onAfterRun(this.context, command.name, error);
    }

    // Re-throw if there was an error
    if (error) {
      throw error;
    }
  }

  /**
   * Detect the execution mode based on command and args.
   */
  private detectExecutionMode(command: AnyCommand, args: string[]): ExecutionMode {
    // If no args and command supports TUI, use TUI mode
    if (args.length === 0 && command.supportsTui()) {
      return ExecutionMode.Tui;
    }

    // Otherwise use CLI mode
    return ExecutionMode.Cli;
  }

  /**
   * Parse global options from argv.
   * Returns the parsed global options and remaining args.
   */
  private parseGlobalOptions(argv: string[]): {
    globalOptions: GlobalOptions;
    remainingArgs: string[];
  } {
    const globalOptions: GlobalOptions = {};
    const remainingArgs: string[] = [];

    let i = 0;
    while (i < argv.length) {
      const arg = argv[i]!;

      if (arg === "--log-level" && i + 1 < argv.length) {
        globalOptions["log-level"] = argv[i + 1];
        i += 2;
      } else if (arg.startsWith("--log-level=")) {
        globalOptions["log-level"] = arg.slice("--log-level=".length);
        i += 1;
      } else if (arg === "--detailed-logs") {
        globalOptions["detailed-logs"] = true;
        i += 1;
      } else if (arg === "--no-detailed-logs") {
        globalOptions["detailed-logs"] = false;
        i += 1;
      } else {
        remainingArgs.push(arg);
        i += 1;
      }
    }

    return { globalOptions, remainingArgs };
  }

  /**
   * Apply global options to the application context.
   */
  private applyGlobalOptions(options: GlobalOptions): void {
    const logger = this.context.logger;

    // Apply detailed-logs
    if (options["detailed-logs"] !== undefined) {
      logger.setDetailed(options["detailed-logs"]);
    }

    // Apply log-level (case-insensitive)
    if (options["log-level"] !== undefined) {
      const levelStr = options["log-level"].toLowerCase();
      // Find the matching log level (case-insensitive)
      const level = Object.entries(LogLevel).find(
        ([key, val]) => typeof val === "number" && key.toLowerCase() === levelStr
      )?.[1] as LogLevel | undefined;
      if (level !== undefined) {
        logger.setMinLevel(level);
      }
    }
  }

  /**
   * Handle an error during execution.
   */
  private async handleError(error: Error): Promise<void> {
    if (this.hooks.onError) {
      await this.hooks.onError(this.context, error);
    } else {
      // Default error handling
      if (error instanceof ConfigValidationError) {
        // Format validation errors more clearly
        const fieldInfo = error.field ? ` (${error.field})` : "";
        console.error(`Configuration error${fieldInfo}: ${error.message}`);
      } else {
        console.error(`Error: ${error.message}`);
      }
      process.exitCode = 1;
    }
  }

  /**
   * Get the application context.
   */
  getContext(): AppContext {
    return this.context;
  }
}

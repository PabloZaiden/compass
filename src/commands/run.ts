import path from "node:path";
import { existsSync } from "node:fs";
import { Command, ConfigValidationError, type AppContext, type OptionSchema, type OptionValues, type CommandResult, type CommandExecutionContext } from "@pablozaiden/terminatui";
import { Runner } from "../run/runner";
import { runOptionsSchema } from "../options";
import { AgentTypes, defaultModels } from "../agents/factory";
import { renderRunResult } from "../react/RunResultRenderer";
import { OutputMode } from "../models";

/**
 * Configuration for the run command after validation.
 */
export interface RunConfig {
  repoPath: string;
  fixture: string;
  agentType: AgentTypes;
  iterationCount: number;
  outputMode: OutputMode;
  useCache: boolean;
  stopOnError: boolean;
  allowFullAccess: boolean;
  model: string;
  evalModel: string;
}

/**
 * TUI metadata for each option - labels, ordering, and groups.
 */
const tuiMetadata: Record<string, { label?: string; order?: number; group?: string; tuiHidden?: boolean }> = {
  repo: { label: "Repository Path", order: 1, group: "Required" },
  fixture: { label: "Fixture File", order: 2, group: "Required" },
  agent: { label: "Agent Type", order: 3, group: "Required" },
  iterations: { label: "Iterations", order: 10, group: "Execution" },
  "output-mode": { label: "Output Mode", order: 11, group: "Execution" },
  model: { label: "Agent Model", order: 20, group: "Models" },
  "eval-model": { label: "Evaluation Model", order: 21, group: "Models" },
  "use-cache": { label: "Use Cache", order: 30, group: "Options" },
  "stop-on-error": { label: "Stop on Error", order: 31, group: "Options" },
  "allow-full-access": { label: "Allow Full Access", order: 32, group: "Options" },
  "log-level": { label: "Log Level", order: 40, group: "Debug" },
};

/**
 * Convert compass option schema to terminatui option schema with TUI metadata.
 */
function convertOptions(compassSchema: Record<string, unknown>): OptionSchema {
  const result: OptionSchema = {};

  for (const [name, def] of Object.entries(compassSchema)) {
    const compassDef = def as {
      type: string;
      description: string;
      required?: boolean;
      default?: unknown;
      validValues?: string | (() => string);
      placeholder?: string;
    };

    // Get valid values if it's a function
    let enumValues: readonly string[] | undefined;
    if (typeof compassDef.validValues === "function") {
      const values = compassDef.validValues();
      enumValues = values.split(", ");
    } else if (typeof compassDef.validValues === "string") {
      enumValues = compassDef.validValues.split(", ");
    }

    // Get TUI metadata for this option
    const tui = tuiMetadata[name] ?? {};

    result[name] = {
      type: compassDef.type as "string" | "boolean",
      description: compassDef.description,
      required: compassDef.required,
      default: compassDef.default,
      enum: enumValues,
      // TUI metadata
      label: tui.label,
      order: tui.order,
      group: tui.group,
      placeholder: compassDef.placeholder,
      tuiHidden: tui.tuiHidden,
    };
  }

  return result;
}

const runOptions = convertOptions(runOptionsSchema);

/**
 * Helper to parse enum value.
 */
function parseEnumValue<T extends object>(value: string, enumObj: T): T[keyof T] | undefined {
  const entries = Object.entries(enumObj) as [string, T[keyof T]][];
  for (const [key, val] of entries) {
    if (key.toLowerCase() === value.toLowerCase()) {
      return val;
    }
  }
  return undefined;
}

/**
 * Run command - executes evaluation runs against a repository.
 * 
 * This command uses buildConfig to transform parsed CLI options into a
 * validated RunConfig, then passes that to the execute methods.
 */
export class RunCommand extends Command<typeof runOptions, RunConfig> {
  readonly name = "run";
  override readonly displayName = "Run Evaluation";
  readonly description = "Run the evaluation with the specified configuration";
  readonly options = runOptions;

  // TUI customization
  override readonly actionLabel = "Start Run";

  override readonly examples = [
    {
      command: "compass run --repo ./my-repo --fixture ./prompts.json --agent opencode",
      description: "Run evaluation against a repository",
    },
    {
      command: "compass run --repo ./repo --fixture ./fix.json --agent codex --use-cache",
      description: "Run with caching enabled",
    },
  ];

  override readonly longDescription = `
Execute evaluation runs against a repository using the specified agent and fixture.
The fixture file should be a JSON file containing evaluation prompts.
Results will be output as JSON to stdout.
`.trim();

  /**
   * Build and validate the RunConfig from parsed options.
   * This is called before execute.
   */
  override buildConfig(_ctx: AppContext, opts: OptionValues<typeof runOptions>): RunConfig {
    // Extract and validate repo path
    const repoPathRaw = opts["repo"] as string | undefined;
    if (!repoPathRaw) {
      throw new ConfigValidationError("Missing required option: repo", "repo");
    }
    const repoPath = path.resolve(repoPathRaw);
    
    if (!existsSync(repoPath)) {
      throw new ConfigValidationError(`Repository path does not exist: ${repoPath}`, "repo");
    }

    // Extract and validate fixture file
    const fixtureRaw = opts["fixture"] as string | undefined;
    if (!fixtureRaw) {
      throw new ConfigValidationError("Missing required option: fixture", "fixture");
    }
    const fixture = path.resolve(fixtureRaw);
    
    if (!existsSync(fixture)) {
      throw new ConfigValidationError(`Fixture file does not exist: ${fixture}`, "fixture");
    }

    // Extract and validate agent type
    const agentTypeStr = opts["agent"] as string | undefined;
    if (!agentTypeStr) {
      throw new ConfigValidationError("Missing required option: agent", "agent");
    }
    const agentType = parseEnumValue(agentTypeStr, AgentTypes);
    if (agentType === undefined) {
      throw new ConfigValidationError(`Invalid agent type: ${agentTypeStr}`, "agent");
    }

    // Extract and validate iterations
    const iterationsStr = opts["iterations"] as string | undefined;
    const iterationCount = iterationsStr ? parseInt(iterationsStr, 10) : 1;
    if (isNaN(iterationCount) || iterationCount <= 0) {
      throw new ConfigValidationError("Iterations must be a positive integer", "iterations");
    }

    // Extract and validate output mode
    const outputModeStr = opts["output-mode"] as string | undefined ?? "Aggregated";
    const outputMode = parseEnumValue(outputModeStr, OutputMode);
    if (outputMode === undefined) {
      throw new ConfigValidationError(`Invalid output mode: ${outputModeStr}`, "output-mode");
    }

    // Boolean options
    const useCache = opts["use-cache"] as boolean | undefined ?? false;
    const stopOnError = opts["stop-on-error"] as boolean | undefined ?? true;
    const allowFullAccess = opts["allow-full-access"] as boolean | undefined ?? true;

    // Model options with agent-based defaults
    let model = opts["model"] as string | undefined;
    if (model === undefined || model.trim() === "") {
      model = defaultModels[agentType];
    }

    let evalModel = opts["eval-model"] as string | undefined;
    if (evalModel === undefined || evalModel.trim() === "") {
      evalModel = defaultModels[agentType];
    }

    return {
      repoPath,
      fixture,
      agentType,
      iterationCount,
      outputMode,
      useCache,
      stopOnError,
      allowFullAccess,
      model,
      evalModel,
    };
  }

  /**
   * Execute the run command.
   * Returns CommandResult for both CLI and TUI modes.
   */
  override async execute(ctx: AppContext, config: RunConfig, execCtx?: CommandExecutionContext): Promise<CommandResult> {
    try {
      const runner = new Runner();
      const result = await runner.run(config, execCtx?.signal);
      ctx.logger.info("Run completed successfully");
      return { success: true, data: result };
    } catch (error) {
      // Check if this was a cancellation
      if (error instanceof Error && error.name === "AbortError") {
        ctx.logger.info("Run was cancelled");
        throw error; // Re-throw to let framework handle it
      }
      const message = error instanceof Error ? error.message : String(error);
      ctx.logger.error("Run failed:", message);
      return {
        success: false,
        error: message,
        message: message
      };
    }
  }

  /**
   * Get content for clipboard from TUI result.
   */
  override getClipboardContent(result: CommandResult): string {
    if (result.success && result.data) {
      return JSON.stringify(result.data, null, 2);
    }
    return result.message ?? "";
  }

  /**
   * Handle config value changes in the TUI.
   * When agent type changes, update model and eval-model to agent defaults.
   */
  override onConfigChange(
    key: string,
    value: unknown,
    _allValues: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (key === "agent" && typeof value === "string") {
      const agentType = AgentTypes[value as keyof typeof AgentTypes];
      if (agentType !== undefined) {
        const defaultModel = defaultModels[agentType];
        return {
          model: defaultModel,
          "eval-model": defaultModel,
        };
      }
    }
    return undefined;
  }

  /**
   * Custom result rendering for TUI with colored summary and syntax-highlighted JSON.
   */
  override renderResult(result: CommandResult) {
    return renderRunResult(result);
  }
}

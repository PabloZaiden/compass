import path from "node:path";
import { existsSync } from "node:fs";
import { Command, ConfigValidationError, type AppContext, type OptionSchema, type OptionValues, type CommandResult } from "@pablozaiden/terminator";
import { Generator } from "../generate/generator";
import { generateOptionsSchema } from "../options";
import { AgentTypes, defaultModels } from "../agents/factory";

/**
 * Configuration for the generate command after validation.
 */
export interface GenerateConfig {
  repoPath: string;
  agentType: AgentTypes;
  count: number;
  model: string;
  steering?: string;
  useCache: boolean;
}

/**
 * TUI metadata for each option.
 */
const tuiMetadata: Record<string, { label?: string; order?: number; group?: string; tuiHidden?: boolean }> = {
  repo: { label: "Repository Path", order: 1, group: "Required" },
  agent: { label: "Agent Type", order: 2, group: "Required" },
  count: { label: "Prompt Count", order: 3, group: "Required" },
  model: { label: "Model", order: 10, group: "Configuration" },
  steering: { label: "Steering Prompt", order: 11, group: "Configuration" },
  "use-cache": { label: "Use Cache", order: 20, group: "Options" },
  "log-level": { label: "Log Level", order: 30, group: "Debug" },
};

/**
 * Convert compass option schema to terminator option schema with TUI metadata.
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
      const vals = compassDef.validValues();
      enumValues = vals.split(", ");
    } else if (typeof compassDef.validValues === "string") {
      enumValues = compassDef.validValues.split(", ");
    }

    // Get TUI metadata
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

const generateOptions = convertOptions(generateOptionsSchema);

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
 * Generate command - generates compass fixture files for a repository.
 * 
 * This command uses buildConfig to transform parsed CLI options into a
 * validated GenerateConfig, then passes that to the execute methods.
 */
export class GenerateCommand extends Command<typeof generateOptions, GenerateConfig> {
  readonly name = "generate";
  override readonly displayName = "Generate Fixtures";
  readonly description = "Generate a compass fixture file for a repository";
  readonly options = generateOptions;

  // TUI customization
  override readonly actionLabel = "Generate Fixtures";

  override readonly examples = [
    {
      command: "compass generate --repo ./my-repo --agent opencode --count 5",
      description: "Generate 5 prompts using OpenCode agent",
    },
    {
      command: "compass generate --repo ./my-repo --agent copilot --count 10 --model gpt-5",
      description: "Generate 10 prompts with specific model",
    },
    {
      command: 'compass generate --repo ./my-repo --agent gemini --count 10 --steering "Focus on API endpoints"',
      description: "Generate with custom steering prompt",
    },
  ];

  override readonly longDescription = `
Generate evaluation fixture files for a repository by analyzing its structure.
The fixture file contains prompts that can be used to test AI coding agents.
`.trim();

  /**
   * Build and validate the GenerateConfig from parsed options.
   * This is called before executeCli/executeTui.
   */
  override buildConfig(_ctx: AppContext, opts: OptionValues<typeof generateOptions>): GenerateConfig {
    // Extract and validate repo path
    const repoPathRaw = opts["repo"] as string | undefined;
    if (!repoPathRaw) {
      throw new ConfigValidationError("Missing required option: repo", "repo");
    }
    const repoPath = path.resolve(repoPathRaw);
    
    if (!existsSync(repoPath)) {
      throw new ConfigValidationError(`Repository path does not exist: ${repoPath}`, "repo");
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

    // Extract and validate count
    const countStr = opts["count"] as string | undefined;
    if (!countStr) {
      throw new ConfigValidationError("Missing required option: count", "count");
    }
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count <= 0) {
      throw new ConfigValidationError("Count must be a positive integer", "count");
    }

    // Optional options
    const steering = opts["steering"] as string | undefined;
    const useCache = opts["use-cache"] as boolean | undefined ?? false;

    // Model with agent-based default
    let model = opts["model"] as string | undefined;
    if (model === undefined) {
      model = defaultModels[agentType];
    }

    return {
      repoPath,
      agentType,
      count,
      model,
      steering,
      useCache,
    };
  }

  override async executeCli(ctx: AppContext, config: GenerateConfig): Promise<void> {
    const generator = new Generator();
    const result = await generator.generate(config);

    if (result.success) {
      process.exitCode = 0;
    } else {
      ctx.logger.error(result.error ?? "Generation failed");
      process.exitCode = 1;
    }
  }

  /**
   * Execute in TUI mode.
   */
  override async executeTui(_ctx: AppContext, config: GenerateConfig): Promise<CommandResult> {
    try {
      const generator = new Generator();
      const result = await generator.generate(config);

      if (result.success) {
        return { 
          success: true, 
          data: result,
          message: `Generated ${config.count} prompts to fixture file`
        };
      } else {
        return { 
          success: false, 
          message: result.error ?? "Generation failed"
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Handle config value changes in the TUI.
   * When agent type changes, update model to agent default.
   */
  override onConfigChange(
    key: string,
    value: unknown,
    _allValues: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (key === "agent" && typeof value === "string") {
      const agentType = AgentTypes[value as keyof typeof AgentTypes];
      if (agentType !== undefined) {
        return { model: defaultModels[agentType] };
      }
    }
    return undefined;
  }
}

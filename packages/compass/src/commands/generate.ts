import path from "node:path";
import { Command, type AppContext, type OptionSchema, type OptionValues } from "@pablozaiden/terminator";
import { Generator } from "../generate/generator";
import { generateOptionsSchema } from "../options";
import { AgentTypes, defaultModels } from "../agents/factory";

/**
 * Convert compass option schema to terminator option schema.
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
    };

    // Get valid values if it's a function
    let enumValues: readonly string[] | undefined;
    if (typeof compassDef.validValues === "function") {
      const vals = compassDef.validValues();
      enumValues = vals.split(", ");
    } else if (typeof compassDef.validValues === "string") {
      enumValues = compassDef.validValues.split(", ");
    }

    result[name] = {
      type: compassDef.type as "string" | "boolean",
      description: compassDef.description,
      required: compassDef.required,
      default: compassDef.default,
      enum: enumValues,
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
 */
export class GenerateCommand extends Command<typeof generateOptions> {
  readonly name = "generate";
  readonly description = "Generate a compass fixture file for a repository";
  readonly options = generateOptions;

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

  override async executeCli(ctx: AppContext, opts: OptionValues<typeof generateOptions>): Promise<void> {
    // Apply common options
    const logLevel = opts["log-level"];
    if (logLevel === "debug") {
      ctx.logger.setDetailed(true);
    }

    // Extract options
    const repoPathRaw = opts["repo"] as string | undefined;
    if (!repoPathRaw) {
      ctx.logger.error("Missing required option: repo");
      process.exitCode = 1;
      return;
    }
    const repoPath = path.resolve(repoPathRaw);

    const agentTypeStr = opts["agent"] as string | undefined;
    if (!agentTypeStr) {
      ctx.logger.error("Missing required option: agent");
      process.exitCode = 1;
      return;
    }
    const agentType = parseEnumValue(agentTypeStr, AgentTypes);
    if (agentType === undefined) {
      ctx.logger.error(`Invalid agent type: ${agentTypeStr}`);
      process.exitCode = 1;
      return;
    }

    const countStr = opts["count"] as string | undefined;
    if (!countStr) {
      ctx.logger.error("Missing required option: count");
      process.exitCode = 1;
      return;
    }
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count <= 0) {
      ctx.logger.error("Count must be a positive integer");
      process.exitCode = 1;
      return;
    }

    const steering = opts["steering"] as string | undefined;
    const useCache = opts["use-cache"] as boolean | undefined ?? false;

    // Model with agent-based default
    let model = opts["model"] as string | undefined;
    if (model === undefined) {
      model = defaultModels[agentType];
    }

    const generator = new Generator();
    const result = await generator.generate({
      repoPath,
      agentType,
      count,
      model,
      steering,
      useCache,
    });

    if (result.success) {
      process.exitCode = 0;
    } else {
      ctx.logger.error(result.error ?? "Generation failed");
      process.exitCode = 1;
    }
  }
}

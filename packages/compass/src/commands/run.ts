import { Command, type AppContext, type OptionSchema, type OptionValues } from "@pablozaiden/terminator";
import { Runner } from "../run/runner";
import { runConfigFromParsedOptions } from "../runconfig/process";
import { runOptionsSchema, type RunOptions } from "../options";

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
      const values = compassDef.validValues();
      enumValues = values.split(", ");
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

const runOptions = convertOptions(runOptionsSchema);

/**
 * Run command - executes evaluation runs against a repository.
 */
export class RunCommand extends Command<typeof runOptions> {
  readonly name = "run";
  readonly description = "Run the evaluation with the specified configuration";
  readonly options = runOptions;

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

  override async executeCli(ctx: AppContext, opts: OptionValues<typeof runOptions>): Promise<void> {
    // Apply common options
    const logLevel = opts["log-level"];
    if (logLevel === "debug") {
      ctx.logger.setDetailed(true);
    }

    // Convert options to the format expected by runConfigFromParsedOptions
    const runOpts: RunOptions = {
      repo: opts["repo"] as string | undefined,
      fixture: opts["fixture"] as string | undefined,
      agent: opts["agent"] as string | undefined,
      iterations: opts["iterations"] as string | undefined,
      "output-mode": opts["output-mode"] as string | undefined,
      "use-cache": opts["use-cache"] as boolean | undefined,
      "stop-on-error": opts["stop-on-error"] as boolean | undefined,
      "allow-full-access": opts["allow-full-access"] as boolean | undefined,
      model: opts["model"] as string | undefined,
      "eval-model": opts["eval-model"] as string | undefined,
      "log-level": logLevel as string | undefined,
    };

    const config = await runConfigFromParsedOptions(runOpts);

    const runner = new Runner();

    try {
      const result = await runner.run(config);
      ctx.logger.info("Run completed successfully");
      Bun.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } catch (error) {
      ctx.logger.error("Run failed:", error);
      process.exitCode = 1;
    }
  }
}

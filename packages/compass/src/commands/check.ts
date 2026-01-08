import { Command, type AppContext, type OptionSchema, type OptionValues } from "@pablozaiden/terminator";
import { Checker } from "../check/checker";
import { checkOptionsSchema } from "../options";

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

const checkOptions = convertOptions(checkOptionsSchema);

/**
 * Check command - verifies that required agent dependencies are installed.
 */
export class CheckCommand extends Command<typeof checkOptions> {
  readonly name = "check";
  readonly description = "Check if all required agent dependencies are installed";
  readonly options = checkOptions;

  override readonly examples = [
    {
      command: "compass check",
      description: "Check all agent dependencies",
    },
    {
      command: "compass check --agent copilot",
      description: "Check Copilot dependencies only",
    },
  ];

  override async executeCli(ctx: AppContext, opts: OptionValues<typeof checkOptions>): Promise<void> {
    // Apply common options
    const logLevel = opts["log-level"];
    if (logLevel === "debug") {
      ctx.logger.setDetailed(true);
    }

    const agentFilter = opts["agent"] as string | undefined;

    const checker = new Checker();
    const result = await checker.check(agentFilter);

    checker.logResults(result);

    if (!result.success) {
      process.exitCode = 1;
    }
  }
}

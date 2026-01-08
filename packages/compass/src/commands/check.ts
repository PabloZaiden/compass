import { Command, type AppContext, type OptionSchema, type OptionValues, type CommandResult } from "@pablozaiden/terminator";
import { Checker } from "../check/checker";
import { checkOptionsSchema } from "../options";

/**
 * TUI metadata for each option.
 */
const tuiMetadata: Record<string, { label?: string; order?: number; group?: string; tuiHidden?: boolean }> = {
  agent: { label: "Agent", order: 1, group: "Filter" },
  "log-level": { label: "Log Level", order: 10, group: "Debug" },
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

const checkOptions = convertOptions(checkOptionsSchema);

/**
 * Check command - verifies that required agent dependencies are installed.
 */
export class CheckCommand extends Command<typeof checkOptions> {
  readonly name = "check";
  override readonly displayName = "Check Dependencies";
  readonly description = "Check if all required agent dependencies are installed";
  readonly options = checkOptions;

  // TUI customization
  override readonly actionLabel = "Run Check";
  override readonly immediateExecution = true; // No required options

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

  /**
   * Execute the check command.
   */
  override async execute(ctx: AppContext, opts: OptionValues<typeof checkOptions>): Promise<CommandResult> {
    // Apply common options
    const logLevel = opts["log-level"];
    if (logLevel === "debug") {
      ctx.logger.setDetailed(true);
    }

    const agentFilter = opts["agent"] as string | undefined;

    try {
      const checker = new Checker();
      const result = await checker.check(agentFilter);
      
      // Log results for both CLI and TUI
      checker.logResults(result);
      
      if (result.success) {
        return { success: true, data: result, message: "All dependencies OK" };
      } else {
        // Count missing binaries across all agents
        const missingCount = result.agents.reduce((count, agent) => 
          count + agent.binaries.filter(b => !b.found).length, 0);
        return { 
          success: false, 
          data: result,
          message: `${missingCount} missing dependencies`
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
   * Custom result rendering for TUI.
   */
  override renderResult(result: CommandResult): string {
    if (!result.data) return result.message ?? "";
    
    const data = result.data as { agents: Array<{ agentName: string; binaries: Array<{ binary: string; found: boolean }> }> };
    const lines: string[] = [];
    
    for (const agent of data.agents) {
      for (const bin of agent.binaries) {
        const status = bin.found ? "✓" : "✗";
        lines.push(`${status} ${agent.agentName}: ${bin.binary}`);
      }
    }
    
    return lines.join("\n");
  }
}

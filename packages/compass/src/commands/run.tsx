import React from "react";
import { Command, ConfigValidationError, Theme, type AppContext, type OptionSchema, type OptionValues, type CommandResult } from "@pablozaiden/terminator";
import { Runner } from "../run/runner";
import { runConfigFromParsedOptions } from "../runconfig/process";
import type { RunConfig } from "../runconfig/runconfig";
import { runOptionsSchema, type RunOptions } from "../options";
import { AgentTypes, defaultModels } from "../agents/factory";
import type { RunnerResult, IterationResult, AggregatedResult } from "../models";
import { JsonHighlight } from "@pablozaiden/terminator";

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
   * This is called before executeCli/executeTui.
   */
  override async buildConfig(_ctx: AppContext, opts: OptionValues<typeof runOptions>): Promise<RunConfig> {
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
    };

    try {
      return await runConfigFromParsedOptions(runOpts);
    } catch (error) {
      // Wrap errors in ConfigValidationError for better error messages
      const message = error instanceof Error ? error.message : String(error);
      throw new ConfigValidationError(message);
    }
  }

  override async executeCli(ctx: AppContext, config: RunConfig): Promise<void> {
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

  /**
   * Execute in TUI mode - returns CommandResult for display.
   */
  override async executeTui(_ctx: AppContext, config: RunConfig): Promise<CommandResult> {
    try {
      const runner = new Runner();
      const result = await runner.run(config);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        message: error instanceof Error ? error.message : String(error)
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
  override renderResult(result: CommandResult): React.ReactNode {
    if (!result.data) {
      return result.message ?? "No data";
    }

    const data = result.data as RunnerResult;
    const { iterationResults, aggregatedResults } = data;

    return (
      <box flexDirection="column" gap={1}>
        {/* Summary Section */}
        <box flexDirection="column" border={true} borderStyle="single" borderColor={Theme.border} padding={1}>
          <text fg={Theme.header}>─ Summary ─</text>
          
          {/* Iteration Results */}
          <box flexDirection="column" marginTop={1}>
            <text fg={Theme.warning}>📋 Iteration Results ({iterationResults.length})</text>
            {iterationResults.map((ir: IterationResult, i: number) => {
              const icon = ir.classification === "SUCCESS" ? "✓" : ir.classification === "PARTIAL" ? "◐" : "✗";
              const color = ir.classification === "SUCCESS" ? Theme.success : ir.classification === "PARTIAL" ? Theme.warning : Theme.error;
              return (
                <text key={i} fg={color}>
                  {icon} {ir.promptId} #{ir.iteration}: {ir.classification} ({ir.points} pts)
                </text>
              );
            })}
          </box>

          {/* Aggregated Results */}
          <box flexDirection="column" marginTop={1}>
            <text fg={Theme.borderFocused}>📊 Aggregated Results ({aggregatedResults.length})</text>
            {aggregatedResults.map((ar: AggregatedResult, i: number) => (
              <text key={i} fg={Theme.label}>
                • {ar.promptId}: {ar.averagePoints.toFixed(2)} pts ({ar.iterations} iterations)
              </text>
            ))}
          </box>
        </box>

        {/* Raw JSON Section */}
        <box flexDirection="column" border={true} borderStyle="single" borderColor={Theme.border} padding={1}>
          <text fg={Theme.overlayTitle}>─ Raw JSON ─</text>
          <box marginTop={1}>
            <JsonHighlight value={data} />
          </box>
        </box>
      </box>
    );
  }
}

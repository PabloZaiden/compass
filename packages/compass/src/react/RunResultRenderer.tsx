import React from "react";
import { Theme, JsonHighlight, type CommandResult } from "@pablozaiden/terminator";
import type { RunnerResult, IterationResult, AggregatedResult } from "../models";

/**
 * Render run command results for TUI with colored summary and syntax-highlighted JSON.
 */
export function renderRunResult(result: CommandResult): React.ReactNode {
  if (!result.data) {
    return result.message ?? "No data";
  }

  const data = result.data as RunnerResult;
  const { iterationResults, aggregatedResults } = data;

  return (
    <box flexDirection="column" gap={1}>
      {/* Summary Section */}
      <box flexDirection="column" border={true} borderStyle="single" borderColor={Theme.border} padding={1}>
        <text fg={Theme.overlayTitle}>── Summary ───────────────────────────</text>

        {/* Iteration Results */}
        <box flexDirection="column" marginTop={1}>
          <text fg={Theme.warning}>📋 Iteration Results ({iterationResults.length})</text>
          {iterationResults.map((ir: IterationResult, i: number) => {
            const icon = ir.classification === "SUCCESS" ? "✓" : ir.classification === "PARTIAL" ? "◐" : "✗";
            const color = ir.classification === "SUCCESS" ? Theme.success : ir.classification === "PARTIAL" ? Theme.warning : Theme.error;
            return (
              <text key={i} fg={color}>
                {"   "}{icon} {ir.promptId} #{ir.iteration}: {ir.classification} ({ir.points} pts)
              </text>
            );
          })}
        </box>

        {/* Aggregated Results */}
        <box flexDirection="column" marginTop={1}>
          <text fg={Theme.borderFocused}>📊 Aggregated Results ({aggregatedResults.length})</text>
          {aggregatedResults.map((ar: AggregatedResult, i: number) => {
            const color = 
              ar.averagePoints > 0.7 ? Theme.success : 
              ar.averagePoints >= 0.4 ? Theme.warning : 
              Theme.error;

            return (<text key={i}>
              {"   "}• {ar.promptId}: <span fg={color}>{ar.averagePoints.toFixed(2)}</span> pts ({ar.iterations} iterations)
            </text>);
          }
          )}
        </box>
      </box>

      {/* Raw JSON Section */}
      <box flexDirection="column" border={true} borderStyle="single" borderColor={Theme.border} padding={1}>
        <text fg={Theme.overlayTitle}>── Raw JSON ───────────────────────────</text>
        <box marginTop={1}>
          <JsonHighlight value={data} />
        </box>
      </box>
    </box>
  );
}

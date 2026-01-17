import React from "react";
import { SemanticColors, type CommandResult } from "@pablozaiden/terminatui";
import type { RunnerResult, IterationResult, AggregatedResult } from "../models";

/**
 * Render run command results for TUI with colored summary and syntax-highlighted JSON.
 */
export function renderRunResult(result: CommandResult): React.ReactNode {
  if (!result.data) {
    return result.message ?? <box>No data</box>;
  }

  const data = result.data as RunnerResult;
  const { iterationResults, aggregatedResults } = data;

  return (
    <box flexDirection="column" gap={1}>
      {/* Summary Section */}
      <box flexDirection="column" border={true} borderStyle="single" borderColor={SemanticColors.border} padding={1}>
        <text fg={SemanticColors.selectionBackground}>── Summary ───────────────────────────</text>

        {/* Iteration Results */}
        <box flexDirection="column" marginTop={1}>
          <text fg={SemanticColors.primary}>📋 Iteration Results ({iterationResults.length})</text>
          {iterationResults.map((ir: IterationResult, i: number) => {
            const icon = ir.classification === "SUCCESS" ? "✓" : ir.classification === "PARTIAL" ? "◐" : "✗";
            const color = ir.classification === "SUCCESS" ? SemanticColors.success : ir.classification === "PARTIAL" ? SemanticColors.warning : SemanticColors.error;
            return (
              <text key={i} fg={color}>
                {"   "}{icon} {ir.promptId} #{ir.iteration}: {ir.classification} ({ir.points} pts)
              </text>
            );
          })}
        </box>

        {/* Aggregated Results */}
        <box flexDirection="column" marginTop={1}>
          <text fg={SemanticColors.primary}>📊 Aggregated Results ({aggregatedResults.length})</text>
          {aggregatedResults.map((ar: AggregatedResult, i: number) => {
            const color = 
              ar.averagePoints > 0.7 ? SemanticColors.success : 
              ar.averagePoints >= 0.4 ? SemanticColors.warning : 
              SemanticColors.error;

            return (<text key={i}>
              {"   "}• {ar.promptId}: <span fg={color}>{ar.averagePoints.toFixed(2)}</span> pts ({ar.iterations} iterations)
            </text>);
          }
          )}
        </box>
      </box>

      {/* Raw JSON Section */}
      <box flexDirection="column" border={true} borderStyle="single" borderColor={SemanticColors.border} padding={1}>
        <text fg={SemanticColors.selectionBackground}>── Raw JSON ───────────────────────────</text>
        <box marginTop={1}>
          <text>{JSON.stringify(data, null, 2)}</text>
        </box>
      </box>
    </box>
  );
}

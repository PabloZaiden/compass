import type { RunnerResult } from "../../models";
import { Theme } from "../utils";
import { Classification } from "../../models";
import { JsonHighlight } from "./JsonHighlight";

const ClassificationTheme = {
    [Classification.SUCCESS]: {
        color: "#4ade80",
        icon: "✓",
    },
    [Classification.PARTIAL]: {
        color: "#fbbf24",
        icon: "◐",
    },
    [Classification.FAILURE]: {
        color: "#f87171",
        icon: "✗",
    },
} as const

interface ResultsPanelProps {
    result: RunnerResult | null;
    error: string | null;
    focused: boolean;
    isLoading: boolean;
}

export function ResultsPanel({
    result,
    error,
    focused,
    isLoading,
}: ResultsPanelProps) {
    const borderColor = focused ? Theme.borderFocused : Theme.border;

    const renderContent = () => {
        if (isLoading) {
            return <text fg="#f5c542">Running iterations...</text>;
        }

        if (error) {
            return (
                <scrollbox scrollY={true} flexGrow={1}>
                    <box flexDirection="column" gap={1} padding={1}>
                        <text fg="#f78888">
                            <strong>Error occurred:</strong>
                        </text>
                        <text fg={Theme.statusText}>{error}</text>
                    </box>
                </scrollbox>
            );
        }

        if (!result) {
            return <text fg={Theme.label}>No results yet. Run iterations to see results.</text>;
        }

        return (
            <scrollbox scrollY={true} flexGrow={1} focused={focused}>
                <box flexDirection="column" gap={0} padding={0}>
                    {/* Summary Header */}
                    <text fg="#61afef">
                        <strong>── Summary ──────────────────────────────────────</strong>
                    </text>
                    <text fg={Theme.statusText}> </text>
                    
                    {/* Iteration Results */}
                    <text fg="#c678dd">
                        <strong>📊 Iteration Results ({result.iterationResults.length})</strong>
                    </text>
                    {result.iterationResults.map((iter, idx) => {
                        const color = ClassificationTheme[Classification[iter.classification]]?.color ?? Theme.statusText;
                        const icon = ClassificationTheme[Classification[iter.classification]]?.icon ?? "•";
                        return (
                            <text key={`iter-${idx}`} fg={color}>
                                {"   "}{icon} {iter.promptId} #{iter.iteration + 1}: {iter.classification} ({iter.points} pts)
                            </text>
                        );
                    })}
                    
                    <text fg={Theme.statusText}> </text>
                    
                    {/* Aggregated Results */}
                    <text fg="#c678dd">
                        <strong>📈 Aggregated Results ({result.aggregatedResults.length})</strong>
                    </text>
                    {result.aggregatedResults.map((agg, idx) => {
                        const avgColor = agg.averagePoints >= 0.7 ? "#4ade80" 
                            : agg.averagePoints >= 0.4 ? "#fbbf24" 
                            : "#f87171";
                        return (
                            <text key={`agg-${idx}`} fg={Theme.statusText}>
                                {"   "}• {agg.promptId}: <span fg={avgColor}>{agg.averagePoints.toFixed(2)} pts</span> <span fg={Theme.label}>({agg.iterations} iterations)</span>
                            </text>
                        );
                    })}
                    
                    <text fg={Theme.statusText}> </text>
                    
                    {/* JSON Header */}
                    <text fg="#e5c07b">
                        <strong>── Raw JSON ─────────────────────────────────────</strong>
                    </text>
                    <text fg={Theme.statusText}> </text>
                    
                    {/* JSON Content with syntax highlighting */}
                    <JsonHighlight value={result} />
                </box>
            </scrollbox>
        );
    };

    return (
        <box
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title="Results"
            flexGrow={1}
            flexBasis={0}
            padding={1}
        >
            {renderContent()}
        </box>
    );
}

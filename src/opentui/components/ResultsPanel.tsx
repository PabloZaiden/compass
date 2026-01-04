/** @jsxImportSource @opentui/react */
import type React from "react";
import type { RunnerResult } from "../../models";
import { THEME } from "../types";

// Classification colors
const CLASSIFICATION_COLORS: Record<string, string> = {
    SUCCESS: "#4ade80",  // green
    PARTIAL: "#fbbf24",  // yellow/amber
    FAILURE: "#f87171",  // red
};

// Classification icons
const CLASSIFICATION_ICONS: Record<string, string> = {
    SUCCESS: "✓",
    PARTIAL: "◐",
    FAILURE: "✗",
};

interface ResultsPanelProps {
    result: RunnerResult | null;
    error: string | null;
    focused: boolean;
    isLoading: boolean;
    height?: number;
}

export function ResultsPanel({
    result,
    error,
    focused,
    isLoading,
    height = 20,
}: ResultsPanelProps) {
    const borderColor = focused ? THEME.borderFocused : THEME.border;
    
    if (isLoading) {
        return (
            <box
                flexDirection="column"
                border={true}
                borderStyle="rounded"
                borderColor="green"
                title="Results"
                height={height}
                flexGrow={1}
            >
                <text fg="#f5c542">Running iterations...</text>
            </box>
        );
    }

    if (error) {
        return (
            <box
                flexDirection="column"
                border={true}
                borderStyle="rounded"
                borderColor="#f78888"
                title="Error"
                height={height}
                flexGrow={1}
            >
                <scrollbox scrollY={true} flexGrow={1}>
                    <box flexDirection="column" gap={1} padding={1}>
                        <text fg="#f78888">
                            <strong>Error occurred:</strong>
                        </text>
                        <text fg={THEME.statusText}>{error}</text>
                    </box>
                </scrollbox>
            </box>
        );
    }

    if (!result) {
        return (
            <box
                flexDirection="column"
                border={true}
                borderStyle="rounded"
                borderColor={borderColor}
                title="Results"
                height={height}
                flexGrow={1}
            >
                <text fg={THEME.label}>No results yet. Run iterations to see results.</text>
            </box>
        );
    }

    const jsonString = JSON.stringify(result, null, 2);
    
    // Simple JSON syntax highlighting
    const highlightJsonLine = (line: string): React.ReactNode[] => {
        const elements: React.ReactNode[] = [];
        let remaining = line;
        let keyIdx = 0;
        
        // Match patterns: keys, strings, numbers, booleans, null
        const patterns = [
            { regex: /^(\s*)("[\w]+")(:\s*)/, type: "key" },        // "key":
            { regex: /^("(?:[^"\\]|\\.)*")/, type: "string" },       // "string value"
            { regex: /^(-?\d+\.?\d*)/, type: "number" },             // numbers
            { regex: /^(true|false)/, type: "boolean" },             // booleans
            { regex: /^(null)/, type: "null" },                      // null
            { regex: /^([{}\[\],])/, type: "punctuation" },          // brackets, commas
            { regex: /^(\s+)/, type: "whitespace" },                 // whitespace
        ];
        
        const colors: Record<string, string> = {
            key: "#61afef",      // blue
            string: "#98c379",   // green
            number: "#d19a66",   // orange
            boolean: "#c678dd",  // purple
            null: "#c678dd",     // purple
            punctuation: THEME.label,
            whitespace: THEME.label,
        };
        
        while (remaining.length > 0) {
            let matched = false;
            
            for (const { regex, type } of patterns) {
                const match = remaining.match(regex);
                if (match) {
                    if (type === "key") {
                        // Handle key specially: whitespace + key + colon
                        elements.push(<span key={keyIdx++} fg={THEME.label}>{match[1]}</span>);
                        elements.push(<span key={keyIdx++} fg={colors["key"]}>{match[2]}</span>);
                        elements.push(<span key={keyIdx++} fg={THEME.label}>{match[3]}</span>);
                        remaining = remaining.slice(match[0].length);
                    } else {
                        elements.push(<span key={keyIdx++} fg={colors[type]}>{match[0]}</span>);
                        remaining = remaining.slice(match[0].length);
                    }
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                // No pattern matched, take one character
                elements.push(<span key={keyIdx++} fg={THEME.label}>{remaining[0]}</span>);
                remaining = remaining.slice(1);
            }
        }
        
        return elements;
    };

    return (
        <box
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title="Results"
            height={height}
            flexGrow={1}
        >
            <scrollbox scrollY={true} flexGrow={1} focused={focused}>
                <box flexDirection="column" gap={0} padding={1}>
                    {/* Summary Header */}
                    <text fg="#61afef">
                        <strong>── Summary ──────────────────────────────────────</strong>
                    </text>
                    <text fg={THEME.statusText}> </text>
                    
                    {/* Iteration Results */}
                    <text fg="#c678dd">
                        <strong>📊 Iteration Results ({result.iterationResults.length})</strong>
                    </text>
                    {result.iterationResults.map((iter, idx) => {
                        const color = CLASSIFICATION_COLORS[iter.classification] ?? THEME.statusText;
                        const icon = CLASSIFICATION_ICONS[iter.classification] ?? "•";
                        return (
                            <text key={`iter-${idx}`} fg={color}>
                                {"   "}{icon} {iter.promptId} #{iter.iteration + 1}: {iter.classification} ({iter.points} pts)
                            </text>
                        );
                    })}
                    
                    <text fg={THEME.statusText}> </text>
                    
                    {/* Aggregated Results */}
                    <text fg="#c678dd">
                        <strong>📈 Aggregated Results ({result.aggregatedResults.length})</strong>
                    </text>
                    {result.aggregatedResults.map((agg, idx) => {
                        const avgColor = agg.averagePoints >= 0.7 ? "#4ade80" 
                            : agg.averagePoints >= 0.4 ? "#fbbf24" 
                            : "#f87171";
                        return (
                            <text key={`agg-${idx}`} fg={THEME.statusText}>
                                {"   "}• {agg.promptId}: <span fg={avgColor}>{agg.averagePoints.toFixed(2)} pts</span> <span fg={THEME.label}>({agg.iterations} iterations)</span>
                            </text>
                        );
                    })}
                    
                    <text fg={THEME.statusText}> </text>
                    
                    {/* JSON Header */}
                    <text fg="#e5c07b">
                        <strong>── Raw JSON ─────────────────────────────────────</strong>
                    </text>
                    <text fg={THEME.statusText}> </text>
                    
                    {/* JSON Content with syntax highlighting */}
                    {jsonString.split("\n").map((line, idx) => (
                        <text key={`json-${idx}`}>
                            {highlightJsonLine(line)}
                        </text>
                    ))}
                </box>
            </scrollbox>
        </box>
    );
}

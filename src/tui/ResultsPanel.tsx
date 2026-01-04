import React from "react";
import { Box, Text, useStdout } from "ink";
import type { RunnerResult } from "../models";

interface ResultsPanelProps {
    result?: RunnerResult;
    isLoading?: boolean;
    maxHeight?: number;
    scrollOffset?: number;
    isFocused?: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, isLoading = false, maxHeight = 12, scrollOffset = 0, isFocused = false }) => {
    const { stdout } = useStdout();
    const terminalWidth = stdout?.columns || 80;
    // Account for border (2) and padding (2)
    const maxLineWidth = terminalWidth - 4;
    if (isLoading) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} height={maxHeight}>
                <Text bold color="green">
                    Results
                </Text>
                <Text color="yellow">Running iterations...</Text>
            </Box>
        );
    }

    if (!result) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} height={maxHeight}>
                <Text bold color="green">
                    Results
                </Text>
                <Text color="gray">No results yet. Run iterations to see results.</Text>
            </Box>
        );
    }

    // Build all content lines
    const lines: string[] = [];
    
    // Summary section
    lines.push("═══ SUMMARY ═══");
    lines.push(`Iteration Results: ${result.iterationResults.length}`);
    result.iterationResults.forEach((iter) => {
        lines.push(`  ${iter.promptId} - Iteration ${iter.iteration + 1}: ${iter.classification} (${iter.points} pts)`);
    });
    lines.push("");
    lines.push(`Aggregated Results: ${result.aggregatedResults.length}`);
    result.aggregatedResults.forEach((agg) => {
        lines.push(`  ${agg.promptId} - Avg: ${agg.averagePoints.toFixed(2)} pts (${agg.iterations} iterations)`);
    });
    
    // JSON section
    lines.push("");
    lines.push("═══ JSON ═══");
    const jsonString = JSON.stringify(result, null, 2);
    lines.push(...jsonString.split('\n'));
    
    // Calculate visual lines for each line (accounting for wrapping)
    const linesWithHeight = lines.map(line => {
        const visualLines = Math.ceil(line.length / maxLineWidth) || 1;
        return { line, visualLines };
    });
    
    // Calculate total visual lines
    const totalVisualLines = linesWithHeight.reduce((sum, l) => sum + l.visualLines, 0);
    
    // Calculate visible lines based on scroll offset (in visual lines)
    const contentHeight = maxHeight - 2; // -2 for header and padding
    let visualLineCount = 0;
    let startIdx = 0;
    
    // Skip lines until we reach the scroll offset
    for (let i = 0; i < linesWithHeight.length; i++) {
        const line = linesWithHeight[i];
        if (!line) continue;
        if (visualLineCount >= scrollOffset) {
            startIdx = i;
            break;
        }
        visualLineCount += line.visualLines;
    }
    
    // Collect lines until we fill the content height
    const displayLines: string[] = [];
    visualLineCount = 0;
    for (let i = startIdx; i < linesWithHeight.length && visualLineCount < contentHeight; i++) {
        const line = linesWithHeight[i];
        if (!line) continue;
        displayLines.push(line.line);
        visualLineCount += line.visualLines;
    }
    
    const canScrollUp = scrollOffset > 0;
    const canScrollDown = scrollOffset + contentHeight < totalVisualLines;
    
    return (
        <Box flexDirection="column" borderStyle="round" borderColor={isFocused ? "yellow" : "green"} paddingX={1} height={maxHeight}>
            <Text bold color="green">
                Results {isFocused && "(↑↓ to scroll, "} c to copy{isFocused && ")"}
                {canScrollUp && " ▲"}
                {canScrollDown && " ▼"}
            </Text>
            <Box flexDirection="column">
                {displayLines.map((line, idx) => (
                    <Text key={idx} color="white">
                        {line}
                    </Text>
                ))}
            </Box>
        </Box>
    );
};

import React from "react";
import { Box, Text } from "ink";
import type { RunnerResult } from "../models";

interface ResultsPanelProps {
    result?: RunnerResult;
    isLoading?: boolean;
    maxHeight?: number;
    showJson?: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, isLoading = false, maxHeight = 12, showJson = false }) => {
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

    if (showJson) {
        const jsonString = JSON.stringify(result, null, 2);
        const lines = jsonString.split('\n');
        const displayLines = lines.slice(0, maxHeight - 3);
        
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} height={maxHeight}>
                <Text bold color="green">
                    Results JSON (c to copy)
                </Text>
                <Box flexDirection="column">
                    {displayLines.map((line, idx) => (
                        <Text key={idx} color="white" wrap="truncate">
                            {line}
                        </Text>
                    ))}
                    {lines.length > displayLines.length && (
                        <Text color="gray">... {lines.length - displayLines.length} more lines (copy to see all)</Text>
                    )}
                </Box>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} height={maxHeight}>
            <Text bold color="green">
                Results (Tab to toggle JSON, c to copy)
            </Text>
            <Box flexDirection="column" marginBottom={1}>
                <Text bold color="cyan">
                    Iteration Results: {result.iterationResults.length}
                </Text>
                {result.iterationResults.slice(-5).map((iter, idx) => (
                    <Text key={idx} color="white" wrap="truncate">
                        {iter.promptId} - Iteration {iter.iteration + 1}: {iter.classification} ({iter.points} pts)
                    </Text>
                ))}
                {result.iterationResults.length > 5 && (
                    <Text color="gray">... and {result.iterationResults.length - 5} more</Text>
                )}
            </Box>

            <Box flexDirection="column">
                <Text bold color="cyan">
                    Aggregated Results: {result.aggregatedResults.length}
                </Text>
                {result.aggregatedResults.slice(-5).map((agg, idx) => (
                    <Text key={idx} color="white" wrap="truncate">
                        {agg.promptId} - Avg: {agg.averagePoints.toFixed(2)} pts ({agg.iterations} iterations)
                    </Text>
                ))}
                {result.aggregatedResults.length > 5 && (
                    <Text color="gray">... and {result.aggregatedResults.length - 5} more</Text>
                )}
            </Box>
        </Box>
    );
};

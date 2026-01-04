import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { ConfigForm } from "./ConfigForm";
import { ResultsPanel } from "./ResultsPanel";
import { LogsPanel, type LogMessage } from "./LogsPanel";
import { EditorModal } from "./EditorModal";
import { loadConfig, saveConfig } from "./config";
import { Runner } from "../runner";
import { logger, onLogEvent, setTuiLoggingEnabled, type TuiLogEvent } from "../utils";
import type { FormValues, Mode } from "./types";
import type { RunnerResult } from "../models";
import type { Config } from "../config/config";
import { defaultModels, AgentTypes } from "../agents/factory";

interface AppProps {
    onExit: () => void;
}

export const App: React.FC<AppProps> = ({ onExit }) => {
    const { exit } = useApp();
    const [values, setValues] = useState<FormValues>(loadConfig);
    const [mode, setMode] = useState<Mode>("config");
    const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);
    const [editingField, setEditingField] = useState<keyof FormValues | undefined>();
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [logsVisible, setLogsVisible] = useState(true);
    const [result, setResult] = useState<RunnerResult>();
    const [isRunning, setIsRunning] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(process.stdout.rows || 24);
    const [showJsonResults, setShowJsonResults] = useState(false);
    const [spinnerFrame, setSpinnerFrame] = useState(0);
    const [lastCopyAction, setLastCopyAction] = useState<string>("");

    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

    // Setup logging
    useEffect(() => {
        setTuiLoggingEnabled(true);

        const unsubscribe = onLogEvent((event: TuiLogEvent) => {
            setLogs((prev) => {
                const newLogs = [
                    ...prev,
                    {
                        timestamp: new Date(),
                        level: event.level,
                        message: event.message,
                    },
                ];
                // Keep only last 100 logs to prevent memory issues
                return newLogs.slice(-100);
            });
        });

        return () => {
            unsubscribe?.();
        };
    }, []);

    // Handle terminal resize
    useEffect(() => {
        const handleResize = () => {
            setTerminalHeight(process.stdout.rows || 24);
        };

        process.stdout.on('resize', handleResize);
        return () => {
            process.stdout.off('resize', handleResize);
        };
    }, []);

    // Spinner animation while running
    useEffect(() => {
        if (!isRunning) return;
        
        const interval = setInterval(() => {
            setSpinnerFrame((prev) => (prev + 1) % spinnerFrames.length);
        }, 80);

        return () => clearInterval(interval);
    }, [isRunning, spinnerFrames.length]);

    // Handle value changes
    const handleValueChange = useCallback(
        (key: keyof FormValues, value: unknown) => {
            setValues((prev) => {
                const updated = { ...prev, [key]: value };
                
                // Auto-update model when agent changes
                if (key === "agentType") {
                    updated.model = defaultModels[value as AgentTypes];
                    updated.evalModel = defaultModels[value as AgentTypes];
                }
                
                saveConfig(updated);
                return updated;
            });
        },
        []
    );

    // Handle run
    const handleRun = useCallback(async () => {
        if (isRunning) return;

        setIsRunning(true);
        setMode("running");
        setLogs([]);

        try {
            logger.info("Starting benchmark run...");
            const runner = new Runner();

            const config: Config = {
                repoPath: values.repoPath,
                fixture: values.fixture,
                agentType: values.agentType,
                iterationCount: parseInt(values.iterationCount, 10),
                outputMode: values.outputMode,
                useCache: values.useCache,
                stopOnError: values.stopOnError,
                allowFullAccess: values.allowFullAccess,
                logLevel: values.logLevel,
                model: values.model,
                evalModel: values.evalModel,
            };

            const runResult = await runner.run(config);
            setResult(runResult);
            setMode("results");
            logger.info("Run completed successfully");
        } catch (error) {
            logger.error(`Run failed: ${error}`);
            setMode("error");
        } finally {
            setIsRunning(false);
        }
    }, [values, isRunning]);

    // Handle keyboard input with Ink's useInput hook
    useInput((input, key) => {
        // Don't handle input if editing a field
        if (editingField) {
            if (key.escape) {
                setEditingField(undefined);
            }
            return;
        }

        // Ctrl+C to exit
        if (key.ctrl && input === "c") {
            exit();
            onExit();
            return;
        }

        // Copy results JSON to clipboard (c key in results mode)
        if (input === "c" && (mode === "results" || mode === "error") && result) {
            const jsonString = JSON.stringify(result, null, 2);
            void copyToClipboard(jsonString, "Results JSON");
            return;
        }

        // Copy logs to clipboard (y key)
        if (input === "y" && logs.length > 0) {
            const logsString = logs
                .map((log) => `[${log.level}] ${log.timestamp.toISOString()} ${log.message}`)
                .join('\n');
            void copyToClipboard(logsString, "Logs");
            return;
        }

        // Clear logs (x key)
        if (input === "x") {
            setLogs([]);
            setLastCopyAction("✓ Logs cleared");
            setTimeout(() => setLastCopyAction(""), 2000);
            return;
        }

        // Toggle JSON view in results (Tab key when in results mode)
        if (key.tab && (mode === "results" || mode === "error") && result) {
            setShowJsonResults((prev) => !prev);
            return;
        }

        // Escape or q to quit
        if ((input === "q" || input === "Q" || key.escape)) {
            exit();
            onExit();
            return;
        }

        // Enter to return to config after results
        if (key.return && (mode === "results" || mode === "error")) {
            setMode("config");
            setSelectedFieldIndex(0);
            setShowJsonResults(false);
            return;
        }

        // Ctrl+R to run
        if (key.ctrl && input === "r" && !isRunning) {
            void handleRun();
            return;
        }

        // Ctrl+L to toggle logs (redraw by forcing re-render)
        if (key.ctrl && input === "l") {
            setLogsVisible((prev) => {
                const newValue = !prev;
                // Force a small state change to trigger full redraw
                setTimeout(() => setTerminalHeight(process.stdout.rows || 24), 10);
                return newValue;
            });
            return;
        }

        // Navigation in config mode (only when not running)
        if (mode === "config" && !isRunning) {
            if (key.downArrow || (key.tab && !key.shift)) {
                setSelectedFieldIndex((prev) => (prev + 1) % 12); // 11 fields + run button
                return;
            }
            if (key.upArrow || (key.tab && key.shift)) {
                setSelectedFieldIndex((prev) => (prev - 1 + 12) % 12);
                return;
            }

            // Enter to edit field or run
            if (key.return) {
                if (selectedFieldIndex === 11) {
                    // Run button
                    void handleRun();
                } else {
                    // Edit field
                    const fieldKeys: (keyof FormValues)[] = [
                        "agentType",
                        "repoPath",
                        "fixture",
                        "iterationCount",
                        "outputMode",
                        "logLevel",
                        "useCache",
                        "stopOnError",
                        "allowFullAccess",
                        "model",
                        "evalModel",
                    ];
                    setEditingField(fieldKeys[selectedFieldIndex]);
                }
                return;
            }
        }
    });

    // Helper function to copy to clipboard
    const stripAnsiCodes = (text: string): string => {
        // Remove ANSI escape sequences
        return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            setLastCopyAction(`Copying ${label}...`);
            
            // Strip ANSI codes from the text before copying
            const cleanText = stripAnsiCodes(text);
            
            // Use OSC 52 escape sequence to copy to clipboard
            // This works in most modern terminals without external dependencies
            const base64 = Buffer.from(cleanText).toString('base64');
            const osc52 = `\x1b]52;c;${base64}\x07`;
            
            // Write the escape sequence to stdout
            process.stdout.write(osc52);
            
            setLastCopyAction(`✓ ${label} copied`);
            setTimeout(() => setLastCopyAction(""), 2000);
            logger.info(`${label} copied to clipboard`);
        } catch (error) {
            setLastCopyAction(`✗ Error copying`);
            setTimeout(() => setLastCopyAction(""), 2000);
            logger.error(`Error copying to clipboard: ${error}`);
        }
    };

    // Calculate dynamic heights based on terminal size
    const headerHeight = 2;
    const statusHeight = 1;
    const availableHeight = terminalHeight - headerHeight - statusHeight;
    const configHeight = Math.min(15, Math.floor(availableHeight * 0.5));
    const panelHeight = Math.max(8, availableHeight - configHeight - 1);
    const logMaxLines = Math.max(5, panelHeight - 3);

    return (
        <Box flexDirection="column" height={terminalHeight}>
            {/* Header */}
            <Box paddingX={1} flexDirection="column">
                <Text color="blue" bold>
                    Compass TUI (Ink) – ↑↓ navigate • Enter edit/run • Ctrl+R run • Ctrl+L logs • q quit
                </Text>
            </Box>

            {/* Main content area */}
            {mode === "config" && !editingField && (
                <Box flexDirection="column" flexGrow={1}>
                    <ConfigForm
                        values={values}
                        selectedFieldIndex={selectedFieldIndex}
                        maxHeight={configHeight}
                    />
                </Box>
            )}

            {mode === "running" && (
                <Box flexDirection="column" flexGrow={1}>
                    <Box paddingX={1}>
                        <Text color="yellow">Running benchmarks...</Text>
                    </Box>
                </Box>
            )}

            {(mode === "results" || mode === "error") && (
                <Box flexDirection="column" flexGrow={1}>
                    <ResultsPanel 
                        result={result} 
                        isLoading={isRunning} 
                        maxHeight={panelHeight}
                        showJson={showJsonResults}
                    />
                    <Box paddingX={1} marginTop={1}>
                        <Text color="cyan">Press Enter to return to config • Tab to toggle JSON • c to copy</Text>
                    </Box>
                </Box>
            )}

            {/* Editor Modal - overlays everything */}
            {editingField && (
                <Box
                    flexDirection="column"
                    borderStyle="round"
                    borderColor="yellow"
                    paddingX={1}
                    marginX={2}
                    marginY={1}
                >
                    <EditorModal
                        fieldKey={editingField}
                        currentValue={values[editingField]}
                        onSave={(value) => {
                            handleValueChange(editingField, value);
                            setEditingField(undefined);
                        }}
                    />
                </Box>
            )}

            {/* Logs panel - always visible if logsVisible */}
            {logsVisible && (
                <LogsPanel 
                    visible={logsVisible} 
                    messages={logs} 
                    maxLines={logMaxLines}
                    height={panelHeight}
                />
            )}

            {/* Status bar */}
            <Box paddingX={1}>
                <Text color="gray">
                    {lastCopyAction ? (
                        <Text color={lastCopyAction.startsWith("✓") ? "green" : "red"}>{lastCopyAction}</Text>
                    ) : (
                        <>
                            {isRunning ? `${spinnerFrames[spinnerFrame]} Running...` : mode === "results" ? "Complete" : "Ready"}
                            {" | "}
                            Terminal: {terminalHeight} lines
                        </>
                    )}
                </Text>
            </Box>
        </Box>
    );
};

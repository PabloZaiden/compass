import { useState, useCallback, useMemo } from "react";
import { useKeyboard } from "@opentui/react";
import type { Config } from "../config/config";
import { FieldConfigs, Theme, buildCliCommand } from "./utils";
import {
    useConfig,
    useRunner,
    useLogStream,
    useClipboard,
    useSpinner,
} from "./hooks";
import {
    Header,
    ConfigForm,
    EditorModal,
    LogsPanel,
    ResultsPanel,
    StatusBar,
    CliOverlay,
} from "./components";

enum Mode {
    Config,
    Running,
    Results,
    Error,
}

enum FocusedSection {
    Config,
    Logs,
    Results,
}

interface AppProps {
    onExit: () => void;
}

export function App({ onExit }: AppProps) {
    // State management via hooks
    const { values, updateValue } = useConfig();
    const { isRunning, result, error, run, reset } = useRunner();
    const { logs, clearLogs } = useLogStream();
    const { copy, lastAction: copyStatus, setLastAction } = useClipboard();
    const { frameIndex } = useSpinner(isRunning);

    // UI state
    const [mode, setMode] = useState<Mode>(Mode.Config);
    const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);
    const [editingField, setEditingField] = useState<keyof Config | null>(null);
    const [focusedSection, setFocusedSection] = useState<FocusedSection>(FocusedSection.Config);
    const [logsVisible, setLogsVisible] = useState(true);
    const [cliOverlayVisible, setCliOverlayVisible] = useState(false);
    const [configStatus, setConfigStatus] = useState<string | null>(null);

    // Computed values
    const totalFields = FieldConfigs.length + 1; // +1 for run button
    const cliCommand = useMemo(() => buildCliCommand(values), [values]);
    
    // Status message
    const status = useMemo(() => {
        if (copyStatus) return copyStatus;
        if (isRunning) return "Running benchmark...";
        if (mode === Mode.Error) return "Error occurred. Press Enter to return to config.";
        if (mode === Mode.Results) return "Run completed. Press Enter to return to config.";
        if (editingField) return `Editing: ${editingField}. Enter to save, Esc to cancel.`;
        if (configStatus) return configStatus;
        return "Ready. Select [Run] and press Enter to start.";
    }, [mode, isRunning, editingField, copyStatus, configStatus]);

    // Get content for copying based on focused section
    const getContentToCopy = useCallback((): { content: string; label: string } | null => {
        if (cliOverlayVisible) {
            return { content: cliCommand, label: "CLI command" };
        }
        
        switch (focusedSection) {
            case FocusedSection.Config:
                return { content: JSON.stringify(values, null, 2), label: "Config JSON" };
            case FocusedSection.Logs:
                if (logs.length === 0) return null;
                return {
                    content: logs
                        .map((log) => `[${log.level}] ${log.timestamp.toISOString()} ${log.message}`)
                        .join("\n"),
                    label: "Logs"
                };
            case FocusedSection.Results:
                if (result) return { content: JSON.stringify(result, null, 2), label: "Results JSON" };
                if (error) return { content: error, label: "Error" };
                return null;
            default:
                return null;
        }
    }, [focusedSection, values, logs, result, error, cliOverlayVisible, cliCommand]);

    // Handle running
    const handleRun = useCallback(async () => {
        if (isRunning) return;
        
        setMode(Mode.Running);
        clearLogs();
        
        await run(values);
        
        if (error) {
            setMode(Mode.Error);
        } else {
            setMode(Mode.Results);
            setFocusedSection(FocusedSection.Results);
        }
    }, [isRunning, values, run, clearLogs, error]);

    // Handle field editing
    const handleEditField = useCallback((fieldKey: keyof Config) => {
        setEditingField(fieldKey);
    }, []);

    const handleEditSubmit = useCallback((value: unknown) => {
        if (editingField) {
            updateValue(editingField, value);
            setConfigStatus(`✓ ${editingField} updated`);
            setTimeout(() => setConfigStatus(null), 2000);
        }
        setEditingField(null);
    }, [editingField, updateValue]);

    const handleEditCancel = useCallback(() => {
        setEditingField(null);
    }, []);

    // Return to config mode
    const handleReturnToConfig = useCallback(() => {
        setMode(Mode.Config);
        setFocusedSection(FocusedSection.Config);
        reset();
    }, [reset]);

    // Navigate form fields
    const moveSelection = useCallback((delta: number) => {
        setSelectedFieldIndex((prev) => {
            const newIndex = prev + delta;
            if (newIndex < 0) return 0;
            if (newIndex >= totalFields) return totalFields - 1;
            return newIndex;
        });
    }, [totalFields]);

    // Cycle through available panels
    const cycleFocusedSection = useCallback(() => {
        const availableSections: FocusedSection[] = [];
        
        if (mode === Mode.Config) availableSections.push(FocusedSection.Config);
        if (mode === Mode.Results || mode === Mode.Error) availableSections.push(FocusedSection.Results);
        if (logsVisible) availableSections.push(FocusedSection.Logs);
        
        if (availableSections.length === 0) return;
        
        const currentIdx = availableSections.indexOf(focusedSection);
        const nextIdx = (currentIdx + 1) % availableSections.length;
        setFocusedSection(availableSections[nextIdx] ?? FocusedSection.Config);
    }, [mode, logsVisible, focusedSection]);

    // Keyboard handling
    useKeyboard((key) => {
        // When editing, only handle Escape to cancel
        if (editingField) {
            if (key.name === "escape") {
                handleEditCancel();
            }
            // Let the input component handle other keys
            return;
        }

        // Global shortcuts (always available)
        if (key.ctrl && key.name === "c") {
            onExit();
            return;
        }

        if (key.ctrl && key.name === "f") {
            setCliOverlayVisible((prev) => !prev);
            return;
        }

        if (key.ctrl && key.name === "l") {
            setLogsVisible((prev) => !prev);
            return;
        }

        // Ctrl+Y to copy (also check for raw sequence \x19 which is Ctrl+Y)
        if ((key.ctrl && key.name === "y") || key.sequence === "\x19") {
            const copyData = getContentToCopy();
            if (copyData) {
                const success = copy(copyData.content);
                if (success) {
                    setLastAction(`✓ ${copyData.label} copied`);
                    setTimeout(() => setLastAction(""), 2000);
                }
            } else {
                setLastAction("Nothing to copy");
                setTimeout(() => setLastAction(""), 2000);
            }
            return;
        }

        // Close overlay with Escape
        if (cliOverlayVisible && key.name === "escape") {
            setCliOverlayVisible(false);
            return;
        }

        // Quit with q or Escape (when not running or in overlay)
        if (!cliOverlayVisible && !isRunning && (key.name === "q" || key.name === "escape")) {
            if (mode === Mode.Config) {
                onExit();
            } else {
                handleReturnToConfig();
            }
            return;
        }

        // Tab to cycle sections
        if (key.name === "tab") {
            cycleFocusedSection();
            return;
        }

        // Arrow key navigation for config form only
        if (mode === Mode.Config && focusedSection === FocusedSection.Config) {
            if (key.name === "down") {
                moveSelection(1);
                return;
            }

            if (key.name === "up") {
                moveSelection(-1);
                return;
            }
        }

        // Enter to activate field or return to config
        if (key.name === "return" || key.name === "enter") {
            if (mode === Mode.Results || mode === Mode.Error) {
                handleReturnToConfig();
                return;
            }
            
            if (mode === Mode.Config && focusedSection === FocusedSection.Config) {
                // Check if run button is selected
                if (selectedFieldIndex === FieldConfigs.length) {
                    void handleRun();
                } else {
                    const fieldConfig = FieldConfigs[selectedFieldIndex];
                    if (fieldConfig) {
                        handleEditField(fieldConfig.key);
                    }
                }
            }
            return;
        }
    });

    // Determine what to show in the main area
    const showConfig = mode === Mode.Config && !isRunning;
    const showResults = (mode === Mode.Results || mode === Mode.Error) && !isRunning;
    
    // Show logs automatically when running, otherwise respect user toggle
    const showLogs = isRunning || logsVisible;
    
    // Main content only shown when not running
    const showMainContent = showConfig || showResults;

    return (
        <box
            flexDirection="column"
            width="100%"
            height="100%"
            backgroundColor={Theme.background}
            padding={1}
            gap={0}
        >
            {/* Header - fixed */}
            <Header />

            {/* Main content area */}
            {showMainContent && (
                <box flexDirection="row" flexGrow={1} gap={0}>
                    {showConfig && (
                        <ConfigForm
                            values={values}
                            selectedIndex={selectedFieldIndex}
                            focused={focusedSection === FocusedSection.Config}
                        />
                    )}

                    {showResults && (
                        <ResultsPanel
                            result={result}
                            error={error}
                            focused={focusedSection === FocusedSection.Results}
                            isLoading={isRunning}
                        />
                    )}
                </box>
            )}

            {/* Logs - fixed when sharing, expands when alone */}
            <LogsPanel
                logs={logs}
                visible={showLogs}
                focused={focusedSection === FocusedSection.Logs}
                expanded={!showMainContent}
            />

            {/* Status bar - fixed */}
            <StatusBar
                status={status}
                isRunning={isRunning}
                spinnerFrame={frameIndex}
            />

            {/* Editor modal (overlay) */}
            <EditorModal
                fieldKey={editingField}
                currentValue={editingField ? values[editingField] : null}
                visible={editingField !== null}
                onSubmit={handleEditSubmit}
            />

            {/* CLI overlay */}
            <CliOverlay
                command={cliCommand}
                visible={cliOverlayVisible}
            />
        </box>
    );
}

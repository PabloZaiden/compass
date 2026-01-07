import { useState, useCallback, useMemo } from "react";
import type { RunConfig } from "../runconfig/runconfig";
import { FieldConfigs, Theme, buildCliCommand } from "./utils";
import {
    useConfig,
    useRunner,
    useLogStream,
    useClipboard,
    useSpinner,
    useKeyboardHandler,
    KeyboardPriority,
    useGenerateConfig,
    useGenerator,
    useChecker,
    GenerateFieldConfigs,
} from "./hooks";
import { KeyboardProvider } from "./context";
import {
    Header,
    RunConfigForm,
    LogsPanel,
    ResultsPanel,
    StatusBar,
    CliModal,
    CommandSelector,
    GenerateConfigForm,
    EditorModal,
    type FieldConfig,
    getRunFieldOptions,
    getGenerateFieldOptions,
} from "./components";
import type { Command } from "./components/CommandSelector";
import type { GenerateConfig } from "./hooks/useGenerateConfig";

enum Mode {
    CommandSelect,
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
    return (
        <KeyboardProvider>
            <AppContent onExit={onExit} />
        </KeyboardProvider>
    );
}

function AppContent({ onExit }: AppProps) {
    // Command selection state
    const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
    const [commandSelectorIndex, setCommandSelectorIndex] = useState(0);

    // Run mode state
    const { values: runValues, updateValue: updateRunValue } = useConfig();
    const { isRunning, result, error: runError, run, reset: resetRunner } = useRunner();

    // Generate mode state
    const { values: generateValues, updateValue: updateGenerateValue } = useGenerateConfig();
    const { isGenerating, generatedPath, error: generateError, generate, reset: resetGenerator } = useGenerator();

    // Check mode state
    const { isChecking, checkResult, error: checkError, check, reset: resetChecker } = useChecker();

    // Common state
    const { logs, clearLogs } = useLogStream();
    const { copy, lastAction: copyStatus, setLastAction } = useClipboard();
    const isProcessing = isRunning || isGenerating || isChecking;
    const { frameIndex } = useSpinner(isProcessing);

    // UI state
    const [mode, setMode] = useState<Mode>(Mode.CommandSelect);
    const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);
    const [editingRunField, setEditingRunField] = useState<keyof RunConfig | null>(null);
    const [editingGenerateField, setEditingGenerateField] = useState<keyof GenerateConfig | null>(null);
    const [focusedSection, setFocusedSection] = useState<FocusedSection>(FocusedSection.Config);
    const [logsVisible, setLogsVisible] = useState(false);
    const [cliOverlayVisible, setCliOverlayVisible] = useState(false);
    const [configStatus, setConfigStatus] = useState<string | null>(null);

    // Computed values
    const runTotalFields = FieldConfigs.length + 1; // +1 for run button
    const cliCommand = useMemo(() => buildCliCommand(runValues), [runValues]);
    
    // Status message
    const status = useMemo(() => {
        if (copyStatus) return copyStatus;
        if (isChecking) return "Checking dependencies...";
        if (isGenerating) return "Generating fixture...";
        if (isRunning) return "Running benchmark...";
        if (mode === Mode.Error) return "Error occurred. Press Esc to go back.";
        if (mode === Mode.Results) {
            if (selectedCommand === "generate" && generatedPath) {
                return `✓ Fixture generated: ${generatedPath} • Ctrl+Y to copy path`;
            }
            if (selectedCommand === "check") {
                return checkResult?.success 
                    ? "✓ All dependencies found. Press Esc to continue."
                    : "Some dependencies missing. Press Esc to continue.";
            }
            return "Run completed. Press Esc to return to config.";
        }
        if (editingRunField) return `Editing: ${editingRunField}. Enter to save, Esc to cancel.`;
        if (editingGenerateField) return `Editing: ${editingGenerateField}. Enter to save, Esc to cancel.`;
        if (configStatus) return configStatus;
        if (mode === Mode.CommandSelect) return "Select a command to get started.";
        if (selectedCommand === "run") return "Ready. Select [Run] and press Enter to start.";
        if (selectedCommand === "generate") return "Ready. Select [Generate] and press Enter to start.";
        return "Ready.";
    }, [
        mode, isRunning, isGenerating, isChecking, editingRunField, editingGenerateField, 
        copyStatus, configStatus, selectedCommand, generatedPath, checkResult
    ]);

    // Handle command selection
    const handleCommandSelect = useCallback((command: Command) => {
        setSelectedCommand(command);
        setSelectedFieldIndex(0);
        
        if (command === "check") {
            // Check runs immediately
            setMode(Mode.Running);
            clearLogs();
            setLogsVisible(true);
            setFocusedSection(FocusedSection.Logs);
            
            check().then(() => {
                // Always show results for check (even on failure)
                setMode(Mode.Results);
            });
        } else {
            setMode(Mode.Config);
        }
    }, [check, clearLogs]);

    // Handle running benchmark
    const handleRun = useCallback(async () => {
        if (isRunning) return;
        
        setMode(Mode.Running);
        clearLogs();
        setLogsVisible(true);
        setFocusedSection(FocusedSection.Logs);
        
        const outcome = await run(runValues);
        
        if (outcome.success) {
            setMode(Mode.Results);
            setFocusedSection(FocusedSection.Results);
        } else {
            setMode(Mode.Error);
        }
    }, [isRunning, runValues, run, clearLogs]);

    // Handle generating fixture
    const handleGenerate = useCallback(async () => {
        if (isGenerating) return;
        
        setMode(Mode.Running);
        clearLogs();
        setLogsVisible(true);
        setFocusedSection(FocusedSection.Logs);
        
        const outcome = await generate(generateValues);
        
        if (outcome.success) {
            setMode(Mode.Results);
            setFocusedSection(FocusedSection.Logs); // Keep focus on logs to see path
        } else {
            setMode(Mode.Error);
        }
    }, [isGenerating, generateValues, generate, clearLogs]);

    // Handle run field editing
    const handleEditRunField = useCallback((fieldKey: keyof RunConfig) => {
        setEditingRunField(fieldKey);
    }, []);

    const handleRunEditSubmit = useCallback((value: unknown) => {
        if (editingRunField) {
            updateRunValue(editingRunField, value);
            setConfigStatus(`✓ ${editingRunField} updated`);
            setTimeout(() => setConfigStatus(null), 2000);
        }
        setEditingRunField(null);
    }, [editingRunField, updateRunValue]);

    const handleRunEditCancel = useCallback(() => {
        setEditingRunField(null);
    }, []);

    // Handle generate field editing
    const handleEditGenerateField = useCallback((fieldKey: keyof GenerateConfig) => {
        setEditingGenerateField(fieldKey);
    }, []);

    const handleGenerateEditSubmit = useCallback((value: unknown) => {
        if (editingGenerateField) {
            updateGenerateValue(editingGenerateField, value);
            setConfigStatus(`✓ ${editingGenerateField} updated`);
            setTimeout(() => setConfigStatus(null), 2000);
        }
        setEditingGenerateField(null);
    }, [editingGenerateField, updateGenerateValue]);

    const handleGenerateEditCancel = useCallback(() => {
        setEditingGenerateField(null);
    }, []);

    // Return to config mode
    const handleReturnToConfig = useCallback(() => {
        setMode(Mode.Config);
        setFocusedSection(FocusedSection.Config);
        resetRunner();
        resetGenerator();
        resetChecker();
    }, [resetRunner, resetGenerator, resetChecker]);

    // Return to command selection
    const handleReturnToCommandSelect = useCallback(() => {
        setSelectedCommand(null);
        setMode(Mode.CommandSelect);
        setLogsVisible(false);
        setFocusedSection(FocusedSection.Config);
        resetRunner();
        resetGenerator();
        resetChecker();
    }, [resetRunner, resetGenerator, resetChecker]);

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

    // Copy callback for components
    const handleCopyWithFeedback = useCallback((content: string, label: string) => {
        const success = copy(content);
        if (success) {
            setLastAction(`✓ ${label} copied`);
            setTimeout(() => setLastAction(""), 2000);
        }
    }, [copy, setLastAction]);

    // Check if we're in a modal
    const inModal = editingRunField !== null || editingGenerateField !== null || cliOverlayVisible;

    // Global keyboard handler (lowest priority - runs last)
    useKeyboardHandler(
        (event) => {
            const { key } = event;
            // Ctrl+C to exit (always)
            if (key.ctrl && key.name === "c") {
                onExit();
                event.stopPropagation();
                return;
            }

            // Ctrl+Y to copy generated path when in generate results
            if ((key.ctrl && key.name === "y") || key.sequence === "\x19") {
                if (selectedCommand === "generate" && generatedPath && mode === Mode.Results) {
                    handleCopyWithFeedback(generatedPath, "Fixture path");
                    event.stopPropagation();
                    return;
                }
            }

            // Ctrl+F to toggle CLI overlay (only for run command)
            if (key.ctrl && key.name === "f" && selectedCommand === "run") {
                setCliOverlayVisible((prev) => !prev);
                event.stopPropagation();
                return;
            }

            // Ctrl+L to toggle logs
            if (key.ctrl && key.name === "l") {
                setLogsVisible((prev) => !prev);
                event.stopPropagation();
                return;
            }

            // Tab to cycle sections (when not in command select)
            if (key.name === "tab" && mode !== Mode.CommandSelect) {
                cycleFocusedSection();
                event.stopPropagation();
                return;
            }

            // Escape navigation (when not processing and not in modal)
            if (!isProcessing && !inModal && key.name === "escape") {
                if (mode === Mode.CommandSelect) {
                    // Exit app from command select
                    onExit();
                } else if (mode === Mode.Results || mode === Mode.Error) {
                    // For check command, go back to command selection (no config screen)
                    // For run/generate, go back to config
                    if (selectedCommand === "check") {
                        handleReturnToCommandSelect();
                    } else {
                        handleReturnToConfig();
                    }
                } else if (mode === Mode.Config) {
                    // Return to command selection from config
                    handleReturnToCommandSelect();
                }
                event.stopPropagation();
                return;
            }
        },
        KeyboardPriority.Global
    );

    // Determine what to show in the main area
    const showCommandSelect = mode === Mode.CommandSelect;
    const showRunConfig = selectedCommand === "run" && mode === Mode.Config && !isProcessing;
    const showGenerateConfig = selectedCommand === "generate" && mode === Mode.Config && !isProcessing;
    const showResults = (mode === Mode.Results || mode === Mode.Error) && !isProcessing;
    
    // Show logs automatically when processing, otherwise respect user toggle
    const showLogs = isProcessing || logsVisible;
    
    // Main content only shown when not processing (unless in command select)
    const showMainContent = showCommandSelect || showRunConfig || showGenerateConfig || showResults;

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

            {/* Command selector */}
            {showCommandSelect && (
                <CommandSelector
                    selectedIndex={commandSelectorIndex}
                    onSelectionChange={setCommandSelectorIndex}
                    onSelect={handleCommandSelect}
                    onExit={onExit}
                />
            )}

            {/* Main content area */}
            {showMainContent && !showCommandSelect && (
                <box flexDirection="row" flexGrow={1} gap={0}>
                    {showRunConfig && (
                        <RunConfigForm
                            values={runValues}
                            selectedIndex={selectedFieldIndex}
                            focused={focusedSection === FocusedSection.Config && editingRunField === null}
                            onSelectionChange={setSelectedFieldIndex}
                            onEditField={handleEditRunField}
                            onRun={handleRun}
                            totalFields={runTotalFields}
                            onCopy={handleCopyWithFeedback}
                        />
                    )}

                    {showGenerateConfig && (
                        <GenerateConfigForm
                            values={generateValues}
                            selectedIndex={selectedFieldIndex}
                            focused={focusedSection === FocusedSection.Config && editingGenerateField === null}
                            onSelectionChange={setSelectedFieldIndex}
                            onEditField={handleEditGenerateField}
                            onGenerate={handleGenerate}
                            onCopy={handleCopyWithFeedback}
                        />
                    )}

                    {showResults && selectedCommand === "run" && (
                        <ResultsPanel
                            result={result}
                            error={runError}
                            focused={focusedSection === FocusedSection.Results}
                            isLoading={isRunning}
                            onReturnToConfig={handleReturnToConfig}
                            onCopy={handleCopyWithFeedback}
                        />
                    )}

                    {showResults && selectedCommand === "generate" && (
                        <box
                            flexDirection="column"
                            border={true}
                            borderStyle="rounded"
                            borderColor={focusedSection === FocusedSection.Results ? Theme.borderFocused : Theme.border}
                            title="Generate Results"
                            flexGrow={1}
                            padding={1}
                        >
                            {generateError ? (
                                <text fg="#f78888">
                                    <strong>Error:</strong> {generateError}
                                </text>
                            ) : generatedPath ? (
                                <box flexDirection="column" gap={1}>
                                    <text fg="#4ade80">
                                        <strong>✓ Fixture generated successfully!</strong>
                                    </text>
                                    <text fg={Theme.statusText}>
                                        Path: <span fg={Theme.value}>{generatedPath}</span>
                                    </text>
                                    <text fg={Theme.label}>
                                        Press Ctrl+Y to copy the path, Esc to go back
                                    </text>
                                </box>
                            ) : (
                                <text fg={Theme.label}>Generating...</text>
                            )}
                        </box>
                    )}

                    {showResults && selectedCommand === "check" && (
                        <box
                            flexDirection="column"
                            border={true}
                            borderStyle="rounded"
                            borderColor={focusedSection === FocusedSection.Results ? Theme.borderFocused : Theme.border}
                            title="Check Results"
                            flexGrow={1}
                            padding={1}
                        >
                            {checkError ? (
                                <text fg="#f78888">
                                    <strong>Error:</strong> {checkError}
                                </text>
                            ) : checkResult ? (
                                <box flexDirection="column" gap={1}>
                                    <text fg={checkResult.success ? "#4ade80" : "#fbbf24"}>
                                        <strong>
                                            {checkResult.success 
                                                ? "✓ All agent dependencies found!"
                                                : "⚠ Some dependencies are missing"
                                            }
                                        </strong>
                                    </text>
                                    <text fg={Theme.label}>
                                        See logs for details. Press Esc to go back.
                                    </text>
                                </box>
                            ) : (
                                <text fg={Theme.label}>Checking...</text>
                            )}
                        </box>
                    )}
                </box>
            )}

            {/* Logs - fixed when sharing, expands when alone */}
            {!showCommandSelect && (
                <LogsPanel
                    logs={logs}
                    visible={showLogs}
                    focused={focusedSection === FocusedSection.Logs}
                    expanded={!showMainContent || showCommandSelect}
                    onCopy={handleCopyWithFeedback}
                />
            )}

            {/* Status bar - fixed */}
            <StatusBar
                status={status}
                isRunning={isProcessing}
                spinnerFrame={frameIndex}
                showShortcuts={!showCommandSelect}
            />

            {/* Run Editor modal (overlay) */}
            <EditorModal<keyof RunConfig>
                fieldKey={editingRunField}
                currentValue={editingRunField ? runValues[editingRunField] : null}
                visible={editingRunField !== null}
                onSubmit={handleRunEditSubmit}
                onCancel={handleRunEditCancel}
                fieldConfigs={FieldConfigs as FieldConfig<keyof RunConfig>[]}
                getFieldOptions={getRunFieldOptions}
            />

            {/* Generate Editor modal (overlay) */}
            <EditorModal<keyof GenerateConfig>
                fieldKey={editingGenerateField}
                currentValue={editingGenerateField ? generateValues[editingGenerateField] : null}
                visible={editingGenerateField !== null}
                onSubmit={handleGenerateEditSubmit}
                onCancel={handleGenerateEditCancel}
                fieldConfigs={GenerateFieldConfigs as FieldConfig<keyof GenerateConfig>[]}
                getFieldOptions={getGenerateFieldOptions}
            />

            {/* CLI modal */}
            <CliModal
                command={cliCommand}
                visible={cliOverlayVisible}
                onClose={() => setCliOverlayVisible(false)}
                onCopy={handleCopyWithFeedback}
            />
        </box>
    );
}

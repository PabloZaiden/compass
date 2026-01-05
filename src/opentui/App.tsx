import { useState, useCallback, useMemo } from "react";
import type { Config } from "../config/config";
import { FieldConfigs, Theme, buildCliCommand } from "./utils";
import {
    useConfig,
    useRunner,
    useLogStream,
    useClipboard,
    useSpinner,
    useKeyboardHandler,
    KeyboardPriority,
} from "./hooks";
import { KeyboardProvider } from "./context";
import {
    Header,
    ConfigForm,
    EditorModal,
    LogsPanel,
    ResultsPanel,
    StatusBar,
    CliModal,
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
    return (
        <KeyboardProvider>
            <AppContent onExit={onExit} />
        </KeyboardProvider>
    );
}

function AppContent({ onExit }: AppProps) {
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
    const [logsVisible, setLogsVisible] = useState(false);
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

    // Handle running
    const handleRun = useCallback(async () => {
        if (isRunning) return;
        
        setMode(Mode.Running);
        clearLogs();
        setLogsVisible(true);
        setFocusedSection(FocusedSection.Logs);
        
        const outcome = await run(values);
        
        if (outcome.success) {
            setMode(Mode.Results);
            setFocusedSection(FocusedSection.Results);
        } else {
            setMode(Mode.Error);
        }
    }, [isRunning, values, run, clearLogs]);

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

            // Ctrl+F to toggle CLI overlay
            if (key.ctrl && key.name === "f") {
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

            // Tab to cycle sections
            if (key.name === "tab") {
                cycleFocusedSection();
                event.stopPropagation();
                return;
            }

            // Quit with q or Escape (when not running)
            if (!isRunning && (key.name === "q" || key.name === "escape")) {
                if (mode === Mode.Config) {
                    onExit();
                } else {
                    handleReturnToConfig();
                }
                event.stopPropagation();
                return;
            }
        },
        KeyboardPriority.Global
    );

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
                                onSelectionChange={setSelectedFieldIndex}
                                onEditField={handleEditField}
                                onRun={handleRun}
                                totalFields={totalFields}
                                onCopy={handleCopyWithFeedback}
                            />
                        )}

                        {showResults && (
                            <ResultsPanel
                                result={result}
                                error={error}
                                focused={focusedSection === FocusedSection.Results}
                                isLoading={isRunning}
                                onReturnToConfig={handleReturnToConfig}
                                onCopy={handleCopyWithFeedback}
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
                onCopy={handleCopyWithFeedback}
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
                onCancel={handleEditCancel}
            />

            {/* CLI modal */}
            <CliModal
                command={cliCommand}
                visible={cliOverlayVisible}
                onClose={() => setCliOverlayVisible(false)}
                onCopy={(content, label) => {
                    const success = copy(content);
                    if (success) {
                        setLastAction(`✓ ${label} copied`);
                        setTimeout(() => setLastAction(""), 2000);
                    }
                }}
            />
        </box>
    );
}

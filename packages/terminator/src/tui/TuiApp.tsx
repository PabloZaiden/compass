import { useState, useCallback, useMemo } from "react";
import { KeyboardProvider } from "./context/index.ts";
import {
    Header,
    StatusBar,
    CommandSelector,
    ConfigForm,
    EditorModal,
    CliModal,
    LogsPanel,
    ResultsPanel,
    ActionButton,
} from "./components/index.ts";
import {
    useKeyboardHandler,
    KeyboardPriority,
    useClipboard,
    useLogStream,
    useCommandExecutor,
    type LogSource,
} from "./hooks/index.ts";
import { schemaToFieldConfigs, getFieldDisplayValue, buildCliCommand, loadPersistedParameters, savePersistedParameters } from "./utils/index.ts";
import type { AnyCommand } from "../core/command.ts";
import type { AppContext } from "../core/context.ts";
import type { OptionValues, OptionSchema, OptionDef } from "../types/command.ts";
import type { CustomField } from "./TuiApplication.tsx";

/**
 * TUI application mode.
 */
enum Mode {
    CommandSelect,
    Config,
    Running,
    Results,
    Error,
}

/**
 * Focused section for keyboard navigation.
 */
enum FocusedSection {
    Config,
    Logs,
    Results,
}

interface TuiAppProps {
    /** Application name (CLI name) */
    name: string;
    /** Display name for TUI header (human-readable) */
    displayName?: string;
    /** Application version */
    version: string;
    /** Available commands */
    commands: AnyCommand[];
    /** Application context */
    context: AppContext;
    /** Log source for log panel */
    logSource?: LogSource;
    /** Custom fields to add to the TUI form */
    customFields?: CustomField[];
    /** Called when user wants to exit */
    onExit: () => void;
}

/**
 * Main TUI application component.
 * Wraps content with KeyboardProvider.
 */
export function TuiApp(props: TuiAppProps) {
    return (
        <KeyboardProvider>
            <TuiAppContent {...props} />
        </KeyboardProvider>
    );
}

function TuiAppContent({
    name,
    displayName,
    version,
    commands,
    context,
    logSource,
    customFields,
    onExit,
}: TuiAppProps) {
    // State
    const [mode, setMode] = useState<Mode>(Mode.CommandSelect);
    const [selectedCommand, setSelectedCommand] = useState<AnyCommand | null>(null);
    const [commandPath, setCommandPath] = useState<string[]>([]);
    const [commandSelectorIndex, setCommandSelectorIndex] = useState(0);
    const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [focusedSection, setFocusedSection] = useState<FocusedSection>(FocusedSection.Config);
    const [logsVisible, setLogsVisible] = useState(false);
    const [cliModalVisible, setCliModalVisible] = useState(false);
    const [configValues, setConfigValues] = useState<Record<string, unknown>>({});

    // Hooks
    const { logs, clearLogs } = useLogStream(logSource);
    const { copyWithMessage, lastAction } = useClipboard();
    
    // Command executor
    const executeCommand = useCallback(async (cmd: AnyCommand, values: Record<string, unknown>, signal: AbortSignal) => {
        // If the command provides buildConfig, build and validate before executing
        let configOrValues: unknown = values;
        if (cmd.buildConfig) {
            configOrValues = await cmd.buildConfig(context, values as OptionValues<OptionSchema>);
        }

        return await cmd.execute(context, configOrValues as OptionValues<OptionSchema>, { signal });
    }, [context]);

    const { isExecuting, result, error, execute, cancel, reset: resetExecutor } = useCommandExecutor(
        (cmd: unknown, values: unknown, signal: unknown) => executeCommand(cmd as AnyCommand, values as Record<string, unknown>, signal as AbortSignal)
    );

    // Computed values
    const fieldConfigs = useMemo(() => {
        if (!selectedCommand) return [];
        const commandFields = schemaToFieldConfigs(selectedCommand.options);
        // Merge custom fields if provided
        if (customFields && customFields.length > 0) {
            return [...commandFields, ...customFields];
        }
        return commandFields;
    }, [selectedCommand, customFields]);

    const cliCommand = useMemo(() => {
        if (!selectedCommand) return "";
        return buildCliCommand(name, commandPath, selectedCommand.options, configValues as OptionValues<OptionSchema>);
    }, [name, commandPath, selectedCommand, configValues]);

    const breadcrumb = useMemo(() => {
        return commandPath.length > 0 ? commandPath : undefined;
    }, [commandPath]);

    // Initialize config values when command changes
    const initializeConfigValues = useCallback((cmd: AnyCommand) => {
        const defaults: Record<string, unknown> = {};
        const optionDefs = cmd.options as OptionSchema;
        for (const [key, def] of Object.entries(optionDefs)) {
            const typedDef = def as OptionDef;
            if (typedDef.default !== undefined) {
                defaults[key] = typedDef.default;
            } else {
                switch (typedDef.type) {
                    case "string":
                        defaults[key] = typedDef.enum?.[0] ?? "";
                        break;
                    case "number":
                        defaults[key] = typedDef.min ?? 0;
                        break;
                    case "boolean":
                        defaults[key] = false;
                        break;
                    case "array":
                        defaults[key] = [];
                        break;
                }
            }
        }
        // Initialize custom field defaults
        if (customFields) {
            for (const field of customFields) {
                if (field.default !== undefined) {
                    defaults[field.key] = field.default;
                }
            }
        }
        
        // Load persisted parameters and merge with defaults
        const persisted = loadPersistedParameters(name, cmd.name);
        const merged = { ...defaults, ...persisted };
        
        setConfigValues(merged);
    }, [customFields, name]);

    // Handlers
    const handleCommandSelect = useCallback((cmd: AnyCommand) => {
        // Check if command has subcommands to navigate into
        if (cmd.subCommands && cmd.subCommands.length > 0 && !cmd.supportsTui() && !cmd.supportsCli()) {
            // Navigate into subcommands
            setCommandPath((prev) => [...prev, cmd.name]);
            setCommandSelectorIndex(0);
            return;
        }

        setSelectedCommand(cmd);
        setCommandPath((prev) => [...prev, cmd.name]);
        initializeConfigValues(cmd);
        setSelectedFieldIndex(0);
        setFocusedSection(FocusedSection.Config);
        setLogsVisible(false);

        // Check if command should execute immediately
        if (cmd.immediateExecution) {
            handleRunCommand(cmd);
        } else {
            setMode(Mode.Config);
        }
    }, [initializeConfigValues]);

    const handleBack = useCallback(() => {
        if (mode === Mode.Running) {
            // Cancel the running command and go back
            cancel();
            // If command was immediate execution, go back to command select
            if (selectedCommand?.immediateExecution) {
                setMode(Mode.CommandSelect);
                setSelectedCommand(null);
                setCommandPath((prev) => prev.slice(0, -1));
                setSelectedFieldIndex(0);
                setFocusedSection(FocusedSection.Config);
                setLogsVisible(false);
            } else {
                setMode(Mode.Config);
                setFocusedSection(FocusedSection.Config);
            }
            resetExecutor();
        } else if (mode === Mode.Config) {
            setMode(Mode.CommandSelect);
            setSelectedCommand(null);
            setCommandPath((prev) => prev.slice(0, -1));
            setSelectedFieldIndex(0);
            setFocusedSection(FocusedSection.Config);
            setLogsVisible(false);
        } else if (mode === Mode.Results || mode === Mode.Error) {
            // If command was immediate execution, go back to command select
            if (selectedCommand?.immediateExecution) {
                setMode(Mode.CommandSelect);
                setSelectedCommand(null);
                setCommandPath((prev) => prev.slice(0, -1));
                setSelectedFieldIndex(0);
                setFocusedSection(FocusedSection.Config);
                setLogsVisible(false);
            } else {
                setMode(Mode.Config);
                setFocusedSection(FocusedSection.Config);
            }
            resetExecutor();
        } else if (mode === Mode.CommandSelect && commandPath.length > 0) {
            setCommandPath((prev) => prev.slice(0, -1));
            setCommandSelectorIndex(0);
        } else {
            onExit();
        }
    }, [mode, commandPath, selectedCommand, cancel, onExit, resetExecutor]);

    const handleRunCommand = useCallback(async (cmd?: AnyCommand) => {
        const cmdToRun = cmd ?? selectedCommand;
        if (!cmdToRun) return;

        // Save parameters before running
        savePersistedParameters(name, cmdToRun.name, configValues);

        // Set up for running
        setMode(Mode.Running);
        clearLogs();
        setLogsVisible(true);
        setFocusedSection(FocusedSection.Logs);

        // Execute and wait for result
        const outcome = await execute(cmdToRun, configValues);

        // If cancelled, don't transition - handleBack already handled it
        if (outcome.cancelled) {
            return;
        }

        // Transition based on outcome
        if (outcome.success) {
            setMode(Mode.Results);
        } else {
            setMode(Mode.Error);
        }
        setFocusedSection(FocusedSection.Results);
    }, [selectedCommand, configValues, clearLogs, execute, name]);

    const handleEditField = useCallback((fieldKey: string) => {
        setEditingField(fieldKey);
    }, []);

    const handleFieldSubmit = useCallback((value: unknown) => {
        if (editingField) {
            setConfigValues((prev) => {
                let newValues = { ...prev, [editingField]: value };
                
                // Call command's onConfigChange if available
                if (selectedCommand?.onConfigChange) {
                    const updates = selectedCommand.onConfigChange(editingField, value, newValues);
                    if (updates) {
                        newValues = { ...newValues, ...updates };
                    }
                }
                
                // Call custom field onChange if applicable
                const customField = customFields?.find((f) => f.key === editingField);
                if (customField?.onChange) {
                    customField.onChange(value, newValues);
                }
                return newValues;
            });
        }
        setEditingField(null);
    }, [editingField, customFields, selectedCommand]);

    const handleCopy = useCallback((content: string, label: string) => {
        copyWithMessage(content, label);
    }, [copyWithMessage]);

    /**
     * Get clipboard content based on current mode and focused section.
     * Returns { content, label } or null if nothing to copy.
     */
    const getClipboardContent = useCallback((): { content: string; label: string } | null => {
        // In Running mode or when logs are focused, copy logs
        if (mode === Mode.Running || (logsVisible && focusedSection === FocusedSection.Logs)) {
            if (logs.length > 0) {
                const content = logs
                    .map((log) => `[${log.level}] ${log.timestamp.toISOString()} ${log.message}`)
                    .join("\n");
                return { content, label: "Logs" };
            }
            return null;
        }

        // In Results/Error mode with results focused
        if ((mode === Mode.Results || mode === Mode.Error) && focusedSection === FocusedSection.Results) {
            if (error) {
                return { content: error.message, label: "Error" };
            }
            if (result) {
                // Use command's getClipboardContent if available
                if (selectedCommand?.getClipboardContent) {
                    const customContent = selectedCommand.getClipboardContent(result);
                    if (customContent) {
                        return { content: customContent, label: "Results" };
                    }
                }
                return { content: JSON.stringify(result.data ?? result, null, 2), label: "Results" };
            }
            return null;
        }

        // In Config mode with config focused, copy config JSON
        if (mode === Mode.Config && focusedSection === FocusedSection.Config) {
            return { content: JSON.stringify(configValues, null, 2), label: "Config" };
        }

        return null;
    }, [mode, focusedSection, logsVisible, logs, error, result, configValues, selectedCommand]);

    const cycleFocusedSection = useCallback(() => {
        const sections: FocusedSection[] = [];
        if (mode === Mode.Config) sections.push(FocusedSection.Config);
        if (mode === Mode.Results || mode === Mode.Error) sections.push(FocusedSection.Results);
        if (logsVisible) sections.push(FocusedSection.Logs);

        if (sections.length <= 1) return;

        const currentIdx = sections.indexOf(focusedSection);
        const nextIdx = (currentIdx + 1) % sections.length;
        setFocusedSection(sections[nextIdx]!);
    }, [mode, logsVisible, focusedSection]);

    // Global keyboard handler
    useKeyboardHandler(
        (event) => {
            const { key } = event;

            // Escape to go back
            if (key.name === "escape") {
                handleBack();
                event.stopPropagation();
                return;
            }

            // Y to copy content based on current mode and focus
            if ((key.name === "y")) {
                const clipboardData = getClipboardContent();
                if (clipboardData) {
                    handleCopy(clipboardData.content, clipboardData.label);
                }
                event.stopPropagation();
                return;
            }

            // Tab to cycle focus
            if (key.name === "tab") {
                cycleFocusedSection();
                event.stopPropagation();
                return;
            }

            // L to toggle logs
            if (key.name === "l" && !editingField) {
                setLogsVisible((prev) => !prev);
                event.stopPropagation();
                return;
            }

            // C to show CLI command
            if (key.name === "c" && !editingField && mode === Mode.Config) {
                setCliModalVisible(true);
                event.stopPropagation();
                return;
            }
        },
        KeyboardPriority.Global,
        { enabled: !editingField && !cliModalVisible }
    );

    // Get current commands for selector
    const currentCommands = useMemo(() => {
        if (commandPath.length === 0) {
            return commands;
        }

        // Navigate to current path
        let current: AnyCommand[] = commands;
        for (const pathPart of commandPath.slice(0, -1)) {
            const found = current.find((c) => c.name === pathPart);
            if (found?.subCommands) {
                current = found.subCommands;
            }
        }
        return current;
    }, [commands, commandPath]);

    // Status message
    const statusMessage = useMemo(() => {
        if (lastAction) return lastAction;
        if (isExecuting) return "Running benchmark...";
        if (mode === Mode.Error) return "Error occurred. Press Esc to go back.";
        if (mode === Mode.Results) return "Run completed. Press Esc to return to config.";
        if (mode === Mode.CommandSelect) return "Select a command to get started.";
        if (mode === Mode.Config) {
            return `Ready. Select [${selectedCommand?.actionLabel ?? "Run"}] and press Enter.`;
        }
        return "";
    }, [lastAction, isExecuting, mode, selectedCommand]);

    const shortcuts = useMemo(() => {
        const parts: string[] = [];
        if (mode === Mode.Config) {
            parts.push("↑↓ Navigate", "Enter Edit", "Y Copy", "C CLI", "L Logs", "Esc Back");
        } else if (mode === Mode.Running) {
            parts.push("Y Copy", "Esc Cancel");
        } else if (mode === Mode.Results || mode === Mode.Error) {
            parts.push("Tab Focus", "Y Copy", "Esc Back");
        } else {
            parts.push("↑↓ Navigate", "Enter Select", "Esc Exit");
        }
        return parts.join(" • ");
    }, [mode]);

    // Get display value for fields
    const getDisplayValue = useCallback((key: string, value: unknown, _type: string) => {
        const fieldConfig = fieldConfigs.find((f) => f.key === key);
        if (fieldConfig) {
            return getFieldDisplayValue(value, fieldConfig);
        }
        return String(value ?? "");
    }, [fieldConfigs]);

    // Render the main content based on current mode
    const renderContent = () => {
        switch (mode) {
            case Mode.CommandSelect:
                return (
                    <CommandSelector
                        commands={currentCommands.map((cmd) => ({ command: cmd }))}
                        selectedIndex={commandSelectorIndex}
                        onSelectionChange={setCommandSelectorIndex}
                        onSelect={handleCommandSelect}
                        onExit={handleBack}
                        breadcrumb={commandPath.length > 0 ? commandPath : undefined}
                    />
                );

            case Mode.Config:
                if (!selectedCommand) return null;
                return (
                    <box flexDirection="column" flexGrow={1}>
                        <ConfigForm
                            title={`Configure: ${selectedCommand.name}`}
                            fieldConfigs={fieldConfigs}
                            values={configValues}
                            selectedIndex={selectedFieldIndex}
                            focused={focusedSection === FocusedSection.Config}
                            onSelectionChange={setSelectedFieldIndex}
                            onEditField={handleEditField}
                            onAction={() => handleRunCommand()}
                            getDisplayValue={getDisplayValue}
                            actionButton={
                                <ActionButton
                                    label={selectedCommand.actionLabel ?? "Run"}
                                    isSelected={selectedFieldIndex === fieldConfigs.length}
                                />
                            }
                        />
                        {logsVisible && (
                            <LogsPanel
                                logs={logs}
                                visible={true}
                                focused={focusedSection === FocusedSection.Logs}
                            />
                        )}
                    </box>
                );

            case Mode.Running:
                return (
                    <LogsPanel
                        logs={logs}
                        visible={true}
                        focused={true}
                        expanded={true}
                    />
                );

            case Mode.Results:
            case Mode.Error:
                return (
                    <box flexDirection="column" flexGrow={1} gap={1}>
                        <ResultsPanel
                            result={result}
                            error={error}
                            focused={focusedSection === FocusedSection.Results}
                            renderResult={selectedCommand?.renderResult}
                        />
                        {logsVisible && (
                            <LogsPanel
                                logs={logs}
                                visible={true}
                                focused={focusedSection === FocusedSection.Logs}
                            />
                        )}
                    </box>
                );

            default:
                return null;
        }
    };

    return (
        <box flexDirection="column" flexGrow={1} padding={1}>
            <Header name={displayName ?? name} version={version} breadcrumb={breadcrumb} />

            <box key={`content-${mode}-${isExecuting}`} flexDirection="column" flexGrow={1}>
                {renderContent()}
            </box>

            <StatusBar 
                status={statusMessage} 
                isRunning={isExecuting}
                shortcuts={shortcuts} 
            />

            {/* Modals */}
            <EditorModal
                fieldKey={editingField}
                currentValue={editingField ? configValues[editingField] : undefined}
                visible={editingField !== null}
                onSubmit={handleFieldSubmit}
                onCancel={() => setEditingField(null)}
                fieldConfigs={fieldConfigs}
            />

            <CliModal
                command={cliCommand}
                visible={cliModalVisible}
                onClose={() => setCliModalVisible(false)}
                onCopy={handleCopy}
            />
        </box>
    );
}

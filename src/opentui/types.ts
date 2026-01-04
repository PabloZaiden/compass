import type { AgentTypes } from "../agents/factory";
import type { OutputMode, RunnerResult } from "../models";
import type { LogLevel } from "../utils";

export type FormValues = {
    repoPath: string;
    fixture: string;
    agentType: AgentTypes;
    iterationCount: string;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
    allowFullAccess: boolean;
    logLevel: LogLevel;
    model: string;
    evalModel: string;
};

export type Mode = "config" | "running" | "results" | "error";

export type FocusedSection = "config" | "logs" | "results";

export type FieldType = "text" | "number" | "enum" | "boolean";

export interface FieldConfig {
    key: keyof FormValues;
    label: string;
    type: FieldType;
    options?: FieldOption[];
}

export interface FieldOption {
    name: string;
    value: unknown;
}

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
}

export interface AppState {
    mode: Mode;
    formValues: FormValues;
    selectedFieldIndex: number;
    editingField: keyof FormValues | null;
    focusedSection: FocusedSection;
    logs: LogEntry[];
    logsVisible: boolean;
    result: RunnerResult | null;
    error: string | null;
    isRunning: boolean;
    cliOverlayVisible: boolean;
}

// Colors matching the imperative TUI
export const LOG_COLORS: Record<LogLevel, string> = {
    0: "#8c8c8c", // Silly
    1: "#6dd6ff", // Trace
    2: "#7bdcb5", // Debug
    3: "#d6dde6", // Info
    4: "#f5c542", // Warn
    5: "#f78888", // Error
    6: "#ff5c8d", // Fatal
};

export const THEME = {
    background: "#0b0c10",
    border: "#2c2f36",
    borderFocused: "#5da9e9",
    borderSelected: "#61afef",
    label: "#c0cad6",
    value: "#98c379",
    runButton: "#a0e8af",
    header: "#a8b3c1",
    statusText: "#d6dde6",
    overlay: "#0e1117",
    overlayTitle: "#e5c07b",
};

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

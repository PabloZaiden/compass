import type { RunnerResult } from "../models";
import type { Config } from "../config/config";
import { LogLevel } from "../logging";

export type Mode = "config" | "running" | "results" | "error";

export type FocusedSection = "config" | "logs" | "results";

export type FieldType = "text" | "number" | "enum" | "boolean";

export interface FieldConfig {
    key: keyof Config;
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
    formValues: Config;
    selectedFieldIndex: number;
    editingField: keyof Config | null;
    focusedSection: FocusedSection;
    logs: LogEntry[];
    logsVisible: boolean;
    result: RunnerResult | null;
    error: string | null;
    isRunning: boolean;
    cliOverlayVisible: boolean;
}

// Colors matching the imperative TUI
export const LogColors: Record<LogLevel, string> = {
    [LogLevel.Silly]: "#8c8c8c", // Silly
    [LogLevel.Trace]: "#6dd6ff", // Trace
    [LogLevel.Debug]: "#7bdcb5", // Debug
    [LogLevel.Info]: "#d6dde6", // Info
    [LogLevel.Warn]: "#f5c542", // Warn
    [LogLevel.Error]: "#f78888", // Error
    [LogLevel.Fatal]: "#ff5c8d", // Fatal
};

export enum Theme {
    background = "#0b0c10",
    border = "#2c2f36",
    borderFocused = "#5da9e9",
    borderSelected = "#61afef",
    label = "#c0cad6",
    value = "#98c379",
    runButton = "#a0e8af",
    header = "#a8b3c1",
    statusText = "#d6dde6",
    overlay = "#0e1117",
    overlayTitle = "#e5c07b",
};

export const SpinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

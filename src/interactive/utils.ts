import { AgentTypes } from "../agents/factory";
import { OutputMode } from "../models";
import { escapeArg } from "../utils";
import { LogLevel } from "../logging";
import type { RunConfig } from "../runconfig/runconfig";
import type { LoggingConfig } from "./hooks/useLoggingConfig";

type FieldType = "text" | "number" | "enum" | "boolean";

interface FieldOption {
    name: string;
    value: unknown;
}

interface FieldConfig {
    key: keyof RunConfig;
    label: string;
    type: FieldType;
    options?: FieldOption[];
}

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
}

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


// Field definitions with labels and types
export const FieldConfigs: FieldConfig[] = [
    { key: "agentType", label: "Agent", type: "enum" },
    { key: "repoPath", label: "Repository path", type: "text" },
    { key: "fixture", label: "Fixture file", type: "text" },
    { key: "iterationCount", label: "Iterations", type: "number" },
    { key: "outputMode", label: "Output mode", type: "enum" },
    { key: "useCache", label: "Use cache", type: "boolean" },
    { key: "stopOnError", label: "Stop on error", type: "boolean" },
    { key: "allowFullAccess", label: "Allow full access", type: "boolean" },
    { key: "model", label: "Model", type: "text" },
    { key: "evalModel", label: "Eval model", type: "text" },
];

function getEnumOptions<T extends Record<string, string | number>>(enumObj: T): FieldOption[] {
    return Object.values(enumObj)
        .filter((value): value is T[keyof T] & number => typeof value === "number")
        .map((value) => ({
            name: enumObj[value as keyof T] as string,
            value,
        }));
}

export function getFieldOptions(key: keyof RunConfig): FieldOption[] | undefined {
    switch (key) {
        case "agentType":
            return getEnumOptions(AgentTypes);
        case "outputMode":
            return getEnumOptions(OutputMode);
        case "logLevel":
            return getEnumOptions(LogLevel);
        default:
            return undefined;
    }
}

export function getDisplayValue(
    key: keyof RunConfig,
    value: unknown,
    type: string
): string {
    if (type === "boolean") {
        return value ? "True" : "False";
    }
    if (type === "enum") {
        const options = getFieldOptions(key);
        const option = options?.find((o) => o.value === value);
        return option?.name ?? String(value);
    }
    const strValue = String(value ?? "");
    if (strValue === "") {
        return "(empty)";
    }
    return strValue.length > 60 ? strValue.substring(0, 57) + "..." : strValue;
}

export function buildCliCommand(values: RunConfig, loggingConfig?: LoggingConfig): string {
    // Detect if running as compiled binary (not a .ts/.js file)
    const isCompiledBinary = !Bun.main.endsWith(".ts") && !Bun.main.endsWith(".js");
    
    const parts = isCompiledBinary ? ["./compass"] : ["bun", "start"];
    
    // Add the "run" command
    parts.push("run");
    
    // Required options
    parts.push("--repo", escapeArg(values.repoPath));
    parts.push("--fixture", escapeArg(values.fixture));
    parts.push("--agent", escapeArg(AgentTypes[values.agentType] ?? ""));
    
    // Optional options - only include if different from defaults
    if (values.iterationCount !== 1) {
        parts.push("--iterations", String(values.iterationCount));
    }
    if (values.outputMode !== OutputMode.Aggregated) {
        parts.push("--output-mode", escapeArg(OutputMode[values.outputMode] ?? ""));
    }
    
    // Logging options from logging config (or fall back to run config for backwards compatibility)
    const logLevel = loggingConfig?.logLevel ?? values.logLevel;
    const detailedLogs = loggingConfig?.detailedLogs ?? false;
    
    if (logLevel !== LogLevel.Info) {
        parts.push("--log-level", escapeArg(LogLevel[logLevel] ?? ""));
    }
    if (detailedLogs) {
        parts.push("--detailed-logs");
    }
    
    // Boolean options - use --flag or --no-flag syntax
    if (values.useCache) {
        parts.push("--use-cache");
    }
    if (!values.stopOnError) {
        parts.push("--no-stop-on-error");
    }
    if (!values.allowFullAccess) {
        parts.push("--no-allow-full-access");
    }
    
    // Model options - only include if specified
    if (values.model) {
        parts.push("--model", escapeArg(values.model));
    }
    if (values.evalModel) {
        parts.push("--eval-model", escapeArg(values.evalModel));
    }
    
    return parts.join(" ");
}

import { AgentTypes } from "../agents/factory";
import { OutputMode } from "../models";
import { escapeArg } from "../utils";
import { LogLevel } from "../logging";
import type { Config } from "../config/config";
import { isCompiledBinary } from "./launcher";

type FieldType = "text" | "number" | "enum" | "boolean";

interface FieldOption {
    name: string;
    value: unknown;
}

interface FieldConfig {
    key: keyof Config;
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
    { key: "logLevel", label: "Log level", type: "enum" },
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

export function getFieldOptions(key: keyof Config): FieldOption[] | undefined {
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
    key: keyof Config,
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
    return strValue.length > 60 ? strValue.substring(0, 57) + "..." : strValue;
}

export function buildCliCommand(values: Config): string {
    const parts = isCompiledBinary ? ["./compass"] : ["bun", "src/index.ts"];
    
    parts.push("--agent", escapeArg(AgentTypes[values.agentType] ?? ""));
    parts.push("--repo", escapeArg(values.repoPath));
    parts.push("--fixture", escapeArg(values.fixture));
    parts.push("--iterations", String(values.iterationCount));
    parts.push("--output-mode", escapeArg(OutputMode[values.outputMode] ?? ""));
    parts.push("--log-level", escapeArg(LogLevel[values.logLevel] ?? ""));
    parts.push("--use-cache", String(values.useCache));
    parts.push("--stop-on-error", String(values.stopOnError));
    parts.push("--allow-full-access", String(values.allowFullAccess));
    if (values.model) parts.push("--model", escapeArg(values.model));
    if (values.evalModel) parts.push("--eval-model", escapeArg(values.evalModel));
    
    return parts.join(" ");
}

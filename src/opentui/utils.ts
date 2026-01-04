import { AgentTypes, defaultModels } from "../agents/factory";
import { OutputMode } from "../models";
import { escapeArg } from "../utils";
import { LogLevel } from "../logging";
import type { FieldConfig, FieldOption, FormValues } from "./types";

// Field definitions with labels and types
export const FIELD_CONFIGS: FieldConfig[] = [
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

export function getAgentOptions(): FieldOption[] {
    return Object.values(AgentTypes)
        .filter((value): value is AgentTypes => typeof value === "number")
        .map((value) => ({
            name: AgentTypes[value] ?? String(value),
            value,
        }));
}

export function getOutputModeOptions(): FieldOption[] {
    return Object.values(OutputMode)
        .filter((value): value is OutputMode => typeof value === "number")
        .map((value) => ({
            name: OutputMode[value] ?? String(value),
            value,
        }));
}

export function getLogLevelOptions(): FieldOption[] {
    return Object.values(LogLevel)
        .filter((value): value is LogLevel => typeof value === "number")
        .map((value) => ({
            name: LogLevel[value] ?? String(value),
            value,
        }));
}

export function getFieldOptions(key: keyof FormValues): FieldOption[] | undefined {
    switch (key) {
        case "agentType":
            return getAgentOptions();
        case "outputMode":
            return getOutputModeOptions();
        case "logLevel":
            return getLogLevelOptions();
        default:
            return undefined;
    }
}

export function getDisplayValue(
    key: keyof FormValues,
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

export function getModelForAgent(agentType: AgentTypes): string {
    return defaultModels[agentType] ?? "";
}

export function buildCliCommand(values: FormValues): string {
    const parts = ["bun", "src/index.ts"];
    
    parts.push("--agent", escapeArg(AgentTypes[values.agentType] ?? ""));
    parts.push("--repo", escapeArg(values.repoPath));
    parts.push("--fixture", escapeArg(values.fixture));
    parts.push("--iterations", values.iterationCount);
    parts.push("--output", escapeArg(OutputMode[values.outputMode] ?? ""));
    parts.push("--log-level", escapeArg(LogLevel[values.logLevel] ?? ""));
    
    if (values.useCache) parts.push("--cache");
    if (!values.stopOnError) parts.push("--no-stop-on-error");
    if (!values.allowFullAccess) parts.push("--no-full-access");
    if (values.model) parts.push("--model", escapeArg(values.model));
    if (values.evalModel) parts.push("--eval-model", escapeArg(values.evalModel));
    
    return parts.join(" ");
}

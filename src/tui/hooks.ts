import type { AgentTypes } from "../agents/factory";
import { AgentTypes as AgentTypesEnum, defaultModels } from "../agents/factory";
import type { OutputMode } from "../models";
import { OutputMode as OutputModeEnum } from "../models";
import { LogLevel } from "../utils";

export function useFormOptions() {
    const agentOptions = () => {
        return Object.values(AgentTypesEnum)
            .filter((value): value is AgentTypes => typeof value === "number")
            .map((value) => ({
                name: AgentTypesEnum[value],
                value: value as AgentTypes,
            }));
    };

    const outputModeOptions = () => {
        return Object.values(OutputModeEnum)
            .filter((value): value is number => typeof value === "number")
            .map((value) => ({
                name: OutputModeEnum[value] || String(value),
                value: value as OutputMode,
            }));
    };

    const logLevelOptions = () => {
        return Object.values(LogLevel)
            .filter((value): value is LogLevel => typeof value === "number")
            .map((value) => ({
                name: LogLevel[value],
                value,
            }));
    };

    return { agentOptions, outputModeOptions, logLevelOptions };
}

export function getFieldLabel(key: string): string {
    const labels: Record<string, string> = {
        repoPath: "Repository path",
        fixture: "Fixture file",
        agentType: "Agent",
        iterationCount: "Iterations",
        outputMode: "Output mode",
        useCache: "Use cache",
        stopOnError: "Stop on error",
        allowFullAccess: "Allow full access",
        logLevel: "Log level",
        model: "Model",
        evalModel: "Eval model",
    };
    return labels[key] || key;
}

export function getModelForAgent(agentType: AgentTypes): string {
    return defaultModels[agentType] || "";
}

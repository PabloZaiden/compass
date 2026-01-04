import type { AgentTypes } from "../agents/factory";
import type { OutputMode } from "../models";
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

export type FieldType = "text" | "number" | "enum" | "boolean";

export interface FormField {
    key: keyof FormValues;
    label: string;
    type: FieldType;
    options?: { name: string; value: unknown }[];
}

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
}

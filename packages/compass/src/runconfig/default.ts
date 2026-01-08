import { OutputMode } from "../models";
import { LogLevel } from "../logging";

export interface PartialRunConfig {
    iterationCount: number;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
    allowFullAccess: boolean;
    logLevel: LogLevel;
}


export function defaultRunConfigValues(): PartialRunConfig {
    return {
        iterationCount: 1,
        outputMode: OutputMode.Aggregated,
        useCache: false,
        stopOnError: true,
        allowFullAccess: true,
        logLevel: LogLevel.Info,
    }
}

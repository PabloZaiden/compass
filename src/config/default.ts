import { OutputMode } from "../models";
import { LogLevel } from "../utils";

export interface PartialConfig {
    iterationCount: number;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
    allowFullAccess: boolean;
    logLevel: LogLevel;
}


export function defaultConfigValues(): PartialConfig{
    return {
        iterationCount: 1,
        outputMode: OutputMode.Aggregated,
        useCache: false,
        stopOnError: true,
        allowFullAccess: true,
        logLevel: LogLevel.Info,
    }
}
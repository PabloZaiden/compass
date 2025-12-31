import { OutputMode } from "../models";

export interface PartialConfig {
    iterationCount: number;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
}


export function defaultConfigValues(): PartialConfig{
    return {
        iterationCount: 1,
        outputMode: OutputMode.Aggregated,
        useCache: false,
        stopOnError: true,
    }
}
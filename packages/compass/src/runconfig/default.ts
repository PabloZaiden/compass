import { OutputMode } from "../models";

export interface PartialRunConfig {
    iterationCount: number;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
    allowFullAccess: boolean;
}


export function defaultRunConfigValues(): PartialRunConfig {
    return {
        iterationCount: 1,
        outputMode: OutputMode.Aggregated,
        useCache: false,
        stopOnError: true,
        allowFullAccess: true,
    }
}

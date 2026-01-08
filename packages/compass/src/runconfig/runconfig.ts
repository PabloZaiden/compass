import { AgentTypes } from "../agents/factory";
import { OutputMode } from "../models";

export interface OptionalRunConfig {
    iterationCount: number;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
    model: string;
    evalModel: string;
    allowFullAccess: boolean;
}

export interface RequiredRunConfig {
    repoPath: string;
    fixture: string;
    agentType: AgentTypes;
}

export type RunConfig = OptionalRunConfig & RequiredRunConfig;

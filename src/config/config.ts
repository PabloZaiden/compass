import { AgentTypes } from "../agents/factory";
import { OutputMode } from "../models";

export interface OptionalConfig {
    iterationCount: number;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
    model: string;
    evalModel: string;
}

export interface RequiredConfig {
    repoPath: string;
    fixture: string;
    agentType: AgentTypes;
}

export type Config = OptionalConfig & RequiredConfig;

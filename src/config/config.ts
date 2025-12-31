import { AgentTypes } from "../agents/factory";
import { OutputMode, parseEnum } from "../models";
import * as fs from "fs";

export interface OptionalConfig {
    iterationCount: number;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
}

export interface RequiredConfig {
    repoPath: string;
    fixture: string;
    model: string;
    evalModel: string;
    agentType: AgentTypes;
}

export type Config = OptionalConfig & RequiredConfig;

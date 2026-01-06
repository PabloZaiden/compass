import { AgentTypes, defaultModels } from "../agents/factory";
import { OutputMode, parseEnum, values } from "../models";
import type { Config } from "./config";
import { defaultConfigValues } from "./default";
import { LogLevel } from "../logging";
import { existsSync } from "node:fs";
import type { RunOptions } from "../cli/parser";

function getOption(options: RunOptions, name: keyof RunOptions, required: boolean = false) : string | undefined {
    const cliValue = options[name];
    
    // Convert boolean to string for consistency
    const result = cliValue !== undefined 
        ? (typeof cliValue === "boolean" ? String(cliValue) : cliValue)
        : undefined;
    
    if (required && result === undefined) {
        throw new Error(`Missing required argument: --${name}`);
    }

    return result;
}

function getBooleanOption(options: RunOptions, name: keyof RunOptions, defaultValue: boolean): boolean {
    const cliValue = options[name];
    if (typeof cliValue === "boolean") {
        return cliValue;
    }
    
    return defaultValue;
}

export async function fromParsedOptions(options: RunOptions): Promise<Config> {
    const defaultConfig = defaultConfigValues();

    const repoPath = getOption(options, "repo", true)!;
    const fixture = getOption(options, "fixture", true)!;
    const agentTypeStr = getOption(options, "agent", true)!;
    
    const iterationsStr = getOption(options, "iterations");
    const iterationCount = iterationsStr 
        ? parseInt(iterationsStr, 10) 
        : defaultConfig.iterationCount;
    if (Number.isNaN(iterationCount)) {
        throw new Error(`Invalid iteration count: ${iterationsStr}`);
    }
    
    const outputModeStr = getOption(options, "output-mode") 
        ?? OutputMode[defaultConfig.outputMode];
    const logLevelStr = getOption(options, "log-level") 
        ?? LogLevel[defaultConfig.logLevel];
    
    const useCache = getBooleanOption(options, "use-cache", defaultConfig.useCache);
    const stopOnError = getBooleanOption(options, "stop-on-error", defaultConfig.stopOnError);
    const allowFullAccess = getBooleanOption(options, "allow-full-access", defaultConfig.allowFullAccess);
    
    let model = getOption(options, "model");
    let evalModel = getOption(options, "eval-model");
    
    const agentType = parseEnum(AgentTypes, agentTypeStr);
    if (agentType === undefined) {
        throw new Error(`Invalid agent type: ${agentTypeStr}`);
    }

    const outputMode = parseEnum(OutputMode, outputModeStr);
    if (outputMode === undefined) {
        throw new Error(`Invalid output mode: ${outputModeStr}`);
    }

    const logLevel = parseEnum(LogLevel, logLevelStr);
    if (logLevel === undefined) {
        const validLevels = values(LogLevel).join(", ");
        throw new Error(`Invalid log level: ${logLevelStr}. Valid levels are: ${validLevels}`);
    }
    
    if (model === undefined) {
        model = defaultModels[agentType];
    }

    if (evalModel === undefined) {
        evalModel = defaultModels[agentType];
    }
    
    if (!existsSync(repoPath)) {
        throw new Error(`Repository path does not exist: ${repoPath}`);
    }

    if (!await Bun.file(fixture).exists()) {
        throw new Error(`Fixture file does not exist: ${fixture}`);
    }

    return {
        ...defaultConfig,
        repoPath,
        fixture,
        iterationCount,
        outputMode,
        useCache,
        model,
        evalModel,
        agentType,
        stopOnError,
        allowFullAccess,
        logLevel,
    };
}
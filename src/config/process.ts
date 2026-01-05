import { AgentTypes, defaultModels } from "../agents/factory";
import { OutputMode, parseEnum, values } from "../models";
import type { Config } from "./config";
import { defaultConfigValues } from "./default";
import { LogLevel } from "../logging";
import { existsSync } from "node:fs";
import type { ParsedCliOptions } from "../cli/parser";

function getOption(
    options: ParsedCliOptions,
    name: keyof ParsedCliOptions,
    envName: string,
    required: true
): string;
function getOption(
    options: ParsedCliOptions,
    name: keyof ParsedCliOptions,
    envName: string,
    required?: false
): string | undefined;
function getOption(
    options: ParsedCliOptions,
    name: keyof ParsedCliOptions,
    envName: string,
    required = false
): string | undefined {
    const cliValue = options[name];
    const envValue = process.env[`COMPASS_${envName}`];
    
    // Convert boolean to string for consistency
    const result = cliValue !== undefined 
        ? (typeof cliValue === "boolean" ? String(cliValue) : cliValue)
        : envValue;
    
    if (required && result === undefined) {
        throw new Error(`Missing required argument: --${name} or environment variable: COMPASS_${envName}`);
    }
    return result;
}

function getBooleanOption(
    options: ParsedCliOptions,
    name: keyof ParsedCliOptions,
    envName: string,
    defaultValue: boolean
): boolean {
    const cliValue = options[name];
    if (typeof cliValue === "boolean") {
        return cliValue;
    }
    
    const envValue = process.env[`COMPASS_${envName}`];
    if (envValue !== undefined) {
        return envValue === "true";
    }
    
    return defaultValue;
}

export async function fromParsedOptions(options: ParsedCliOptions): Promise<Config> {
    const defaultConfig = defaultConfigValues();

    const repoPath = getOption(options, "repo", "REPO", true);
    const fixture = getOption(options, "fixture", "FIXTURE", true);
    const agentTypeStr = getOption(options, "agent", "AGENT", true);
    
    const iterationsStr = getOption(options, "iterations", "ITERATIONS");
    const iterationCount = iterationsStr 
        ? parseInt(iterationsStr, 10) 
        : defaultConfig.iterationCount;
    
    const outputModeStr = getOption(options, "output-mode", "OUTPUT_MODE") 
        ?? OutputMode[defaultConfig.outputMode];
    const logLevelStr = getOption(options, "log-level", "LOG_LEVEL") 
        ?? LogLevel[defaultConfig.logLevel];
    
    const useCache = getBooleanOption(options, "use-cache", "USE_CACHE", defaultConfig.useCache);
    const stopOnError = getBooleanOption(options, "stop-on-error", "STOP_ON_ERROR", defaultConfig.stopOnError);
    const allowFullAccess = getBooleanOption(options, "allow-full-access", "ALLOW_FULL_ACCESS", defaultConfig.allowFullAccess);
    
    let model = getOption(options, "model", "MODEL");
    let evalModel = getOption(options, "eval-model", "EVAL_MODEL");
    
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
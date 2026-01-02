import { AgentTypes, defaultModels } from "../agents/factory";
import { OutputMode, parseEnum } from "../models";
import * as fs from "fs";
import type { Config } from "./config";
import { defaultConfigValues } from "./default";

function getArgFromCliOrEnv(args: string[], name: string, required = true): string | undefined {
    
    const cliArgName = `--${name}`;
    const envVarName = `COMPASS_${name.toUpperCase().replaceAll("-", "_")}`;
    const envVarValue = process.env[envVarName];
    
    const index = args.indexOf(cliArgName);

    let cliValue: string | undefined = undefined;

    if (index >= 0 && index + 1 < args.length) {
        cliValue = args[index + 1];
    }

    const result = cliValue ?? envVarValue;
    
    if (required && result === undefined) {
        throw new Error(`Missing required argument: ${cliArgName} or environment variable: ${envVarName}`);
    }
    return result;
}

export function fromProcess(args: string[]): Config {
    const defaultConfig = defaultConfigValues();

    const repoPath = getArgFromCliOrEnv(args, "repo")!;
    const fixture = getArgFromCliOrEnv(args, "fixture")!;
    const iterationCount = parseInt(getArgFromCliOrEnv(args, "iterations", false) || defaultConfig.iterationCount.toString(), 10);
    const outputModeStr = getArgFromCliOrEnv(args, "output-mode", false) || OutputMode[defaultConfig.outputMode];
    const useCache = (getArgFromCliOrEnv(args, "use-cache", false) || defaultConfig.useCache.toString()) === "true";
    const agentTypeStr = getArgFromCliOrEnv(args, "agent-type")!;
    const stopOnError = (getArgFromCliOrEnv(args, "stop-on-error", false) || defaultConfig.stopOnError.toString()) === "true";
    const allowFullAccess = (getArgFromCliOrEnv(args, "allow-full-access", false) || defaultConfig.allowFullAccess.toString()) === "true";
    let model = getArgFromCliOrEnv(args, "model", false);
    let evalModel = getArgFromCliOrEnv(args, "eval-model", false);
    
    const agentType = parseEnum(AgentTypes, agentTypeStr);
    if (agentType === undefined) {
        throw new Error(`Invalid agent type: ${agentTypeStr}`);
    }

    const outputMode = parseEnum(OutputMode, outputModeStr);
    if (outputMode === undefined) {
        throw new Error(`Invalid output mode: ${outputModeStr}`);
    }

    if (model === undefined) {
        model = defaultModels[agentType];
    }

    if (evalModel === undefined) {
        evalModel = defaultModels[agentType];
    }
    
    if (!fs.existsSync(repoPath)) {
        throw new Error(`Repository path does not exist: ${repoPath}`);
    }

    if (!fs.existsSync(fixture)) {
        throw new Error(`Fixture file does not exist: ${fixture}`);
    }

    return { ...defaultConfigValues(), ...{
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
    }};
}
import { AgentTypes, defaultModels } from "../agents/factory";
import { OutputMode, parseEnum, values } from "../models";
import type { RunConfig } from "./runconfig";
import { defaultRunConfigValues } from "./default";
import { LogLevel } from "../logging";
import { existsSync } from "node:fs";
import {
    runOptionsSchema,
    type RunOptions,
    getRequiredStringOption,
    getStringOption,
    getBooleanOption,
    parseEnumOption,
} from "../options";

/**
 * Converts parsed CLI options to a validated RunConfig object.
 * Uses the runOptionsSchema as the single source of truth for defaults.
 */
export async function runConfigFromParsedOptions(options: RunOptions): Promise<RunConfig> {
    const schema = runOptionsSchema;
    const defaultConfig = defaultRunConfigValues();

    // Required string options
    const repoPath = getRequiredStringOption(options, schema, "repo");
    const fixture = getRequiredStringOption(options, schema, "fixture");
    const agentTypeStr = getRequiredStringOption(options, schema, "agent");

    // Parse iterations
    const iterationsStr = getStringOption(options, schema, "iterations");
    const iterationCount = iterationsStr
        ? parseInt(iterationsStr, 10)
        : defaultConfig.iterationCount;
    if (Number.isNaN(iterationCount)) {
        throw new Error(`Invalid iteration count: ${iterationsStr}`);
    }

    // Parse enums
    const outputModeStr = getStringOption(options, schema, "output-mode")
        ?? OutputMode[defaultConfig.outputMode];
    const logLevelStr = getStringOption(options, schema, "log-level")
        ?? LogLevel[defaultConfig.logLevel];

    const agentType = parseEnumOption(agentTypeStr, AgentTypes, "agent");

    const outputMode = parseEnum(OutputMode, outputModeStr);
    if (outputMode === undefined) {
        throw new Error(`Invalid output mode: ${outputModeStr}`);
    }

    const logLevel = parseEnum(LogLevel, logLevelStr);
    if (logLevel === undefined) {
        const validLevels = values(LogLevel).join(", ");
        throw new Error(`Invalid log level: ${logLevelStr}. Valid levels are: ${validLevels}`);
    }

    // Boolean options (use schema defaults)
    const useCache = getBooleanOption(options, schema, "use-cache");
    const stopOnError = getBooleanOption(options, schema, "stop-on-error");
    const allowFullAccess = getBooleanOption(options, schema, "allow-full-access");

    // Model options with agent-based defaults
    let model = getStringOption(options, schema, "model");
    let evalModel = getStringOption(options, schema, "eval-model");

    if (model === undefined || model === "based on --agent") {
        model = defaultModels[agentType];
    }

    if (evalModel === undefined || evalModel === "based on --agent") {
        evalModel = defaultModels[agentType];
    }

    // Validate paths exist
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

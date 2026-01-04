import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AgentTypes, defaultModels } from "../agents/factory";
import { defaultConfigValues } from "../config/default";
import type { FormValues } from "./types";
import { logger } from "../utils";

const CONFIG_DIR = join(homedir(), ".compass");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function getDefaultFormValues(): FormValues {
    const defaults = defaultConfigValues();
    const initialAgent = AgentTypes.OpenCode;
    return {
        repoPath: "",
        fixture: "",
        agentType: initialAgent,
        iterationCount: defaults.iterationCount.toString(),
        outputMode: defaults.outputMode,
        useCache: defaults.useCache,
        stopOnError: defaults.stopOnError,
        allowFullAccess: defaults.allowFullAccess,
        logLevel: defaults.logLevel,
        model: defaultModels[initialAgent],
        evalModel: defaultModels[initialAgent],
    };
}

export function loadConfig(): FormValues {
    const defaults = getDefaultFormValues();
    try {
        if (existsSync(CONFIG_FILE)) {
            const content = readFileSync(CONFIG_FILE, "utf-8");
            const saved = JSON.parse(content) as Partial<FormValues>;
            logger.debug(`Loaded config from ${CONFIG_FILE}`);
            return { ...defaults, ...saved };
        }
    } catch (e) {
        logger.warn(`Failed to load config: ${e}`);
    }
    return defaults;
}

export function saveConfig(values: FormValues): void {
    try {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        writeFileSync(CONFIG_FILE, JSON.stringify(values, null, 2), "utf-8");
        logger.debug(`Saved config to ${CONFIG_FILE}`);
    } catch (e) {
        logger.warn(`Failed to save config: ${e}`);
    }
}

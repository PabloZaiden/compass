import { useState, useCallback } from "react";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AgentTypes, defaultModels } from "../../agents/factory";
import { defaultRunConfigValues } from "../../runconfig/default";
import { logger } from "../../logging";
import type { RunConfig } from "../../runconfig/runconfig";

const CONFIG_DIR = join(homedir(), ".compass");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function getDefaultFormValues(): RunConfig {
    const defaults = defaultRunConfigValues();
    const initialAgent = AgentTypes.OpenCode;
    return {
        repoPath: "",
        fixture: "",
        agentType: initialAgent,
        iterationCount: defaults.iterationCount,
        outputMode: defaults.outputMode,
        useCache: defaults.useCache,
        stopOnError: defaults.stopOnError,
        allowFullAccess: defaults.allowFullAccess,
        logLevel: defaults.logLevel,
        model: defaultModels[initialAgent] ?? "",
        evalModel: defaultModels[initialAgent] ?? "",
    };
}

function loadConfigFromDisk(): RunConfig {
    const defaults = getDefaultFormValues();
    try {
        if (existsSync(CONFIG_FILE)) {
            const content = readFileSync(CONFIG_FILE, "utf-8");
            const saved = JSON.parse(content) as Partial<RunConfig>;
            logger.info(`Loaded config from ${CONFIG_FILE}`);
            return { ...defaults, ...saved };
        }
    } catch (e) {
        logger.warn(`Failed to load config: ${e}`);
    }
    return defaults;
}

function saveConfigToDisk(values: RunConfig): void {
    try {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        writeFileSync(CONFIG_FILE, JSON.stringify(values, null, 2), "utf-8");
        logger.info(`Saved config to ${CONFIG_FILE}`);
    } catch (e) {
        logger.warn(`Failed to save config: ${e}`);
    }
}

export interface UseConfigResult {
    values: RunConfig;
    updateValue: (key: keyof RunConfig, value: unknown) => void;
    resetToDefaults: () => void;
}

export function useConfig(): UseConfigResult {
    const [values, setValues] = useState<RunConfig>(() => {
        const config = loadConfigFromDisk();
        // Apply initial log level
        logger.settings.minLevel = config.logLevel;
        return config;
    });

    const updateValue = useCallback((key: keyof RunConfig, value: unknown) => {
        setValues((prev) => {
            const updated = { ...prev, [key]: value };

            // Auto-update model when agent changes
            if (key === "agentType") {
                const newAgent = value as AgentTypes;
                updated.model = defaultModels[newAgent] ?? "";
                updated.evalModel = defaultModels[newAgent] ?? "";
            }

            // Update log level when changed
            if (key === "logLevel") {
                logger.settings.minLevel = value as number;
            }

            // Save to disk
            saveConfigToDisk(updated);
            return updated;
        });
    }, []);

    const resetToDefaults = useCallback(() => {
        const defaults = getDefaultFormValues();
        setValues(defaults);
        saveConfigToDisk(defaults);
    }, []);

    return { values, updateValue, resetToDefaults };
}

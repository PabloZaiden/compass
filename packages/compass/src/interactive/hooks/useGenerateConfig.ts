import { useState, useCallback } from "react";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AgentTypes, defaultModels } from "../../agents/factory";
import { logger } from "../../logging";

const CONFIG_DIR = join(homedir(), ".compass");
const CONFIG_FILE = join(CONFIG_DIR, "generate-config.json");

/**
 * Configuration for fixture generation in the TUI.
 */
export interface GenerateConfig {
    /** Path to the repository to analyze */
    repoPath: string;
    /** Agent type to use for generation */
    agentType: AgentTypes;
    /** Number of prompts to generate */
    count: number;
    /** Model to use */
    model: string;
    /** Additional steering instructions */
    steering: string;
    /** Whether to use caching for agent responses */
    useCache: boolean;
}

/**
 * Field type for generate config fields.
 */
export type GenerateFieldType = "text" | "number" | "enum" | "boolean";

/**
 * Field configuration for generate config form.
 */
export interface GenerateFieldConfig {
    key: keyof GenerateConfig;
    label: string;
    type: GenerateFieldType;
}

/**
 * Field definitions for generate config - shared between form and editor.
 */
export const GenerateFieldConfigs: GenerateFieldConfig[] = [
    { key: "agentType", label: "Agent", type: "enum" },
    { key: "repoPath", label: "Repository path", type: "text" },
    { key: "count", label: "Prompt count", type: "number" },
    { key: "model", label: "Model", type: "text" },
    { key: "steering", label: "Steering instructions", type: "text" },
    { key: "useCache", label: "Use cache", type: "boolean" },
];

function getDefaultGenerateConfig(): GenerateConfig {
    const initialAgent = AgentTypes.OpenCode;
    return {
        repoPath: "",
        agentType: initialAgent,
        count: 5,
        model: defaultModels[initialAgent] ?? "",
        steering: "",
        useCache: false,
    };
}

function loadConfigFromDisk(): GenerateConfig {
    const defaults = getDefaultGenerateConfig();
    try {
        if (existsSync(CONFIG_FILE)) {
            const content = readFileSync(CONFIG_FILE, "utf-8");
            const saved = JSON.parse(content) as Partial<GenerateConfig>;
            logger.info(`Loaded generate config from ${CONFIG_FILE}`);
            return { ...defaults, ...saved };
        }
    } catch (e) {
        logger.warn(`Failed to load generate config: ${e}`);
    }
    return defaults;
}

function saveConfigToDisk(values: GenerateConfig): void {
    try {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        writeFileSync(CONFIG_FILE, JSON.stringify(values, null, 2), "utf-8");
        logger.info(`Saved generate config to ${CONFIG_FILE}`);
    } catch (e) {
        logger.warn(`Failed to save generate config: ${e}`);
    }
}

export interface UseGenerateConfigResult {
    values: GenerateConfig;
    updateValue: (key: keyof GenerateConfig, value: unknown) => void;
    resetToDefaults: () => void;
}

export function useGenerateConfig(): UseGenerateConfigResult {
    const [values, setValues] = useState<GenerateConfig>(() => {
        return loadConfigFromDisk();
    });

    const updateValue = useCallback((key: keyof GenerateConfig, value: unknown) => {
        setValues((prev) => {
            const updated = { ...prev, [key]: value };

            // Auto-update model when agent changes
            if (key === "agentType") {
                const newAgent = value as AgentTypes;
                updated.model = defaultModels[newAgent] ?? "";
            }

            // Save to disk
            saveConfigToDisk(updated);
            return updated;
        });
    }, []);

    const resetToDefaults = useCallback(() => {
        const defaults = getDefaultGenerateConfig();
        setValues(defaults);
        saveConfigToDisk(defaults);
    }, []);

    return { values, updateValue, resetToDefaults };
}

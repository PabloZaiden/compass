import { useState, useCallback, useEffect } from "react";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { logger, setDetailedLogs, LogLevel } from "../../logging";

const CONFIG_DIR = join(homedir(), ".compass");
const CONFIG_FILE = join(CONFIG_DIR, "logging-config.json");

/**
 * Configuration for logging settings in the TUI.
 */
export interface LoggingConfig {
    /** Log level (Silly, Trace, Debug, Info, Warn, Error, Fatal) */
    logLevel: LogLevel;
    /** Whether to show detailed logs with timestamp and level */
    detailedLogs: boolean;
}

/**
 * Field type for logging config fields.
 */
export type LoggingFieldType = "enum" | "boolean";

/**
 * Field configuration for logging config form.
 */
export interface LoggingFieldConfig {
    key: keyof LoggingConfig;
    label: string;
    type: LoggingFieldType;
}

/**
 * Field definitions for logging config - shared between form and editor.
 */
export const LoggingFieldConfigs: LoggingFieldConfig[] = [
    { key: "logLevel", label: "Log level", type: "enum" },
    { key: "detailedLogs", label: "Detailed logs", type: "boolean" },
];

function getDefaultLoggingConfig(): LoggingConfig {
    return {
        logLevel: LogLevel.Info,
        detailedLogs: false,
    };
}

function loadConfigFromDisk(): LoggingConfig {
    const defaults = getDefaultLoggingConfig();
    try {
        if (existsSync(CONFIG_FILE)) {
            const content = readFileSync(CONFIG_FILE, "utf-8");
            const saved = JSON.parse(content) as Partial<LoggingConfig>;
            logger.info(`Loaded logging config from ${CONFIG_FILE}`);
            return { ...defaults, ...saved };
        }
    } catch (e) {
        logger.warn(`Failed to load logging config: ${e}`);
    }
    return defaults;
}

function saveConfigToDisk(values: LoggingConfig): void {
    try {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        writeFileSync(CONFIG_FILE, JSON.stringify(values, null, 2), "utf-8");
        logger.info(`Saved logging config to ${CONFIG_FILE}`);
    } catch (e) {
        logger.warn(`Failed to save logging config: ${e}`);
    }
}

/**
 * Applies logging configuration to the global logger.
 */
export function applyLoggingConfig(config: LoggingConfig): void {
    logger.settings.minLevel = config.logLevel;
    setDetailedLogs(config.detailedLogs);
}

export interface UseLoggingConfigResult {
    values: LoggingConfig;
    updateValue: (key: keyof LoggingConfig, value: unknown) => void;
    resetToDefaults: () => void;
}

export function useLoggingConfig(): UseLoggingConfigResult {
    const [values, setValues] = useState<LoggingConfig>(() => {
        const config = loadConfigFromDisk();
        // Apply initial logging config
        applyLoggingConfig(config);
        return config;
    });

    // Apply logging config whenever values change
    useEffect(() => {
        applyLoggingConfig(values);
    }, [values]);

    const updateValue = useCallback((key: keyof LoggingConfig, value: unknown) => {
        setValues((prev) => {
            const updated = { ...prev, [key]: value };
            // Save to disk
            saveConfigToDisk(updated);
            return updated;
        });
    }, []);

    const resetToDefaults = useCallback(() => {
        const defaults = getDefaultLoggingConfig();
        setValues(defaults);
        saveConfigToDisk(defaults);
    }, []);

    return { values, updateValue, resetToDefaults };
}

import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";

/**
 * Get the directory path for storing app configuration.
 * Creates the directory if it doesn't exist.
 * 
 * @param appName - The application name
 * @returns The path to the app config directory
 */
function getAppConfigDir(appName: string): string {
    const configDir = join(homedir(), `.${appName}`);
    if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
    }
    return configDir;
}

/**
 * Get the file path for storing command parameters.
 * 
 * @param appName - The application name
 * @param commandName - The command name
 * @returns The path to the parameters file
 */
function getParametersFilePath(appName: string, commandName: string): string {
    const configDir = getAppConfigDir(appName);
    return join(configDir, `${commandName}.parameters.json`);
}

/**
 * Load persisted parameters for a command.
 * 
 * @param appName - The application name
 * @param commandName - The command name
 * @returns The persisted parameters, or an empty object if none exist
 */
export function loadPersistedParameters(
    appName: string,
    commandName: string
): Record<string, unknown> {
    try {
        const filePath = getParametersFilePath(appName, commandName);
        if (existsSync(filePath)) {
            const content = readFileSync(filePath, "utf-8");
            return JSON.parse(content) as Record<string, unknown>;
        }
    } catch (error) {
        // Silently ignore errors - just return empty object
        console.error(`Failed to load persisted parameters: ${error}`);
    }
    return {};
}

/**
 * Save parameters for a command.
 * 
 * @param appName - The application name
 * @param commandName - The command name
 * @param parameters - The parameters to persist
 */
export function savePersistedParameters(
    appName: string,
    commandName: string,
    parameters: Record<string, unknown>
): void {
    try {
        const filePath = getParametersFilePath(appName, commandName);
        writeFileSync(filePath, JSON.stringify(parameters, null, 2), "utf-8");
    } catch (error) {
        // Silently ignore errors
        console.error(`Failed to save persisted parameters: ${error}`);
    }
}

/**
 * Clear persisted parameters for a command.
 * 
 * @param appName - The application name
 * @param commandName - The command name
 */
export function clearPersistedParameters(
    appName: string,
    commandName: string
): void {
    try {
        const filePath = getParametersFilePath(appName, commandName);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
    } catch (error) {
        // Silently ignore errors
        console.error(`Failed to clear persisted parameters: ${error}`);
    }
}

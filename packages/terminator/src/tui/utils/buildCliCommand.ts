import type { OptionSchema, OptionDef, OptionValues } from "../../types/command.ts";

/**
 * Escape a shell argument if it contains special characters.
 */
function escapeArg(arg: string): string {
    if (/[^a-zA-Z0-9_\-./=]/.test(arg)) {
        return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
}

/**
 * Build a CLI command string from values and schema.
 * 
 * @param appName - The application name (e.g., "compass", "./myapp")
 * @param commandPath - The command path (e.g., ["run"], ["db", "migrate"])
 * @param schema - The option schema
 * @param values - The current option values
 * @returns CLI command string
 * 
 * @example
 * ```typescript
 * const cmd = buildCliCommand("compass", ["run"], runOptions, config);
 * // Returns: "compass run --agent opencode --fixture test.json"
 * ```
 */
export function buildCliCommand<T extends OptionSchema>(
    appName: string,
    commandPath: string[],
    schema: T,
    values: OptionValues<T>
): string {
    const parts: string[] = [appName, ...commandPath];

    for (const [key, def] of Object.entries(schema) as [keyof T & string, OptionDef][]) {
        const value = values[key];
        const defaultValue = def.default;

        // Skip if value equals default (no need to include)
        if (value === defaultValue) {
            continue;
        }

        // Skip undefined/null values
        if (value === undefined || value === null) {
            continue;
        }

        const optionName = toKebabCase(key);

        switch (def.type) {
            case "boolean":
                if (value === true) {
                    parts.push(`--${optionName}`);
                } else if (value === false && defaultValue === true) {
                    parts.push(`--no-${optionName}`);
                }
                break;

            case "array":
                if (Array.isArray(value) && value.length > 0) {
                    for (const item of value) {
                        parts.push(`--${optionName}`, escapeArg(String(item)));
                    }
                }
                break;

            case "number":
                parts.push(`--${optionName}`, String(value));
                break;

            case "string":
            default:
                if (String(value).trim() !== "") {
                    parts.push(`--${optionName}`, escapeArg(String(value)));
                }
                break;
        }
    }

    return parts.join(" ");
}

/**
 * Convert camelCase to kebab-case.
 */
function toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

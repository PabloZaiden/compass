import type { ParseArgsConfig } from "util";

/**
 * Custom error for argument validation failures.
 * Used to distinguish argument errors from other runtime errors
 * so the CLI can show help in these cases.
 */
export class ArgumentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ArgumentError";
    }
}

/**
 * Type of CLI option - maps to parseArgs types.
 */
export type OptionType = "string" | "boolean";

/**
 * Base option definition with common properties.
 */
interface BaseOptionDef {
    /** Human-readable description for help text */
    description: string;
    /** Whether this option is required */
    required?: boolean;
    /** Placeholder text for the value (e.g., "path", "name") - for string options */
    placeholder?: string;
    /** Valid values - either a string or a function returning a string */
    validValues?: string | (() => string);
    /** Default value for display in help and runtime */
    default?: unknown;
}

/**
 * String option definition.
 */
export interface StringOptionDef extends BaseOptionDef {
    type: "string";
    default?: string;
    /** Transform the CLI string value to the config value */
    parse?: (value: string) => unknown;
}

/**
 * Boolean option definition.
 */
export interface BooleanOptionDef extends BaseOptionDef {
    type: "boolean";
    default?: boolean;
}

/**
 * Union type for all option definitions.
 */
export type OptionDef = StringOptionDef | BooleanOptionDef;

/**
 * Schema defining all options for a mode.
 * Keys are CLI option names (e.g., "repo", "use-cache").
 */
export type OptionSchema = Record<string, OptionDef>;

/**
 * Extract the parsed CLI options type from an option schema.
 * String options become `string | undefined`, boolean options become `boolean | undefined`.
 */
export type ParsedOptions<T extends OptionSchema> = {
    [K in keyof T]?: T[K]["type"] extends "string" ? string : boolean;
};

/**
 * Converts an OptionSchema to the parseArgs options format.
 */
export function toParseArgsOptions(schema: OptionSchema): ParseArgsConfig["options"] {
    const result: ParseArgsConfig["options"] = {};
    for (const [name, def] of Object.entries(schema)) {
        result[name] = { type: def.type };
    }
    return result;
}

/**
 * Converts an OptionSchema to the option descriptions format for help.
 */
export function toOptionDescriptions(schema: OptionSchema): Record<string, OptionDescription> {
    const result: Record<string, OptionDescription> = {};
    for (const [name, def] of Object.entries(schema)) {
        const desc: OptionDescription = {
            description: def.description + (def.required ? " (required)" : ""),
        };
        if (def.type === "string" && def.placeholder) {
            desc.placeholder = def.placeholder;
        }
        if (def.validValues) {
            desc.validValues = def.validValues;
        }
        if (def.default !== undefined) {
            desc.default = String(def.default);
        }
        result[name] = desc;
    }
    return result;
}

/**
 * Description of a single option for help text generation.
 * (Derived format used by help system)
 */
export interface OptionDescription {
    description: string;
    placeholder?: string;
    validValues?: string | (() => string);
    default?: string;
}

/**
 * Gets a string option value from parsed options.
 */
export function getStringOption<T extends OptionSchema>(
    options: ParsedOptions<T>,
    schema: T,
    name: keyof T & string,
): string | undefined {
    const value = options[name];
    if (typeof value === "string") {
        return value;
    }
    const def = schema[name];
    if (def?.type === "string" && def.default !== undefined) {
        return def.default;
    }
    return undefined;
}

/**
 * Gets a required string option value from parsed options.
 * Throws if the value is not provided.
 */
export function getRequiredStringOption<T extends OptionSchema>(
    options: ParsedOptions<T>,
    schema: T,
    name: keyof T & string,
): string {
    const value = getStringOption(options, schema, name);
    if (value === undefined) {
        throw new ArgumentError(`Missing required argument: --${name}`);
    }
    return value;
}

/**
 * Gets a boolean option value from parsed options.
 */
export function getBooleanOption<T extends OptionSchema>(
    options: ParsedOptions<T>,
    schema: T,
    name: keyof T & string,
): boolean {
    const value = options[name];
    if (typeof value === "boolean") {
        return value;
    }
    const def = schema[name];
    if (def?.type === "boolean" && def.default !== undefined) {
        return def.default;
    }
    return false;
}

/**
 * Parses and validates an enum option value.
 */
export function parseEnumOption<E extends object>(
    value: string | undefined,
    enumObj: E,
    optionName: string,
    defaultValue?: E[keyof E],
): E[keyof E] {
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new ArgumentError(`Missing required argument: --${optionName}`);
    }

    // Find matching enum value by name (case-insensitive)
    const lowerValue = value.toLowerCase();
    for (const key of Object.keys(enumObj)) {
        if (key.toLowerCase() === lowerValue) {
            const enumValue = (enumObj as Record<string, unknown>)[key];
            // For numeric enums, the key might be the string representation of the number
            if (typeof enumValue === "number") {
                return enumValue as E[keyof E];
            }
            // For string enums
            if (typeof enumValue === "string") {
                return enumValue as E[keyof E];
            }
        }
    }

    // Get valid values for error message
    const validValues = Object.keys(enumObj)
        .filter((k) => isNaN(Number(k)))
        .join(", ");
    throw new Error(`Invalid ${optionName}: ${value}. Valid values are: ${validValues}`);
}

import type { OptionSchema, OptionDef } from "../../types/command.ts";
import type { FieldConfig, FieldType, FieldOption } from "../components/types.ts";

/**
 * Convert an option type to a field type.
 */
function optionTypeToFieldType(def: OptionDef): FieldType {
    // If it has enum values, it's an enum type
    if (def.enum && def.enum.length > 0) {
        return "enum";
    }

    switch (def.type) {
        case "string":
            return "text";
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        case "array":
            return "text"; // Arrays are edited as comma-separated text
        default:
            return "text";
    }
}

/**
 * Create field options from enum values.
 */
function createFieldOptions(def: OptionDef): FieldOption[] | undefined {
    if (!def.enum || def.enum.length === 0) {
        return undefined;
    }

    return def.enum.map((value) => ({
        name: String(value),
        value,
    }));
}

/**
 * Create a label from a key name.
 * Converts camelCase to Title Case.
 */
function keyToLabel(key: string): string {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

/**
 * Convert an option schema to field configs for TUI forms.
 * 
 * @param schema - The option schema to convert
 * @returns Array of field configs sorted by order
 * 
 * @example
 * ```typescript
 * const fields = schemaToFieldConfigs(myOptions);
 * // Returns FieldConfig[] ready for ConfigForm
 * ```
 */
export function schemaToFieldConfigs(schema: OptionSchema): FieldConfig[] {
    const fields: FieldConfig[] = [];

    for (const [key, def] of Object.entries(schema)) {
        // Skip hidden fields
        if (def.tuiHidden) {
            continue;
        }

        const fieldConfig: FieldConfig = {
            key,
            label: def.label ?? keyToLabel(key),
            type: optionTypeToFieldType(def),
            options: createFieldOptions(def),
            placeholder: def.placeholder,
            group: def.group,
        };

        fields.push(fieldConfig);
    }

    // Sort by order if specified, otherwise preserve insertion order
    fields.sort((a, b) => {
        const orderA = schema[a.key]?.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = schema[b.key]?.order ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
    });

    return fields;
}

/**
 * Group field configs by their group property.
 * 
 * @param fields - Field configs to group
 * @returns Map of group name to field configs
 */
export function groupFieldConfigs(
    fields: FieldConfig[]
): Map<string | undefined, FieldConfig[]> {
    const groups = new Map<string | undefined, FieldConfig[]>();

    for (const field of fields) {
        const group = field.group;
        if (!groups.has(group)) {
            groups.set(group, []);
        }
        groups.get(group)!.push(field);
    }

    return groups;
}

/**
 * Get display value for a field.
 * 
 * @param value - The field value
 * @param fieldConfig - The field configuration
 * @returns Formatted display string
 */
export function getFieldDisplayValue(
    value: unknown,
    fieldConfig: FieldConfig
): string {
    if (fieldConfig.type === "boolean") {
        return value ? "True" : "False";
    }

    if (fieldConfig.type === "enum" && fieldConfig.options) {
        const option = fieldConfig.options.find((o) => o.value === value);
        return option?.name ?? String(value);
    }

    const strValue = String(value ?? "");
    if (strValue === "") {
        return "(empty)";
    }

    // Truncate long values
    return strValue.length > 60 ? strValue.substring(0, 57) + "..." : strValue;
}

/**
 * Field type for TUI forms.
 */
export type FieldType = "text" | "number" | "enum" | "boolean";

/**
 * Option for enum/select fields.
 */
export interface FieldOption {
    name: string;
    value: unknown;
}

/**
 * Field configuration for TUI forms.
 */
export interface FieldConfig {
    /** Field key (must match a key in values) */
    key: string;
    /** Display label */
    label: string;
    /** Field type */
    type: FieldType;
    /** Options for enum type */
    options?: FieldOption[];
    /** Placeholder text for input fields */
    placeholder?: string;
    /** Group name for organizing fields */
    group?: string;
}

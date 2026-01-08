import { Theme } from "../theme.ts";

interface FieldRowProps {
    /** Field label */
    label: string;
    /** Field value to display */
    value: string;
    /** Whether this row is selected */
    isSelected: boolean;
}

/**
 * A single row in a config form displaying a field label and value.
 */
export function FieldRow({ label, value, isSelected }: FieldRowProps) {
    const prefix = isSelected ? "► " : "  ";
    const labelColor = isSelected ? Theme.borderFocused : Theme.label;
    const valueColor = isSelected ? Theme.value : Theme.statusText;

    return (
        <box flexDirection="row" gap={1}>
            <text fg={labelColor}>
                {prefix}{label}:
            </text>
            <text fg={valueColor}>
                {value}
            </text>
        </box>
    );
}

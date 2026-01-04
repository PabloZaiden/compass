import { THEME } from "../types";

interface FieldRowProps {
    label: string;
    value: string;
    isSelected: boolean;
}

export function FieldRow({ label, value, isSelected }: FieldRowProps) {
    // Ink-style selection: cyan background when selected, arrow indicator
    const prefix = isSelected ? "► " : "  ";
    
    if (isSelected) {
        return (
            <box
                flexDirection="row"
                paddingLeft={1}
                paddingRight={1}
            >
                <text fg="#000000" bg="cyan">
                    {prefix}{label}: <span fg="#000000">{value}</span>
                </text>
            </box>
        );
    }

    return (
        <box
            flexDirection="row"
            paddingLeft={1}
            paddingRight={1}
        >
            <text fg={THEME.label}>
                {prefix}{label}: <span fg={THEME.value}>{value}</span>
            </text>
        </box>
    );
}

import { Theme } from "../theme.ts";

interface ActionButtonProps {
    /** Button label */
    label: string;
    /** Whether this button is selected */
    isSelected: boolean;
    /** Optional spinner frame for loading state */
    spinnerFrame?: string;
}

/**
 * Action button displayed at the bottom of a config form.
 */
export function ActionButton({ label, isSelected, spinnerFrame }: ActionButtonProps) {
    const prefix = isSelected ? "► " : "  ";
    const displayLabel = spinnerFrame ? `${spinnerFrame} ${label}...` : `[ ${label} ]`;
    
    if (isSelected) {
        return (
            <box marginTop={1}>
                <text fg="#000000" bg={Theme.actionButton}>
                    {prefix}{displayLabel}
                </text>
            </box>
        );
    }

    return (
        <box marginTop={1}>
            <text fg={Theme.actionButton}>
                {prefix}{displayLabel}
            </text>
        </box>
    );
}

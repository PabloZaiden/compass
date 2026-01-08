import { Theme } from "../theme.ts";

interface StatusBarProps {
    /** Status message to display */
    message: string;
    /** Keyboard shortcuts to show */
    shortcuts?: string;
}

/**
 * Status bar showing current status and keyboard shortcuts.
 */
export function StatusBar({ message, shortcuts }: StatusBarProps) {
    return (
        <box flexDirection="row" justifyContent="space-between" marginTop={1}>
            <text fg={Theme.statusText}>
                {message}
            </text>
            {shortcuts && (
                <text fg={Theme.label}>
                    {shortcuts}
                </text>
            )}
        </box>
    );
}

import { Theme } from "../theme.ts";
import { useSpinner } from "../hooks/useSpinner.ts";

interface StatusBarProps {
    /** Status message to display */
    status: string;
    /** Whether the app is currently running a command */
    isRunning?: boolean;
    /** Whether to show keyboard shortcuts */
    showShortcuts?: boolean;
    /** Custom shortcuts string (defaults to standard shortcuts) */
    shortcuts?: string;
}

/**
 * Status bar showing current status, spinner, and keyboard shortcuts.
 */
export function StatusBar({ 
    status, 
    isRunning = false, 
    showShortcuts = true,
    shortcuts = "L Logs • C CLI • Tab Switch • Ctrl+Y Copy • Esc Back"
}: StatusBarProps) {
    const { frame } = useSpinner(isRunning);
    const spinner = isRunning ? `${frame} ` : "";
    
    return (
        <box
            flexDirection="column"
            gap={0}
            border={true}
            borderStyle="rounded"
            borderColor={isRunning ? "#4ade80" : Theme.border}
            flexShrink={0}
        >
            {/* Main status with spinner */}
            <box
                flexDirection="row"
                justifyContent="space-between"
                backgroundColor={isRunning ? "#1a1a2e" : undefined}
                paddingLeft={1}
                paddingRight={1}
            >
                <text fg={isRunning ? "#4ade80" : Theme.statusText}>
                    {isRunning ? <strong>{spinner}{status}</strong> : <>{spinner}{status}</>}
                </text>
            </box>
            
            {/* Keyboard shortcuts */}
            {showShortcuts && (
                <box paddingLeft={1} paddingRight={1}>
                    <text fg={Theme.label}>
                        {shortcuts}
                    </text>
                </box>
            )}
        </box>
    );
}

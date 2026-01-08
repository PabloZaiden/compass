import { Theme } from "../theme.ts";

const SpinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface StatusBarProps {
    /** Status message to display */
    status: string;
    /** Whether the app is currently running a command */
    isRunning?: boolean;
    /** Current spinner frame index (for animation) */
    spinnerFrame?: number;
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
    spinnerFrame = 0, 
    showShortcuts = true,
    shortcuts = "Ctrl+L toggle logs • Ctrl+F CLI flags • Tab switch panels • Ctrl+Y copy • Esc back/exit"
}: StatusBarProps) {
    const spinner = isRunning ? `${SpinnerFrames[spinnerFrame % SpinnerFrames.length] ?? SpinnerFrames[0]} ` : "";
    
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

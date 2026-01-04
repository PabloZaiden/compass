import { Theme } from "../types";

const SpinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface StatusBarProps {
    status: string;
    isRunning: boolean;
    spinnerFrame: number;
    showShortcuts?: boolean;
}

export function StatusBar({ status, isRunning, spinnerFrame, showShortcuts = true }: StatusBarProps) {
    const spinner = isRunning ? `${SpinnerFrames[spinnerFrame % SpinnerFrames.length] ?? SpinnerFrames[0]} ` : "";
    
    const shortcuts = "Ctrl+F CLI flags • Ctrl+L logs • Ctrl+Y copy • Tab switch panels • q/Esc quit";
    
    return (
        <box
            flexDirection="column"
            gap={0}
            border={true}
            borderStyle="rounded"
            borderColor={isRunning ? "#4ade80" : Theme.border}
            height={showShortcuts ? 4 : 3}
            flexShrink={0}
        >
            {/* Main status with spinner */}
            <box
                flexDirection="row"
                justifyContent="space-between"
                backgroundColor={isRunning ? "#1a3a1a" : undefined}
                padding={1}
            >
                <text fg={isRunning ? "#4ade80" : Theme.statusText}>
                    {isRunning ? <strong>{spinner}{status}</strong> : <>{spinner}{status}</>}
                </text>
            </box>
            
            {/* Keyboard shortcuts */}
            {showShortcuts && (
                <box padding={1}>
                    <text fg={Theme.label}>
                        {shortcuts}
                    </text>
                </box>
            )}
        </box>
    );
}

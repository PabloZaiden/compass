import { THEME } from "../types";

interface CliOverlayProps {
    command: string;
    visible: boolean;
}

export function CliOverlay({ command, visible }: CliOverlayProps) {
    if (!visible) {
        return null;
    }

    return (
        <box
            position="absolute"
            top={2}
            left={4}
            width="70%"
            height="40%"
            backgroundColor={THEME.overlay}
            border={true}
            borderStyle="rounded"
            borderColor={THEME.overlayTitle}
            padding={1}
            flexDirection="column"
            gap={1}
            zIndex={10}
        >
            <text fg={THEME.overlayTitle}>
                <strong>CLI flags (Ctrl+F or Esc to close)</strong>
            </text>
            
            <text fg={THEME.statusText}>
                {command}
            </text>
            
            <text fg={THEME.label}>
                Press Ctrl+Y to copy to clipboard
            </text>
        </box>
    );
}

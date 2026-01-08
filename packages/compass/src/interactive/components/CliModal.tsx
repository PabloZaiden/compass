import { Theme } from "../utils";
import { useKeyboardHandler, KeyboardPriority } from "../hooks";

interface CliModalProps {
    command: string;
    visible: boolean;
    onClose: () => void;
    onCopy: (content: string, label: string) => void;
}

export function CliModal({ command, visible, onClose, onCopy }: CliModalProps) {
    // Modal keyboard handler - blocks all keys from bubbling
    useKeyboardHandler(
        (event) => {
            const { key } = event;
            // Escape to close
            if (key.name === "escape") {
                onClose();
                return;
            }

            // Ctrl+Y to copy CLI command
            if ((key.ctrl && key.name === "y") || key.sequence === "\x19") {
                onCopy(command, "CLI command");
                return;
            }
            // All other keys blocked from bubbling via modal option
        },
        KeyboardPriority.Modal,
        { enabled: visible, modal: true }
    );

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
            backgroundColor={Theme.overlay}
            border={true}
            borderStyle="rounded"
            borderColor={Theme.overlayTitle}
            padding={1}
            flexDirection="column"
            gap={1}
            zIndex={10}
        >
            <text fg={Theme.overlayTitle}>
                <strong>CLI Command (Esc to close)</strong>
            </text>
            
            <text fg={Theme.statusText}>
                {command}
            </text>
            
            <text fg={Theme.label}>
                Press Ctrl+Y to copy to clipboard
            </text>
        </box>
    );
}

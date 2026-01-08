import { Theme } from "../theme.ts";
import { useKeyboardHandler, KeyboardPriority } from "../hooks/useKeyboardHandler.ts";

interface CliModalProps {
    /** CLI command to display */
    command: string;
    /** Whether the modal is visible */
    visible: boolean;
    /** Called when the modal should close */
    onClose: () => void;
    /** Called when the command should be copied */
    onCopy?: (content: string, label: string) => void;
}

/**
 * Modal displaying the CLI command equivalent of the current config.
 */
export function CliModal({
    command,
    visible,
    onClose,
    onCopy,
}: CliModalProps) {
    // Modal keyboard handler
    useKeyboardHandler(
        (event) => {
            const { key } = event;
            
            if (key.name === "escape" || key.name === "return" || key.name === "enter") {
                onClose();
                event.stopPropagation();
                return;
            }

            // Y to copy
            if (key.name === "y") {
                onCopy?.(command, "CLI command");
                event.stopPropagation();
                return;
            }
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
            top={4}
            left={4}
            width="80%"
            height={10}
            backgroundColor={Theme.overlay}
            border={true}
            borderStyle="rounded"
            borderColor={Theme.overlayTitle}
            padding={1}
            flexDirection="column"
            gap={1}
            zIndex={20}
        >
            <text fg={Theme.overlayTitle}>
                <strong>CLI Command</strong>
            </text>

            <scrollbox scrollX={true} height={3}>
                <text fg={Theme.value}>
                    {command}
                </text>
            </scrollbox>

            <text fg={Theme.statusText}>
                Ctrl+Y to copy • Enter or Esc to close
            </text>
        </box>
    );
}

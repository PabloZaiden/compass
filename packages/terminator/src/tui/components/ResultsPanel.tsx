import type { ReactNode } from "react";
import { Theme } from "../theme.ts";
import { useKeyboardHandler, KeyboardPriority } from "../hooks/useKeyboardHandler.ts";
import type { CommandResult } from "../../core/command.ts";

interface ResultsPanelProps {
    /** The result to display */
    result: CommandResult | null;
    /** Error to display (if any) */
    error: Error | null;
    /** Whether the panel is focused */
    focused: boolean;
    /** Custom result renderer */
    renderResult?: (result: CommandResult) => ReactNode;
    /** Called when content should be copied */
    onCopy?: (content: string, label: string) => void;
}

/**
 * Panel displaying command execution results.
 */
export function ResultsPanel({
    result,
    error,
    focused,
    renderResult,
    onCopy,
}: ResultsPanelProps) {
    // Handle keyboard events at Focused priority (only when focused)
    useKeyboardHandler(
        (event) => {
            const { key } = event;
            // Ctrl+Y to copy results
            if ((key.ctrl && key.name === "y") || key.sequence === "\x19") {
                if (onCopy) {
                    if (error) {
                        onCopy(error.message, "Error");
                    } else if (result) {
                        onCopy(JSON.stringify(result.data ?? result, null, 2), "Results");
                    }
                }
                event.stopPropagation();
                return;
            }
        },
        KeyboardPriority.Focused,
        { enabled: focused }
    );

    const borderColor = focused ? Theme.borderFocused : Theme.border;

    // Determine content to display
    let content: ReactNode;

    if (error) {
        content = (
            <box flexDirection="column" gap={1}>
                <text fg={Theme.error}>
                    <strong>Error</strong>
                </text>
                <text fg={Theme.error}>
                    {error.message}
                </text>
            </box>
        );
    } else if (result) {
        if (renderResult) {
            content = renderResult(result) as ReactNode;
        } else {
            // Default JSON display
            content = (
                <box flexDirection="column" gap={1}>
                    {result.message && (
                        <text fg={result.success ? Theme.success : Theme.error}>
                            {result.message}
                        </text>
                    )}
                    {result.data !== undefined && result.data !== null && (
                        <text fg={Theme.value}>
                            {JSON.stringify(result.data, null, 2)}
                        </text>
                    )}
                </box>
            );
        }
    } else {
        content = (
            <text fg={Theme.label}>No results yet...</text>
        );
    }

    return (
        <box
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title="Results"
            padding={1}
            flexGrow={1}
        >
            <scrollbox scrollY={true} flexGrow={1} focused={focused}>
                {content}
            </scrollbox>
        </box>
    );
}

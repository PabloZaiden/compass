import type { ReactNode } from "react";
import { Theme } from "../theme.ts";
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
}

/**
 * Panel displaying command execution results.
 */
export function ResultsPanel({
    result,
    error,
    focused,
    renderResult,
}: ResultsPanelProps) {
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
            const customContent = renderResult(result);

            if (typeof customContent === "string" || typeof customContent === "number" || typeof customContent === "boolean") {
                // Wrap primitive results so the renderer gets a text node
                content = (
                    <text fg={Theme.value}>
                        {String(customContent)}
                    </text>
                );
            } else {
                content = customContent as ReactNode;
            }
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

import { useRef, useEffect, type ReactNode } from "react";
import type { ScrollBoxRenderable } from "@opentui/core";
import { Theme } from "../theme.ts";
import { FieldRow } from "./FieldRow.tsx";
import { useKeyboardHandler, KeyboardPriority } from "../hooks/useKeyboardHandler.ts";
import type { FieldConfig } from "./types.ts";

interface ConfigFormProps {
    /** Title for the form border */
    title: string;
    /** Field configurations */
    fieldConfigs: FieldConfig[];
    /** Current values */
    values: Record<string, unknown>;
    /** Currently selected index */
    selectedIndex: number;
    /** Whether the form is focused */
    focused: boolean;
    /** Called when selection changes */
    onSelectionChange: (index: number) => void;
    /** Called when a field should be edited */
    onEditField: (fieldKey: string) => void;
    /** Called when the action button is pressed */
    onAction: () => void;
    /** Function to get display value for a field */
    getDisplayValue?: (key: string, value: unknown, type: string) => string;
    /** The action button component */
    actionButton: ReactNode;
}

/**
 * Default display value formatter.
 */
function defaultGetDisplayValue(_key: string, value: unknown, type: string): string {
    if (type === "boolean") {
        return value ? "True" : "False";
    }
    const strValue = String(value ?? "");
    if (strValue === "") {
        return "(empty)";
    }
    return strValue.length > 60 ? strValue.substring(0, 57) + "..." : strValue;
}

/**
 * Generic config form that renders fields from a schema.
 */
export function ConfigForm({
    title,
    fieldConfigs,
    values,
    selectedIndex,
    focused,
    onSelectionChange,
    onEditField,
    onAction,
    getDisplayValue = defaultGetDisplayValue,
    actionButton,
}: ConfigFormProps) {
    const borderColor = focused ? Theme.borderFocused : Theme.border;
    const scrollboxRef = useRef<ScrollBoxRenderable>(null);
    const totalFields = fieldConfigs.length + 1; // +1 for action button

    // Auto-scroll to keep selected item visible
    useEffect(() => {
        if (scrollboxRef.current) {
            scrollboxRef.current.scrollTo(selectedIndex);
        }
    }, [selectedIndex]);

    // Handle keyboard events at Focused priority (only when focused)
    useKeyboardHandler(
        (event) => {
            const { key } = event;

            // Arrow key navigation
            if (key.name === "down") {
                const newIndex = Math.min(selectedIndex + 1, totalFields - 1);
                onSelectionChange(newIndex);
                event.stopPropagation();
                return;
            }

            if (key.name === "up") {
                const newIndex = Math.max(selectedIndex - 1, 0);
                onSelectionChange(newIndex);
                event.stopPropagation();
                return;
            }

            // Enter to edit field or run action
            if (key.name === "return" || key.name === "enter") {
                if (selectedIndex === fieldConfigs.length) {
                    onAction();
                } else {
                    const fieldConfig = fieldConfigs[selectedIndex];
                    if (fieldConfig) {
                        onEditField(fieldConfig.key);
                    }
                }
                event.stopPropagation();
                return;
            }
        },
        KeyboardPriority.Focused,
        { enabled: focused }
    );

    return (
        <box
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title={title}
            flexGrow={1}
            padding={1}
        >
            <scrollbox
                ref={scrollboxRef}
                scrollY={true}
                flexGrow={1}
            >
                <box flexDirection="column" gap={0}>
                    {fieldConfigs.map((field, idx) => {
                        const isSelected = idx === selectedIndex;
                        const displayValue = getDisplayValue(
                            field.key,
                            values[field.key],
                            field.type
                        );

                        return (
                            <FieldRow
                                key={field.key}
                                label={field.label}
                                value={displayValue}
                                isSelected={isSelected}
                            />
                        );
                    })}

                    {actionButton}
                </box>
            </scrollbox>
        </box>
    );
}

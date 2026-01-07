import { useRef, useEffect, type ReactNode } from "react";
import type { ScrollBoxRenderable } from "@opentui/core";
import { Theme } from "../utils";
import { FieldRow } from "./FieldRow";
import { useKeyboardHandler, KeyboardPriority } from "../hooks";

/**
 * Field configuration for any config form.
 */
export interface FieldConfig<K extends string> {
    key: K;
    label: string;
    type: "text" | "number" | "enum" | "boolean";
}

interface ConfigFormProps<K extends string, V extends Record<K, unknown>> {
    /** Title for the form border */
    title: string;
    /** Field configurations */
    fieldConfigs: FieldConfig<K>[];
    /** Current values */
    values: V;
    /** Currently selected index */
    selectedIndex: number;
    /** Whether the form is focused */
    focused: boolean;
    /** Called when selection changes */
    onSelectionChange: (index: number) => void;
    /** Called when a field should be edited */
    onEditField: (fieldKey: K) => void;
    /** Called when the action button is pressed */
    onAction: () => void;
    /** Called to copy content */
    onCopy: (content: string, label: string) => void;
    /** Function to get display value for a field */
    getDisplayValue: (key: K, value: unknown, type: string) => string;
    /** Label for the copy notification */
    copyLabel: string;
    /** The action button component */
    actionButton: ReactNode;
}

export function ConfigForm<K extends string, V extends Record<K, unknown>>({
    title,
    fieldConfigs,
    values,
    selectedIndex,
    focused,
    onSelectionChange,
    onEditField,
    onAction,
    onCopy,
    getDisplayValue,
    copyLabel,
    actionButton,
}: ConfigFormProps<K, V>) {
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
            // Ctrl+Y to copy config JSON
            if ((key.ctrl && key.name === "y") || key.sequence === "\x19") {
                onCopy(JSON.stringify(values, null, 2), copyLabel);
                event.stopPropagation();
                return;
            }

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

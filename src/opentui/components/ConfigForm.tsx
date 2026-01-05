import { useRef, useEffect } from "react";
import type { ScrollBoxRenderable } from "@opentui/core";
import type { Config } from "../../config/config";
import { Theme } from "../utils";
import { FieldConfigs, getDisplayValue } from "../utils";
import { FieldRow } from "./FieldRow";
import { RunButton } from "./RunButton";
import { useKeyboardHandler, KeyboardPriority } from "../hooks";

interface ConfigFormProps {
    values: Config;
    selectedIndex: number;
    focused: boolean;
    onSelectionChange: (index: number) => void;
    onEditField: (fieldKey: keyof Config) => void;
    onRun: () => void;
    totalFields: number;
    onCopy: (content: string, label: string) => void;
}

export function ConfigForm({
    values,
    selectedIndex,
    focused,
    onSelectionChange,
    onEditField,
    onRun,
    totalFields,
    onCopy,
}: ConfigFormProps) {
    const borderColor = focused ? Theme.borderFocused : Theme.border;
    const scrollboxRef = useRef<ScrollBoxRenderable>(null);

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
                onCopy(JSON.stringify(values, null, 2), "Config JSON");
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

            // Enter to edit field or run
            if (key.name === "return" || key.name === "enter") {
                if (selectedIndex === FieldConfigs.length) {
                    onRun();
                } else {
                    const fieldConfig = FieldConfigs[selectedIndex];
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
            title="Configuration"
            flexGrow={1}
            padding={1}
        >
            <scrollbox
                ref={scrollboxRef}
                scrollY={true}
                flexGrow={1}
            >
                <box flexDirection="column" gap={0}>
                    {FieldConfigs.map((field, idx) => {
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
                    
                    <RunButton isSelected={selectedIndex === FieldConfigs.length} />
                </box>
            </scrollbox>
        </box>
    );
}

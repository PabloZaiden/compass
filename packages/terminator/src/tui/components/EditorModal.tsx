import { useState, useEffect } from "react";
import type { SelectOption } from "@opentui/core";
import { Theme } from "../theme.ts";
import { useKeyboardHandler, KeyboardPriority } from "../hooks/useKeyboardHandler.ts";
import type { FieldConfig } from "./types.ts";

interface EditorModalProps {
    /** The key of the field being edited */
    fieldKey: string | null;
    /** The current value of the field */
    currentValue: unknown;
    /** Whether the modal is visible */
    visible: boolean;
    /** Called when the user submits a new value */
    onSubmit: (value: unknown) => void;
    /** Called when the user cancels editing */
    onCancel: () => void;
    /** Field configurations */
    fieldConfigs: FieldConfig[];
}

/**
 * Modal for editing field values.
 * Supports text, number, enum, and boolean types.
 */
export function EditorModal({
    fieldKey,
    currentValue,
    visible,
    onSubmit,
    onCancel,
    fieldConfigs,
}: EditorModalProps) {
    const [inputValue, setInputValue] = useState("");
    const [selectIndex, setSelectIndex] = useState(0);

    // Reset state when field changes
    useEffect(() => {
        if (fieldKey && visible) {
            setInputValue(String(currentValue ?? ""));

            // For enums, find current index
            const fieldConfig = fieldConfigs.find((f) => f.key === fieldKey);
            if (fieldConfig?.options) {
                const idx = fieldConfig.options.findIndex((o) => o.value === currentValue);
                setSelectIndex(idx >= 0 ? idx : 0);
            }
        }
    }, [fieldKey, currentValue, visible, fieldConfigs]);

    // Modal keyboard handler - blocks all keys from bubbling out of the modal
    useKeyboardHandler(
        (event) => {
            if (event.key.name === "escape") {
                onCancel();
            }
        },
        KeyboardPriority.Modal,
        { enabled: visible, modal: true }
    );

    if (!visible || !fieldKey) {
        return null;
    }

    const fieldConfig = fieldConfigs.find((f) => f.key === fieldKey);
    if (!fieldConfig) {
        return null;
    }

    const isEnum = fieldConfig.type === "enum" && fieldConfig.options;
    const isBoolean = fieldConfig.type === "boolean";
    const isNumber = fieldConfig.type === "number";

    const handleInputSubmit = (value: string) => {
        if (isNumber) {
            onSubmit(parseInt(value.replace(/[^0-9-]/g, ""), 10) || 0);
        } else {
            onSubmit(value);
        }
    };

    const handleSelectIndexChange = (index: number, _option: SelectOption | null) => {
        setSelectIndex(index);
    };

    const handleSelectSubmit = (_index: number, option: SelectOption | null) => {
        if (option) {
            onSubmit(option.value);
        }
    };

    const handleBooleanSubmit = (_index: number, option: SelectOption | null) => {
        if (option) {
            onSubmit(option.value === true);
        }
    };

    // Boolean uses select with True/False options
    const booleanOptions: SelectOption[] = [
        { name: "False", description: "", value: false },
        { name: "True", description: "", value: true },
    ];

    return (
        <box
            position="absolute"
            top={4}
            left={6}
            width="60%"
            height={12}
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
                <strong>Edit: {fieldConfig.label}</strong>
            </text>

            {isEnum && fieldConfig.options && (
                <select
                    options={fieldConfig.options.map((o) => ({
                        name: o.name,
                        value: o.value,
                        description: "",
                    }))}
                    selectedIndex={selectIndex}
                    focused={true}
                    onChange={handleSelectIndexChange}
                    onSelect={handleSelectSubmit}
                    showScrollIndicator={true}
                    showDescription={false}
                    height={6}
                    width="100%"
                    wrapSelection={true}
                    selectedBackgroundColor="#61afef"
                    selectedTextColor="#1e2127"
                />
            )}

            {isBoolean && (
                <select
                    options={booleanOptions}
                    selectedIndex={currentValue ? 1 : 0}
                    focused={true}
                    onSelect={handleBooleanSubmit}
                    showScrollIndicator={false}
                    showDescription={false}
                    height={2}
                    width="100%"
                    wrapSelection={true}
                    selectedBackgroundColor="#61afef"
                    selectedTextColor="#1e2127"
                />
            )}

            {!isEnum && !isBoolean && (
                <input
                    value={inputValue}
                    placeholder={fieldConfig.placeholder ?? `Enter ${fieldConfig.label.toLowerCase()}...`}
                    focused={true}
                    onInput={(value) => setInputValue(value)}
                    onSubmit={handleInputSubmit}
                />
            )}

            <text fg={Theme.statusText}>
                Enter to save, Esc to cancel
            </text>
        </box>
    );
}

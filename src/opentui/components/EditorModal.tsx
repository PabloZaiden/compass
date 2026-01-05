import { useState, useEffect } from "react";
import type { SelectOption } from "@opentui/core";
import type { Config } from "../../config/config";
import { Theme } from "../utils";
import { FieldConfigs, getFieldOptions } from "../utils";
import { useKeyboardHandler, KeyboardPriority } from "../hooks";

interface EditorModalProps {
    fieldKey: keyof Config | null;
    currentValue: unknown;
    visible: boolean;
    onSubmit: (value: unknown) => void;
    onCancel: () => void;
}

export function EditorModal({
    fieldKey,
    currentValue,
    visible,
    onSubmit,
    onCancel,
}: EditorModalProps) {
    const [inputValue, setInputValue] = useState("");
    const [selectIndex, setSelectIndex] = useState(0);

    // Reset state when field changes
    useEffect(() => {
        if (fieldKey && visible) {
            setInputValue(String(currentValue ?? ""));
            
            // For enums, find current index
            const options = getFieldOptions(fieldKey);
            if (options) {
                const idx = options.findIndex((o) => o.value === currentValue);
                setSelectIndex(idx >= 0 ? idx : 0);
            }
        }
    }, [fieldKey, currentValue, visible]);

    // Modal keyboard handler - blocks all keys from bubbling out of the modal
    // OpenTUI's <input> and <select> handle their own keys internally, but we intercept some first.
    useKeyboardHandler(
        (event) => {
            // Intercept Escape at modal priority to close the modal before input/select can handle it.
            if (event.key.name === "escape") {
                onCancel();
            }
            // All other keys: let OpenTUI primitives handle them; bubbling is still blocked via the modal option.
        },
        KeyboardPriority.Modal,
        { enabled: visible, modal: true }
    );

    if (!visible || !fieldKey) {
        return null;
    }

    const fieldConfig = FieldConfigs.find((f) => f.key === fieldKey);
    if (!fieldConfig) {
        return null;
    }

    const options = getFieldOptions(fieldKey);
    const isEnum = fieldConfig.type === "enum" && options;
    const isBoolean = fieldConfig.type === "boolean";
    const isNumber = fieldConfig.type === "number";

    const handleInputSubmit = (value: string) => {
        if (isNumber) {
            onSubmit(parseInt(value.replace(/[^0-9]/g, ""), 10) || 1);
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

    // Convert field options to SelectOption format
    const selectOptions: SelectOption[] = options 
        ? options.map((o) => ({ name: o.name, description: "", value: o.value }))
        : [];

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

            {isEnum && (
                <select
                    options={selectOptions}
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
                    placeholder={`Enter ${fieldConfig.label.toLowerCase()}...`}
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

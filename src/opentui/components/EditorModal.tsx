import { useState, useEffect } from "react";
import type { SelectOption } from "@opentui/core";
import type { FormValues } from "../types";
import { THEME } from "../types";
import { FIELD_CONFIGS, getFieldOptions } from "../utils";

interface EditorModalProps {
    fieldKey: keyof FormValues | null;
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
    onCancel: _onCancel,
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

    if (!visible || !fieldKey) {
        return null;
    }

    const fieldConfig = FIELD_CONFIGS.find((f) => f.key === fieldKey);
    if (!fieldConfig) {
        return null;
    }

    const options = getFieldOptions(fieldKey);
    const isEnum = fieldConfig.type === "enum" && options;
    const isBoolean = fieldConfig.type === "boolean";
    const isNumber = fieldConfig.type === "number";

    const handleInputSubmit = (value: string) => {
        if (isNumber) {
            onSubmit(value.replace(/[^0-9]/g, "") || "0");
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
            height="40%"
            backgroundColor={THEME.overlay}
            border={true}
            borderStyle="rounded"
            borderColor={THEME.overlayTitle}
            padding={1}
            flexDirection="column"
            gap={1}
            zIndex={20}
        >
            <text fg={THEME.overlayTitle}>
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
                    height={10}
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
                    height={4}
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

            <text fg={THEME.statusText}>
                Enter to save, Esc to cancel
            </text>
        </box>
    );
}

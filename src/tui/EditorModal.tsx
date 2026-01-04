import React, { useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import type { FormValues } from "./types";
import { useFormOptions, getFieldLabel } from "./hooks";

interface EditorModalProps {
    fieldKey?: keyof FormValues;
    currentValue: unknown;
    onSave: (value: unknown) => void;
}

export const EditorModal: React.FC<EditorModalProps> = ({ fieldKey, currentValue, onSave }) => {
    const [inputValue, setInputValue] = useState(String(currentValue));
    const { agentOptions, outputModeOptions, logLevelOptions } = useFormOptions();

    if (!fieldKey) {
        return null;
    }

    const label = getFieldLabel(fieldKey);

    // Determine field type and get options
    const getFieldType = (): { type: string; options?: { name: string; value: unknown }[] } => {
        switch (fieldKey) {
            case "agentType":
                return { type: "enum", options: agentOptions() as unknown as { name: string; value: unknown }[] };
            case "outputMode":
                return { type: "enum", options: outputModeOptions() as unknown as { name: string; value: unknown }[] };
            case "logLevel":
                return { type: "enum", options: logLevelOptions() as unknown as { name: string; value: unknown }[] };
            case "useCache":
            case "stopOnError":
            case "allowFullAccess":
                return { type: "boolean" };
            case "iterationCount":
                return { type: "number" };
            default:
                return { type: "text" };
        }
    };

    const fieldInfo = getFieldType();

    const handleTextSave = () => {
        if (fieldInfo.type === "number") {
            onSave(parseInt(inputValue, 10) || 0);
        } else {
            onSave(inputValue);
        }
    };

    const handleBooleanSave = (value: boolean) => {
        onSave(value);
    };

    const handleEnumSave = (option: unknown) => {
        onSave(option);
    };

    if (fieldInfo.type === "boolean") {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} marginY={1}>
                <Text bold color="yellow">
                    Edit: {label}
                </Text>
                <SelectInput
                    items={[
                        { label: "False", value: false },
                        { label: "True", value: true },
                    ]}
                    onSelect={(item: any) => {
                        handleBooleanSave(item.value);
                    }}
                />
                <Text color="gray" italic>
                    Enter to save, Esc to cancel
                </Text>
            </Box>
        );
    }

    if (fieldInfo.type === "enum" && fieldInfo.options) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} marginY={1}>
                <Text bold color="yellow">
                    Edit: {label}
                </Text>
                <SelectInput
                    items={fieldInfo.options.map((opt) => ({ label: opt.name, value: opt.value }))}
                    onSelect={(item: any) => {
                        handleEnumSave(item.value);
                    }}
                />
                <Text color="gray" italic>
                    Enter to save, Esc to cancel
                </Text>
            </Box>
        );
    }

    // Text or number input
    return (
        <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} marginY={1}>
            <Text bold color="yellow">
                Edit: {label}
            </Text>
            <Box>
                <Text color="white">&gt; </Text>
                <TextInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSubmit={handleTextSave}
                    placeholder={String(currentValue)}
                />
            </Box>
            <Text color="gray" italic>
                Enter to save, Esc to cancel
            </Text>
        </Box>
    );
};

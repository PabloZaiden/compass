import React from "react";
import { Box, Text } from "ink";
import type { FormValues } from "./types";
import { useFormOptions, getFieldLabel } from "./hooks";

interface ConfigFormProps {
    values: FormValues;
    selectedFieldIndex: number;
    maxHeight?: number;
    isFocused?: boolean;
}

interface FieldInfo {
    key: keyof FormValues;
    type: "text" | "number" | "enum" | "boolean";
    options?: { name: string; value: unknown }[];
}

const FIELD_ORDER: FieldInfo[] = [
    { key: "agentType", type: "enum" },
    { key: "repoPath", type: "text" },
    { key: "fixture", type: "text" },
    { key: "iterationCount", type: "number" },
    { key: "outputMode", type: "enum" },
    { key: "logLevel", type: "enum" },
    { key: "useCache", type: "boolean" },
    { key: "stopOnError", type: "boolean" },
    { key: "allowFullAccess", type: "boolean" },
    { key: "model", type: "text" },
    { key: "evalModel", type: "text" },
];

export const ConfigForm: React.FC<ConfigFormProps> = ({
    values,
    selectedFieldIndex,
    maxHeight = 15,
    isFocused = false,
}) => {
    const { agentOptions, outputModeOptions, logLevelOptions } = useFormOptions();

    // Build field info with options
    const fieldsWithOptions: FieldInfo[] = FIELD_ORDER.map((field) => {
        if (field.key === "agentType") {
            return { ...field, options: agentOptions() as unknown as { name: string; value: unknown }[] };
        } else if (field.key === "outputMode") {
            return { ...field, options: outputModeOptions() as unknown as { name: string; value: unknown }[] };
        } else if (field.key === "logLevel") {
            return { ...field, options: logLevelOptions() as unknown as { name: string; value: unknown }[] };
        }
        return field;
    });

    const getDisplayValue = (key: keyof FormValues, type: "text" | "number" | "enum" | "boolean"): string => {
        const value = values[key];
        if (type === "boolean") {
            return value ? "True" : "False";
        } else if (type === "enum") {
            const fieldInfo = fieldsWithOptions.find((f) => f.key === key);
            const option = fieldInfo?.options?.find((o) => o.value === value);
            return option?.name || String(value);
        } else if (type === "number") {
            return String(value);
        } else {
            // Truncate long strings
            const strValue = String(value);
            return strValue.length > 60 ? strValue.substring(0, 57) + "..." : strValue;
        }
    };

    return (
        <Box flexDirection="column" paddingX={1} height={maxHeight}>
            <Box borderStyle="round" borderColor={isFocused ? "yellow" : "cyan"} paddingX={1} flexDirection="column">
                <Text bold color="cyan">
                    Configuration {isFocused && "(↑↓ to navigate, Enter to edit)"}
                </Text>
                
                <Box flexDirection="column">
                    {fieldsWithOptions.map((field, idx) => {
                        const isSelected = idx === selectedFieldIndex;
                        const label = getFieldLabel(field.key);
                        const displayValue = getDisplayValue(field.key, field.type);

                        return (
                            <Box
                                key={field.key}
                                paddingX={1}
                                flexDirection="row"
                            >
                                <Text 
                                    color={isSelected ? "black" : "white"}
                                    backgroundColor={isSelected ? "cyan" : undefined}
                                >
                                    {isSelected ? "► " : "  "}
                                    {label}: <Text color={isSelected ? "black" : "green"}>{displayValue}</Text>
                                </Text>
                            </Box>
                        );
                    })}

                    {/* Run button */}
                    <Box paddingX={1}>
                        <Text
                            color={selectedFieldIndex === fieldsWithOptions.length ? "black" : "white"}
                            backgroundColor={selectedFieldIndex === fieldsWithOptions.length ? "green" : undefined}
                            bold
                        >
                            {selectedFieldIndex === fieldsWithOptions.length ? "► " : "  "}
                            Run (Press Enter or Ctrl+R)
                        </Text>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

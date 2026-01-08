import type { SelectOption } from "@opentui/core";
import { LogLevel } from "../../logging";
import { Theme } from "../utils";
import { LoggingFieldConfigs } from "../hooks";
import type { LoggingConfig } from "../hooks/useLoggingConfig";
import { ConfigForm, type FieldConfig } from "./ConfigForm";

function getDisplayValue(
    key: keyof LoggingConfig,
    value: unknown,
    type: string
): string {
    if (type === "boolean") {
        return value ? "True" : "False";
    }
    if (type === "enum" && key === "logLevel") {
        return LogLevel[value as LogLevel] ?? String(value);
    }
    const strValue = String(value ?? "");
    if (strValue === "") {
        return "(empty)";
    }
    return strValue.length > 60 ? strValue.substring(0, 57) + "..." : strValue;
}

interface DoneButtonProps {
    isSelected: boolean;
}

function DoneButton({ isSelected }: DoneButtonProps) {
    const prefix = isSelected ? "► " : "  ";
    
    if (isSelected) {
        return (
            <box paddingTop={1} paddingLeft={1}>
                <text fg="#000000" bg="cyan">
                    {prefix}[Done]
                </text>
            </box>
        );
    }

    return (
        <box paddingTop={1} paddingLeft={1}>
            <text fg={Theme.runButton}>
                <strong>{prefix}[Done]</strong>
            </text>
        </box>
    );
}

interface SettingsConfigFormProps {
    values: LoggingConfig;
    selectedIndex: number;
    focused: boolean;
    onSelectionChange: (index: number) => void;
    onEditField: (fieldKey: keyof LoggingConfig) => void;
    onDone: () => void;
    onCopy: (content: string, label: string) => void;
}

export function SettingsConfigForm({
    values,
    selectedIndex,
    focused,
    onSelectionChange,
    onEditField,
    onDone,
    onCopy,
}: SettingsConfigFormProps) {
    return (
        <ConfigForm<keyof LoggingConfig, LoggingConfig>
            title="Settings"
            fieldConfigs={LoggingFieldConfigs as FieldConfig<keyof LoggingConfig>[]}
            values={values}
            selectedIndex={selectedIndex}
            focused={focused}
            onSelectionChange={onSelectionChange}
            onEditField={onEditField}
            onAction={onDone}
            onCopy={onCopy}
            getDisplayValue={getDisplayValue}
            copyLabel="Settings JSON"
            actionButton={<DoneButton isSelected={selectedIndex === LoggingFieldConfigs.length} />}
        />
    );
}

// Get field options for LoggingEditorModal
export function getSettingsFieldOptions(key: keyof LoggingConfig): SelectOption[] | undefined {
    if (key === "logLevel") {
        return Object.values(LogLevel)
            .filter((value): value is number => typeof value === "number")
            .map((value) => ({
                name: LogLevel[value] as string,
                description: "",
                value,
            }));
    }
    return undefined;
}

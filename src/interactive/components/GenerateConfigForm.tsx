import type { SelectOption } from "@opentui/core";
import { AgentTypes } from "../../agents/factory";
import { Theme } from "../utils";
import { GenerateFieldConfigs } from "../hooks";
import type { GenerateConfig } from "../hooks/useGenerateConfig";
import { ConfigForm, type FieldConfig } from "./ConfigForm";

function getDisplayValue(
    key: keyof GenerateConfig,
    value: unknown,
    type: string
): string {
    if (type === "boolean") {
        return value ? "True" : "False";
    }
    if (type === "enum" && key === "agentType") {
        return AgentTypes[value as AgentTypes] ?? String(value);
    }
    const strValue = String(value ?? "");
    if (strValue === "") {
        return "(empty)";
    }
    return strValue.length > 60 ? strValue.substring(0, 57) + "..." : strValue;
}

interface GenerateButtonProps {
    isSelected: boolean;
}

function GenerateButton({ isSelected }: GenerateButtonProps) {
    const prefix = isSelected ? "► " : "  ";
    
    if (isSelected) {
        return (
            <box paddingTop={1} paddingLeft={1}>
                <text fg="#000000" bg="cyan">
                    {prefix}[Generate]
                </text>
            </box>
        );
    }

    return (
        <box paddingTop={1} paddingLeft={1}>
            <text fg={Theme.runButton}>
                <strong>{prefix}[Generate]</strong>
            </text>
        </box>
    );
}

interface GenerateConfigFormProps {
    values: GenerateConfig;
    selectedIndex: number;
    focused: boolean;
    onSelectionChange: (index: number) => void;
    onEditField: (fieldKey: keyof GenerateConfig) => void;
    onGenerate: () => void;
    onCopy: (content: string, label: string) => void;
}

export function GenerateConfigForm({
    values,
    selectedIndex,
    focused,
    onSelectionChange,
    onEditField,
    onGenerate,
    onCopy,
}: GenerateConfigFormProps) {
    return (
        <ConfigForm<keyof GenerateConfig, GenerateConfig>
            title="Generate Configuration"
            fieldConfigs={GenerateFieldConfigs as FieldConfig<keyof GenerateConfig>[]}
            values={values}
            selectedIndex={selectedIndex}
            focused={focused}
            onSelectionChange={onSelectionChange}
            onEditField={onEditField}
            onAction={onGenerate}
            onCopy={onCopy}
            getDisplayValue={getDisplayValue}
            copyLabel="Generate Config JSON"
            actionButton={<GenerateButton isSelected={selectedIndex === GenerateFieldConfigs.length} />}
        />
    );
}

// Re-export getFieldOptions for GenerateEditorModal
export function getGenerateFieldOptions(key: keyof GenerateConfig): SelectOption[] | undefined {
    if (key === "agentType") {
        return Object.values(AgentTypes)
            .filter((value): value is number => typeof value === "number")
            .map((value) => ({
                name: AgentTypes[value] as string,
                description: "",
                value,
            }));
    }
    return undefined;
}

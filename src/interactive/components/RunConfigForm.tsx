import type { SelectOption } from "@opentui/core";
import type { RunConfig } from "../../runconfig/runconfig";
import { FieldConfigs, getFieldOptions as getFieldOptionsUtil, getDisplayValue } from "../utils";
import { ConfigForm, type FieldConfig } from "./ConfigForm";
import { RunButton } from "./RunButton";

interface RunConfigFormProps {
    values: RunConfig;
    selectedIndex: number;
    focused: boolean;
    onSelectionChange: (index: number) => void;
    onEditField: (fieldKey: keyof RunConfig) => void;
    onRun: () => void;
    totalFields: number;
    onCopy: (content: string, label: string) => void;
}

export function RunConfigForm({
    values,
    selectedIndex,
    focused,
    onSelectionChange,
    onEditField,
    onRun,
    onCopy,
}: RunConfigFormProps) {
    return (
        <ConfigForm<keyof RunConfig, RunConfig>
            title="Configuration"
            fieldConfigs={FieldConfigs as FieldConfig<keyof RunConfig>[]}
            values={values}
            selectedIndex={selectedIndex}
            focused={focused}
            onSelectionChange={onSelectionChange}
            onEditField={onEditField}
            onAction={onRun}
            onCopy={onCopy}
            getDisplayValue={getDisplayValue}
            copyLabel="Config JSON"
            actionButton={<RunButton isSelected={selectedIndex === FieldConfigs.length} />}
        />
    );
}

// Re-export getFieldOptions for RunEditorModal
export function getRunFieldOptions(key: keyof RunConfig): SelectOption[] | undefined {
    const options = getFieldOptionsUtil(key);
    if (!options) return undefined;
    return options.map((o) => ({ name: o.name, description: "", value: o.value }));
}

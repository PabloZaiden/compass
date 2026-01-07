import type { Config } from "../../config/config";
import { FieldConfigs } from "../utils";
import { EditorModal } from "./EditorModal";
import type { FieldConfig } from "./ConfigForm";
import { getRunFieldOptions } from "./RunConfigForm";

interface RunEditorModalProps {
    fieldKey: keyof Config | null;
    currentValue: unknown;
    visible: boolean;
    onSubmit: (value: unknown) => void;
    onCancel: () => void;
}

export function RunEditorModal({
    fieldKey,
    currentValue,
    visible,
    onSubmit,
    onCancel,
}: RunEditorModalProps) {
    return (
        <EditorModal<keyof Config>
            fieldKey={fieldKey}
            currentValue={currentValue}
            visible={visible}
            onSubmit={onSubmit}
            onCancel={onCancel}
            fieldConfigs={FieldConfigs as FieldConfig<keyof Config>[]}
            getFieldOptions={getRunFieldOptions}
        />
    );
}

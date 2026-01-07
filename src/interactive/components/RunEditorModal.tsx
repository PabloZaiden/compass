import type { Config } from "../../config/config";
import { FieldConfigs } from "../utils";
import { GenericEditorModal } from "./GenericEditorModal";
import type { GenericFieldConfig } from "./GenericConfigForm";
import { getFieldOptions } from "./RunConfigForm";

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
        <GenericEditorModal<keyof Config>
            fieldKey={fieldKey}
            currentValue={currentValue}
            visible={visible}
            onSubmit={onSubmit}
            onCancel={onCancel}
            fieldConfigs={FieldConfigs as GenericFieldConfig<keyof Config>[]}
            getFieldOptions={getFieldOptions}
        />
    );
}

import { GenerateFieldConfigs } from "../hooks";
import type { GenerateConfig } from "../hooks/useGenerateConfig";
import { EditorModal } from "./EditorModal";
import type { FieldConfig } from "./ConfigForm";
import { getGenerateFieldOptions } from "./GenerateConfigForm";

interface GenerateEditorModalProps {
    fieldKey: keyof GenerateConfig | null;
    currentValue: unknown;
    visible: boolean;
    onSubmit: (value: unknown) => void;
    onCancel: () => void;
}

export function GenerateEditorModal({
    fieldKey,
    currentValue,
    visible,
    onSubmit,
    onCancel,
}: GenerateEditorModalProps) {
    return (
        <EditorModal<keyof GenerateConfig>
            fieldKey={fieldKey}
            currentValue={currentValue}
            visible={visible}
            onSubmit={onSubmit}
            onCancel={onCancel}
            fieldConfigs={GenerateFieldConfigs as FieldConfig<keyof GenerateConfig>[]}
            getFieldOptions={getGenerateFieldOptions}
        />
    );
}

import { GenerateFieldConfigs } from "../hooks";
import type { GenerateConfig } from "../hooks/useGenerateConfig";
import { GenericEditorModal } from "./GenericEditorModal";
import type { GenericFieldConfig } from "./GenericConfigForm";
import { getGenerateFieldOptions } from "./ConfigForm";

interface EditorModalProps {
    fieldKey: keyof GenerateConfig | null;
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
    return (
        <GenericEditorModal<keyof GenerateConfig>
            fieldKey={fieldKey}
            currentValue={currentValue}
            visible={visible}
            onSubmit={onSubmit}
            onCancel={onCancel}
            fieldConfigs={GenerateFieldConfigs as GenericFieldConfig<keyof GenerateConfig>[]}
            getFieldOptions={getGenerateFieldOptions}
        />
    );
}

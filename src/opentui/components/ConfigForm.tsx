import type { FormValues } from "../types";
import { THEME } from "../types";
import { FIELD_CONFIGS, getDisplayValue } from "../utils";
import { FieldRow } from "./FieldRow";
import { RunButton } from "./RunButton";

interface ConfigFormProps {
    values: FormValues;
    selectedIndex: number;
    focused: boolean;
    height?: number;
}

export function ConfigForm({
    values,
    selectedIndex,
    focused,
    height = 20,
}: ConfigFormProps) {
    const borderColor = focused ? THEME.borderFocused : THEME.border;

    return (
        <box
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title="Configuration"
            height={height}
            flexGrow={1}
        >
            <scrollbox
                scrollY={true}
                flexGrow={1}
            >
                <box flexDirection="column" gap={0}>
                    {FIELD_CONFIGS.map((field, idx) => {
                        const isSelected = idx === selectedIndex;
                        const displayValue = getDisplayValue(
                            field.key,
                            values[field.key],
                            field.type
                        );
                        
                        return (
                            <FieldRow
                                key={field.key}
                                label={field.label}
                                value={displayValue}
                                isSelected={isSelected}
                            />
                        );
                    })}
                    
                    <RunButton isSelected={selectedIndex === FIELD_CONFIGS.length} />
                </box>
            </scrollbox>
        </box>
    );
}

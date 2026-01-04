import type { Config } from "../../config/config";
import { Theme } from "../types";
import { FieldConfigs, getDisplayValue } from "../utils";
import { FieldRow } from "./FieldRow";
import { RunButton } from "./RunButton";

interface ConfigFormProps {
    values: Config;
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
    const borderColor = focused ? Theme.borderFocused : Theme.border;

    return (
        <box
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title="Configuration"
            height={height}
            flexGrow={1}
            padding={1}
        >
            <scrollbox
                scrollY={true}
                flexGrow={1}
            >
                <box flexDirection="column" gap={0}>
                    {FieldConfigs.map((field, idx) => {
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
                    
                    <RunButton isSelected={selectedIndex === FieldConfigs.length} />
                </box>
            </scrollbox>
        </box>
    );
}

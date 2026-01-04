import { Theme } from "../utils";

interface RunButtonProps {
    isSelected: boolean;
}

export function RunButton({ isSelected }: RunButtonProps) {
    const prefix = isSelected ? "► " : "  ";
    const label = "[ Run ]";
    
    if (isSelected) {
        return (
            <box
                flexDirection="row"
                paddingLeft={1}
                paddingRight={1}
            >
                <text fg="#000000" bg="green">
                    <strong>{prefix}{label}</strong>
                </text>
            </box>
        );
    }

    return (
        <box
            flexDirection="row"
            paddingLeft={1}
            paddingRight={1}
        >
            <text fg={Theme.runButton}>
                <strong>{prefix}{label}</strong>
            </text>
        </box>
    );
}

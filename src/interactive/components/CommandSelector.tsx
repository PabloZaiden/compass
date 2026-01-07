import { Theme } from "../utils";
import { useKeyboardHandler, KeyboardPriority } from "../hooks";

export type Command = "run" | "check" | "generate" | "settings";

interface CommandOption {
    command: Command;
    label: string;
    description: string;
}

const COMMANDS: CommandOption[] = [
    {
        command: "run",
        label: "Run Benchmark",
        description: "Execute prompts against an agent and evaluate results",
    },
    {
        command: "check",
        label: "Check Dependencies",
        description: "Verify that required agent dependencies are installed",
    },
    {
        command: "generate",
        label: "Generate Fixture",
        description: "Generate a compass fixture file for a repository",
    },
    {
        command: "settings",
        label: "Settings",
        description: "Configure logging level and detailed logs",
    },
];

interface CommandSelectorProps {
    selectedIndex: number;
    onSelectionChange: (index: number) => void;
    onSelect: (command: Command) => void;
    onExit: () => void;
}

export function CommandSelector({
    selectedIndex,
    onSelectionChange,
    onSelect,
    onExit,
}: CommandSelectorProps) {
    // Keyboard handler for navigation
    useKeyboardHandler(
        (event) => {
            const { key } = event;

            // Arrow key navigation
            if (key.name === "down") {
                const newIndex = Math.min(selectedIndex + 1, COMMANDS.length - 1);
                onSelectionChange(newIndex);
                event.stopPropagation();
                return;
            }

            if (key.name === "up") {
                const newIndex = Math.max(selectedIndex - 1, 0);
                onSelectionChange(newIndex);
                event.stopPropagation();
                return;
            }

            // Enter to select command
            if (key.name === "return" || key.name === "enter") {
                const selected = COMMANDS[selectedIndex];
                if (selected) {
                    onSelect(selected.command);
                }
                event.stopPropagation();
                return;
            }

            // Escape to exit
            if (key.name === "escape") {
                onExit();
                event.stopPropagation();
                return;
            }
        },
        KeyboardPriority.Focused
    );

    return (
        <box
            flexDirection="column"
            flexGrow={1}
            justifyContent="center"
            alignItems="center"
            gap={1}
        >
            <box
                flexDirection="column"
                border={true}
                borderStyle="rounded"
                borderColor={Theme.borderFocused}
                title="Select Command"
                paddingLeft={3}
                paddingRight={3}
                paddingTop={1}
                paddingBottom={1}
                minWidth={60}
            >
                <box flexDirection="column" gap={1}>
                    {COMMANDS.map((cmd, idx) => {
                        const isSelected = idx === selectedIndex;
                        const prefix = isSelected ? "► " : "  ";

                        if (isSelected) {
                            return (
                                <box key={cmd.command} flexDirection="column">
                                    <text fg="#000000" bg="cyan">
                                        {prefix}{cmd.label}
                                    </text>
                                    <text fg={Theme.label}>
                                        {"    "}{cmd.description}
                                    </text>
                                </box>
                            );
                        }

                        return (
                            <box key={cmd.command} flexDirection="column">
                                <text fg={Theme.value}>
                                    {prefix}{cmd.label}
                                </text>
                                <text fg={Theme.border}>
                                    {"    "}{cmd.description}
                                </text>
                            </box>
                        );
                    })}
                </box>
            </box>

            <text fg={Theme.label}>
                ↑↓ Navigate • Enter Select • Esc Exit
            </text>
        </box>
    );
}

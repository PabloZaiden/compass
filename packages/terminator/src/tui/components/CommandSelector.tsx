import { Theme } from "../theme.ts";
import { useKeyboardHandler, KeyboardPriority } from "../hooks/useKeyboardHandler.ts";
import type { Command } from "../../core/command.ts";

interface CommandItem {
    /** The command object */
    command: Command;
    /** Display label (defaults to command name) */
    label?: string;
    /** Description (defaults to command description) */
    description?: string;
}

interface CommandSelectorProps {
    /** Commands to display */
    commands: CommandItem[];
    /** Currently selected index */
    selectedIndex: number;
    /** Called when selection changes */
    onSelectionChange: (index: number) => void;
    /** Called when a command is selected */
    onSelect: (command: Command) => void;
    /** Called when user wants to exit */
    onExit: () => void;
    /** Breadcrumb path for nested commands */
    breadcrumb?: string[];
}

/**
 * Command selection menu.
 */
export function CommandSelector({
    commands,
    selectedIndex,
    onSelectionChange,
    onSelect,
    onExit,
    breadcrumb,
}: CommandSelectorProps) {
    // Keyboard handler for navigation
    useKeyboardHandler(
        (event) => {
            const { key } = event;

            // Arrow key navigation
            if (key.name === "down") {
                const newIndex = Math.min(selectedIndex + 1, commands.length - 1);
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
                const selected = commands[selectedIndex];
                if (selected) {
                    onSelect(selected.command);
                }
                event.stopPropagation();
                return;
            }

            // Escape to exit or go back
            if (key.name === "escape") {
                onExit();
                event.stopPropagation();
                return;
            }
        },
        KeyboardPriority.Focused
    );

    const title = breadcrumb?.length 
        ? `Select Command (${breadcrumb.join(" › ")})`
        : "Select Command";

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
                title={title}
                paddingLeft={3}
                paddingRight={3}
                paddingTop={1}
                paddingBottom={1}
                minWidth={60}
            >
                <box flexDirection="column" gap={1}>
                    {commands.map((item, idx) => {
                        const isSelected = idx === selectedIndex;
                        const prefix = isSelected ? "► " : "  ";
                        const label = item.label ?? item.command.displayName ?? item.command.name;
                        const description = item.description ?? item.command.description;

                        // Show mode indicators
                        const modeIndicator = getModeIndicator(item.command);

                        if (isSelected) {
                            return (
                                <box key={item.command.name} flexDirection="column">
                                    <text fg="#000000" bg="cyan">
                                        {prefix}{label} {modeIndicator}
                                    </text>
                                    <text fg={Theme.label}>
                                        {"    "}{description}
                                    </text>
                                </box>
                            );
                        }

                        return (
                            <box key={item.command.name} flexDirection="column">
                                <text fg={Theme.value}>
                                    {prefix}{label} {modeIndicator}
                                </text>
                                <text fg={Theme.border}>
                                    {"    "}{description}
                                </text>
                            </box>
                        );
                    })}
                </box>
            </box>

            <text fg={Theme.label}>
                ↑↓ Navigate • Enter Select • Esc {breadcrumb?.length ? "Back" : "Exit"}
            </text>
        </box>
    );
}

/**
 * Get mode indicator for a command (e.g., "[cli]", "[tui]", "[cli/tui]").
 */
function getModeIndicator(command: Command): string {
    const cli = command.supportsCli();
    const tui = command.supportsTui();
    
    if (cli && tui) return "";
    if (cli) return "[cli]";
    if (tui) return "[tui]";
    return "";
}

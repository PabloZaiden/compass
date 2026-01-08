import {
    registerMode,
    type ExecutionMode,
    type OptionsSchema,
} from "../modes/mode";
import { launchInteractiveTui } from "./launcher";

/**
 * Options for the interactive mode.
 * Currently takes no options - the TUI handles all configuration.
 */
export interface InteractiveOptions {}

const interactiveOptionsSchema: OptionsSchema = {} as const;

/**
 * InteractiveMode - launches the interactive TUI.
 * This is the default mode when no command is specified.
 */
export const interactiveMode: ExecutionMode<InteractiveOptions> = {
    name: "interactive",
    description: "Launch the interactive TUI (default if no command specified)",
    options: interactiveOptionsSchema,
    examples: [
        "compass                     # Launch interactive TUI",
        "compass interactive         # Same as above",
    ],

    async execute(_options: InteractiveOptions): Promise<void> {
        await launchInteractiveTui();
    },
};

// Self-register
registerMode(interactiveMode);

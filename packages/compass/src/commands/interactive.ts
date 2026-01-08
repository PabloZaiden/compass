import { Command, type AppContext, type OptionSchema } from "@pablozaiden/terminator";
import { launchInteractiveTui } from "../interactive/launcher";

const interactiveOptions = {} as const satisfies OptionSchema;

/**
 * Interactive command - launches the interactive TUI.
 * This is the default command when no command is specified.
 */
export class InteractiveCommand extends Command<typeof interactiveOptions> {
  readonly name = "interactive";
  readonly description = "Launch the interactive TUI (default if no command specified)";
  readonly options = interactiveOptions;

  override readonly examples = [
    {
      command: "compass",
      description: "Launch interactive TUI",
    },
    {
      command: "compass interactive",
      description: "Same as above",
    },
  ];

  override readonly longDescription = `
Launch the interactive terminal user interface for compass.
The TUI provides a visual interface for configuring and running evaluations.
`.trim();

  /**
   * This command runs in TUI mode.
   */
  override async executeTui(_ctx: AppContext): Promise<void> {
    await launchInteractiveTui();
  }
}

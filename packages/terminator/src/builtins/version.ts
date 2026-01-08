import { Command } from "../core/command.ts";
import type { AppContext } from "../core/context.ts";
import { colors } from "../cli/output/colors.ts";
import type { OptionSchema } from "../types/command.ts";

/**
 * Built-in version command that displays the application version.
 * Automatically registered at the top level by the Application class.
 */
export class VersionCommand extends Command<OptionSchema> {
  readonly name = "version";
  readonly description = "Show version information";
  readonly options = {} as const;

  private appName: string;
  private appVersion: string;

  constructor(config: { appName: string; appVersion: string }) {
    super();
    this.appName = config.appName;
    this.appVersion = config.appVersion;
  }

  override async executeCli(_ctx: AppContext): Promise<void> {
    console.log(`${colors.bold(this.appName)} ${colors.dim(`v${this.appVersion}`)}`);
  }
}

/**
 * Create a version command for the application.
 */
export function createVersionCommand(appName: string, appVersion: string): VersionCommand {
  return new VersionCommand({ appName, appVersion });
}

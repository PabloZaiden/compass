import { Command } from "../core/command.ts";
import type { AppContext } from "../core/context.ts";
import { colors } from "../cli/output/colors.ts";
import type { OptionSchema } from "../types/command.ts";

/**
 * Configuration for version command.
 */
export interface VersionConfig {
  /** Application name */
  appName: string;
  /** Application version (e.g., "1.0.0") */
  appVersion: string;
  /** Optional commit hash for version display */
  commitHash?: string;
}

/**
 * Format version string with optional commit hash.
 * If commitHash is empty or undefined, shows "(dev)".
 */
export function formatVersion(version: string, commitHash?: string): string {
  const hashPart = commitHash && commitHash.length > 0 
    ? commitHash.substring(0, 7) 
    : "(dev)";
  return `${version} - ${hashPart}`;
}

/**
 * Built-in version command that displays the application version.
 * Automatically registered at the top level by the Application class.
 */
export class VersionCommand extends Command<OptionSchema> {
  readonly name = "version";
  readonly description = "Show version information";
  readonly options = {} as const;
  readonly aliases = ["--version", "-v"];

  private appName: string;
  private appVersion: string;
  private commitHash?: string;

  constructor(config: VersionConfig) {
    super();
    this.appName = config.appName;
    this.appVersion = config.appVersion;
    this.commitHash = config.commitHash;
  }

  /**
   * Get the formatted version string.
   */
  getFormattedVersion(): string {
    return formatVersion(this.appVersion, this.commitHash);
  }

  override async execute(_ctx: AppContext): Promise<void> {
    const versionDisplay = this.getFormattedVersion();
    console.log(`${colors.bold(this.appName)} ${colors.dim(`v${versionDisplay}`)}`);
  }
}

/**
 * Create a version command for the application.
 */
export function createVersionCommand(
  appName: string,
  appVersion: string,
  commitHash?: string
): VersionCommand {
  return new VersionCommand({ appName, appVersion, commitHash });
}

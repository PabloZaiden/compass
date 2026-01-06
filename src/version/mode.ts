import { registerMode, type ExecutionMode } from "../modes/mode";
import { logger } from "../logging";
import { getVersion } from "./index";

/**
 * VersionMode - displays the application version.
 */
export const versionMode: ExecutionMode<Record<string, never>> = {
    name: "version",
    description: "Show the Compass version",
    options: {},
    examples: [
        "compass version    # Show the application version",
    ],

    async execute(): Promise<void> {
        logger.info(`Compass v${getVersion()}`);
    },
};

// Self-register
registerMode(versionMode);

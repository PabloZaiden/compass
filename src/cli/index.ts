import { parseCliArgs, type ParsedCliOptions } from "./parser";
import { printHelp } from "./help";
import { fromParsedOptions } from "../config/process";
import { Runner } from "../runner";
import { logger } from "../logging";
import { launchOpenTui } from "../opentui/launcher";

export { parseCliArgs, type ParsedCliOptions, type ParsedCli, type Command } from "./parser";
export { printHelp } from "./help";

export async function runCli(args: string[]): Promise<void> {
    let parsed;
    try {
        parsed = parseCliArgs(args);
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Failed to parse command-line arguments:", error.message);
        } else {
            logger.error("Failed to parse command-line arguments:", error);
        }
        printHelp();
        process.exitCode = 1;
        return;
    }

    switch (parsed.command) {
        case "interactive":
            await launchOpenTui(parsed.options);
            break;

        case "run":
            await launchRunner(parsed.options);
            break;

        case "help":
            printHelp();
            break;
    }
}

async function launchRunner(options: ParsedCliOptions): Promise<void> {
    const config = await fromParsedOptions(options);
    logger.settings.minLevel = config.logLevel;

    const runner = new Runner();

    try {
        const result = await runner.run(config);
        logger.info("Run completed successfully");
        Bun.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } catch (error) {
        logger.error("Run failed:", error);
        process.exit(1);
    }
}

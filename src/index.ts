import { stdout } from "bun";
import { fromProcess } from "./config/process";
import { Runner } from "./runner";
import { logger } from "./utils";

const useTui = process.env["COMPASS_TUI"] === "true";

if (useTui) {
    const { launchTui } = await import("./tui");
    await launchTui();
} else {
    const config = await fromProcess(Bun.argv.slice(2));
    logger.settings.minLevel = config.logLevel;

    const runner = new Runner();

    try {
        const result = await runner.run(config);
        logger.info("Run completed successfully");
        stdout.write(JSON.stringify(result, null, 2) + "\n");
    } catch (error) {
        logger.error("Run failed:", error);
    }
}
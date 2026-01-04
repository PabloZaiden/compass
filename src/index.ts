import { stdout } from "bun";
import { fromProcess } from "./config/process";
import { Runner } from "./runner";
import { logger } from "./logging";
import { launchOpenTui } from "./opentui/launcher";

// Detect if running as compiled binary (not a .ts/.js file)
const isCompiledBinary = !Bun.main.endsWith(".ts") && !Bun.main.endsWith(".js");

const useTui = Bun.argv.slice(2).length === 0;

if (useTui) {
    await launchOpenTui(isCompiledBinary);
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
import { stdout } from "bun";
import { fromProcess } from "./config/process";
import { Runner } from "./runner";
import { logger } from "./utils";

const config = fromProcess(Bun.argv.slice(2));
logger.settings.minLevel = config.logLevel;

const runner = new Runner();

runner.run(config).then(result => {
    logger.info("Run completed successfully");
    stdout.write(JSON.stringify(result, null, 2) + "\n");
}).catch(error => {
    logger.error("Run failed:", error);
});
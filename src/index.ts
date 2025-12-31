import { fromProcess } from "./config/process";
import { Runner } from "./runner";
import { logger } from "./utils";

const config = fromProcess(Bun.argv.slice(2));
const runner = new Runner();

runner.run(config).then(result => {
    logger.info("Run completed successfully");
    logger.info(JSON.stringify(result, null, 2));
}).catch(error => {
    console.error("Run failed:", error);
});
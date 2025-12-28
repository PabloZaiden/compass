import { Runner } from "./runner.ts";
import { Logger, LogLevel } from "./logger.ts";

async function main() {
  const runner = new Runner();
  const result = await runner.run(process.argv.slice(2));

  Logger.log(result, LogLevel.Info, false);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

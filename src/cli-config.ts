import { existsSync } from "fs";
import { OutputMode } from "./models.ts";

export interface CLIConfig {
  repoPath: string;
  configFile: string;
  runCount: number;
  outputMode: OutputMode;
  verboseLogging: boolean;
  useCache: boolean;
  model: string;
  evalModel: string;
  agentType: string;
}

function getArg(args: string[], name: string): string | null {
  const index = args.indexOf(name);

  if (index < 0) {
    return null;
  }

  if (index >= 0 && index + 1 < args.length) {
    return args[index + 1];
  }

  // if it's the last arg and has no value, return the name itself (for flags)
  return name;
}

export function parseArgs(args: string[]): CLIConfig {
  const repoPath = getArg(args, "--repo-path");
  const configFile = getArg(args, "--config");
  const model = getArg(args, "--model");
  const evalModel = getArg(args, "--eval-model");

  const runsCount = getArg(args, "--runs") ?? "1";
  const outputMode = getArg(args, "--output") ?? OutputMode.Aggregated;
  const agentTypeStr = getArg(args, "--agent-type") ?? "githubcopilot";

  const useCache = getArg(args, "--no-cache") === null;
  const verboseLogging = getArg(args, "--verbose") !== null;

  if (!repoPath || !configFile || !model || !evalModel) {
    throw new Error("Required: --repo-path <path> --config <file> --model <model> --eval-model <model>");
  }

  if (!existsSync(repoPath)) {
    throw new Error("Repo path not found");
  }

  if (!existsSync(configFile)) {
    throw new Error("Config file not found");
  }

  const runs = parseInt(runsCount, 10);
  if (isNaN(runs) || runs < 1) {
    throw new Error("Invalid --runs");
  }

  const parsedOutputMode =
    outputMode.toLowerCase() === "detailed" ? OutputMode.Detailed : OutputMode.Aggregated;

  return {
    repoPath,
    configFile,
    runCount: runs,
    outputMode: parsedOutputMode,
    model,
    evalModel,
    useCache,
    verboseLogging,
    agentType: agentTypeStr.toLowerCase(),
  };
}

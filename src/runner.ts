import { readFile, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import type { CLIConfig } from "./cli-config.ts";
import { Prompts } from "./prompts.ts";
import { Agent } from "./agents/agent.ts";
import { CachedAgent } from "./agents/cache.ts";
import { Logger, LogLevel } from "./logger.ts";
import { FileSystemUtils, ProcessUtils, StringExtensions } from "./utils.ts";
import {
  Classification,
  OutputMode,
  type EvaluationConfig,
  type RunResult,
  type AggregatedResult,
  type ProcessOutput,
} from "./models.ts";

export class Runner {
  async run(args: string[]): Promise<string> {
    const generalPrompts = await Prompts.load();

    let cliConfig: CLIConfig;
    try {
      const { parseArgs } = await import("./cli-config.ts");
      cliConfig = parseArgs(args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.log(`Error parsing arguments.\n${errorMessage}`, LogLevel.Error);
      return "";
    }

    Logger.currentLogLevel = cliConfig.verboseLogging ? LogLevel.Verbose : LogLevel.Info;

    Logger.log("Compass evaluation started.", LogLevel.Info);
    Logger.log(`Agent type: ${cliConfig.agentType}`, LogLevel.Info);
    Logger.log(`Model: ${cliConfig.model}`, LogLevel.Info);
    Logger.log(`Evaluation Model: ${cliConfig.evalModel}`, LogLevel.Verbose);
    Logger.log(`Repository: ${cliConfig.repoPath}`, LogLevel.Verbose);
    Logger.log(`Config: ${cliConfig.configFile}`, LogLevel.Verbose);
    Logger.log(`Runs: ${cliConfig.runCount}`, LogLevel.Verbose);
    Logger.log(`Agent Type: ${cliConfig.agentType}`, LogLevel.Verbose);
    Logger.log(`Use Cache: ${cliConfig.useCache}`, LogLevel.Verbose);

    const cfgContent = await readFile(cliConfig.configFile, "utf-8");
    const cfg: EvaluationConfig = JSON.parse(cfgContent);

    if (!cfg) {
      Logger.log("Evaluation config deserialization returned null", LogLevel.Error);
      throw new Error(`Failed to parse config file: ${cliConfig.configFile}`);
    }

    Logger.log(`Loaded evaluation config for ${cfg.prompts.length} prompts`, LogLevel.Verbose);

    const allRunResults: RunResult[] = [];
    const evaluationAgent = await Agent.create(cliConfig.agentType);
    const agent = await Agent.create(cliConfig.agentType);

    await agent.ensureLogin();
    await evaluationAgent.ensureLogin();

    Logger.log("Beginning evaluation runs", LogLevel.Info);

    Logger.log("Starting evaluations", LogLevel.Info);
    for (const prompt of cfg.prompts) {
      Logger.log(`Starting evaluations for prompt: ${prompt.id}`, LogLevel.Info);
      
      for (let i = 1; i <= cliConfig.runCount; i++) {
        const tempRepoPath = join(tmpdir(), `compass-run-${randomBytes(16).toString("hex")}`);
        Logger.log(`Creating temporary repository copy at: ${tempRepoPath}`, LogLevel.Verbose);

        await FileSystemUtils.copyDirectory(cliConfig.repoPath, tempRepoPath);

        Logger.log(
          `Starting run: agent=${agent.name} model=${cliConfig.model} prompt=${prompt.id} iteration=${i}`,
          LogLevel.Info
        );

        let iterationAgent: Agent = agent;
        if (cliConfig.useCache) {
          const cachedAgent = new CachedAgent(agent);
          cachedAgent.cacheKeyPrefix = i.toString(); // separate cache per iteration
          iterationAgent = cachedAgent;
        }

        Logger.log("Resetting repository to clean state", LogLevel.Verbose);
        await ProcessUtils.git(tempRepoPath, "reset --hard");
        await ProcessUtils.git(tempRepoPath, "clean -fd");

        Logger.log("Executing agent for prompt", LogLevel.Verbose);
        const agentOutput = await iterationAgent.execute(prompt.prompt, cliConfig.model, tempRepoPath);
        Logger.log("Agent output", agentOutput, LogLevel.Verbose, false);

        const tempResultFile = join(tmpdir(), `result-${randomBytes(8).toString("hex")}.json`);
        await writeFile(tempResultFile, JSON.stringify(agentOutput));

        Logger.log(`Temporary result file created at: ${tempResultFile}`, LogLevel.Verbose);

        const evalPrompt = generalPrompts.evaluator
          .replace("{{RESULT_FILE_PATH}}", tempResultFile)
          .replace("{{EXPECTED}}", prompt.expected);

        Logger.log(`Executing evaluation prompt with model=${cliConfig.evalModel}`, LogLevel.Verbose);
        const evalOutput = await evaluationAgent.execute(evalPrompt, cliConfig.evalModel, tempRepoPath);

        Logger.log("Evaluation output", evalOutput, LogLevel.Verbose, false);

        Logger.log("Parsing classification from evaluation output", LogLevel.Verbose);
        const classification = this.parseClassification(evalOutput);

        Logger.log(`Parsed classification: ${classification}`, LogLevel.Verbose);
        const points = classification as number;

        Logger.log(
          `Run completed: agent=${agent.name} model=${cliConfig.model} prompt=${prompt.id} iteration=${i} classification=${Classification[classification]} points=${points}`,
          LogLevel.Info
        );

        allRunResults.push({
          agentType: cliConfig.agentType,
          model: cliConfig.model,
          evalModel: cliConfig.evalModel,
          promptId: prompt.id,
          iteration: i,
          agentOutput,
          evaluationOutput: evalOutput,
          classification,
          points,
        });

        // clean up temp repo copy
        try {
          Logger.log("Deleting temporary repository copy", LogLevel.Verbose);
          await rm(tempRepoPath, { recursive: true, force: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          Logger.log(`Failed to delete temp repo copy at ${tempRepoPath}: ${errorMessage}`, LogLevel.Error);
        }
      }
    }

    Logger.log("Aggregating results", LogLevel.Info);

    const aggregates: AggregatedResult[] = [];
    const grouped = allRunResults.reduce((acc, r) => {
      if (!acc[r.promptId]) {
        acc[r.promptId] = [];
      }
      acc[r.promptId].push(r);
      return acc;
    }, {} as Record<string, RunResult[]>);

    for (const [promptId, results] of Object.entries(grouped)) {
      const averagePoints = results.reduce((sum, r) => sum + r.points, 0) / results.length;
      aggregates.push({
        promptId,
        runs: results.length,
        averagePoints,
      });
    }

    aggregates.sort((a, b) => a.promptId.localeCompare(b.promptId));

    let outObj: unknown;
    if (cliConfig.outputMode === OutputMode.Aggregated) {
      Logger.log("Output mode is Aggregated, emitting only aggregates", LogLevel.Verbose);
      outObj = { aggregates };
    } else {
      Logger.log("Output mode is Detailed, emitting all results", LogLevel.Verbose);
      outObj = { results: allRunResults, aggregates };
    }

    return StringExtensions.toJsonString(outObj);
  }

  private parseClassification(evalOutput: ProcessOutput): Classification {
    if (evalOutput.stdout?.includes("SUCCESS")) return Classification.Success;
    if (evalOutput.stdout?.includes("PARTIAL")) return Classification.Partial;
    if (evalOutput.stdout?.includes("FAILURE")) return Classification.Failure;

    return Classification.Failure;
  }
}

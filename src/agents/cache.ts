import { createHash } from "crypto";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { Agent } from "./agent.ts";
import { ProcessUtils, StringExtensions } from "../utils.ts";
import { Logger, LogLevel } from "../logger.ts";
import { tmpdir } from "os";
import type { AgentOutput } from "../models.ts";

export class CachedAgent extends Agent {
  private innerAgent: Agent;
  private cacheDir: string;
  public cacheKeyPrefix: string = "cache";

  constructor(innerAgent: Agent) {
    super();
    this.innerAgent = innerAgent;
    this.cacheDir = join(".cache", innerAgent.name);

    Logger.log(`Initializing cache directory at: ${this.cacheDir}`, LogLevel.Verbose);
    
    // Create cache directory synchronously during construction
    if (!existsSync(this.cacheDir)) {
      mkdir(this.cacheDir, { recursive: true }).catch((err) => {
        Logger.log(`Failed to create cache directory: ${err.message}`, LogLevel.Error);
      });
    }
  }

  get name(): string {
    return `${this.innerAgent.name} (Cached)`;
  }

  private getCacheKey(prompt: string, model: string, workingDirectory: string): string {
    const id = `${this.cacheKeyPrefix}-${this.innerAgent.constructor.name}-${prompt}-${model}-${workingDirectory}`;
    const hash = createHash("sha256").update(id).digest("base64");
    return hash.replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
  }

  async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
    const cacheKey = this.getCacheKey(prompt, model, workingDirectory);
    const cacheFile = join(this.cacheDir, `${cacheKey}.json`);

    Logger.log(`Looking for cache file: ${cacheFile}`, LogLevel.Verbose);

    if (existsSync(cacheFile)) {
      Logger.log(`Found cache file: ${cacheFile}`, LogLevel.Verbose);

      try {
        const cachedJson = await readFile(cacheFile, "utf-8");
        const cachedOutput = JSON.parse(cachedJson) as AgentOutput;

        // re-apply the git diff from cache in the working directory
        const diffContent = cachedOutput.gitDiff ?? "";
        if (diffContent) {
          const tempDiffFile = join(tmpdir(), `diff-${Date.now()}.patch`);
          await writeFile(tempDiffFile, diffContent, "utf-8");
          await ProcessUtils.run(workingDirectory, "git", `apply ${StringExtensions.escapeArg(tempDiffFile)}`);
          // Clean up temp file
          await unlink(tempDiffFile).catch(() => {});
        }

        Logger.log(`Cache hit for key: ${cacheKey}`, LogLevel.Verbose);
        return cachedOutput;
      } catch (error) {
        Logger.log(`Failed to read cache file: ${error}`, LogLevel.Error);
      }
    }

    Logger.log(`Cache miss for key: ${cacheKey}`, LogLevel.Verbose);

    const output = await this.innerAgent.execute(prompt, model, workingDirectory);

    Logger.log(`Caching output for key: ${cacheKey}`, LogLevel.Verbose);
    const outputJson = JSON.stringify(output, null, 2);

    Logger.log(`Writing cache file: ${cacheFile}`, LogLevel.Verbose);
    await writeFile(cacheFile, outputJson, "utf-8");

    return output;
  }

  async ensureLogin(): Promise<void> {
    return this.innerAgent.ensureLogin();
  }
}

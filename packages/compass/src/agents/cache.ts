import { createHash } from "crypto";
import type { AgentOutput } from "../models";
import { run } from "../utils";
import { logger } from "../logging";
import { Agent, type AgentOptions } from "./agent";
import path from "path";
import { tmpdir } from "os";
import { mkdir } from "fs/promises";

export class Cache extends Agent {

    private readonly innerAgent: Agent;

    private cacheDirectory: string;

    private cacheKeyPrefix: string;

    private repoToCache: string;

    constructor(agent: Agent, options: AgentOptions, repoToCache: string, cacheKeyPrefix = "cache") {
        super(`${agent.name} (Cached)`, options);

        this.innerAgent = agent;
        this.cacheKeyPrefix = cacheKeyPrefix;
        this.repoToCache = repoToCache;
        this.cacheDirectory = path.join(".cache", agent.name.replaceAll(" ", "_"));

        logger.trace(`Initializing cache for agent ${agent.name} at directory ${this.cacheDirectory}`);
    }

    private getCacheKey(prompt: string, model: string): string {
        const id = `${this.cacheKeyPrefix}-${this.innerAgent.name}-${prompt}-${model}-${this.repoToCache}`;
        const hash = createHash("sha256")
            .update(id, "utf8")
            .digest("base64")
            .replaceAll("/", "_")
            .replaceAll("+", "-")
            .replaceAll("=", "");

        logger.trace(`Generated cache key: ${hash} for id: ${id}`);

        return hash;
    }

    override async execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput> {
        const cacheKey = this.getCacheKey(prompt, model);

        const cacheFile = path.join(this.cacheDirectory, `${cacheKey}.json`);
        logger.trace(`Looking for cache file: ${cacheFile}`);

        const fileExists = await Bun.file(cacheFile).exists();

        if (fileExists) {
            logger.trace(`Found cache file: ${cacheFile}`);

            const cachedJson = await Bun.file(cacheFile).text();
            const cachedOutput: AgentOutput = JSON.parse(cachedJson);

            if (cachedOutput != null) {
                // re-apply the git diff from cache in the working directory
                const diffContent = cachedOutput.gitDiff ?? "";
                if (diffContent.length > 0) {
                    const tempFileName = path.join(tmpdir(), crypto.randomUUID());
                    logger.trace(`Writing temp diff file: ${tempFileName}`);
                    await Bun.write(tempFileName, diffContent);

                    logger.trace(`Re-applying git diff from cache for key: ${cacheKey}`);
                    await run(workingDirectory, "git", "apply", tempFileName);
                    await Bun.file(tempFileName).delete();
                }

                logger.trace(`Cache hit for key: ${cacheKey}`);
                return cachedOutput;
            }
        }

        logger.trace(`Cache miss for key: ${cacheKey}`);

        const output = await this.innerAgent.execute(prompt, model, workingDirectory);

        logger.trace(`Caching output for key: ${cacheKey}`);
        const outputJson = JSON.stringify(output, null, 2);

        logger.trace(`Writing cache file: ${cacheFile}`);
        await mkdir(path.dirname(cacheFile), { recursive: true });
        await Bun.write(cacheFile, outputJson);

        return output;
    }

    override init(): Promise<void> {
        return Promise.resolve();
    }

    override requiredBinaries(): string[] {
        return this.innerAgent.requiredBinaries();
    }

}
import { copyDirectory, run } from "../utils";
import { logger } from "../logging";
import type { Fixture, IterationResult, ProcessOutput, RunnerResult } from "../models";
import { tmpdir } from "os";
import { Cache } from "../agents/cache";
import { evaluator } from "../prompts";
import { Classification } from "../models";
import { promises as fsPromises } from "fs";
import { createAgent } from "../agents/factory";
import type { Config } from "../config/config";
import type { AgentOptions } from "../agents/agent";

function validateConfig(config: Config): void {
    const errors: string[] = [];

    // Required string fields
    if (!config.repoPath || config.repoPath.trim() === "") {
        errors.push("repoPath is required");
    }
    if (!config.fixture || config.fixture.trim() === "") {
        errors.push("fixture is required");
    }
    if (config.agentType === undefined) {
        errors.push("agentType is required");
    }
    if (!config.model || config.model.trim() === "") {
        errors.push("model is required");
    }
    if (!config.evalModel || config.evalModel.trim() === "") {
        errors.push("evalModel is required");
    }

    // Numeric validation
    if (config.iterationCount === undefined || config.iterationCount < 1) {
        errors.push("iterationCount must be at least 1");
    }

    if (errors.length > 0) {
        throw new Error(`Invalid configuration:\n  - ${errors.join("\n  - ")}`);
    }
}

export class Runner {
    async run(config: Config): Promise<RunnerResult> {
        validateConfig(config);

        logger.trace(`Running Compass with config: ${JSON.stringify(config, null, 2)}`);

        const fixtureContent = await Bun.file(config.fixture).text();
        const fixture = JSON.parse(fixtureContent) as Fixture;

        logger.trace(`Loaded fixture with ${fixture.prompts.length} prompts from ${config.fixture}`);

        const iterationResults: IterationResult[] = [];

        const agentOptions: AgentOptions = {
            allowFullAccess: config.allowFullAccess,
        };

        const evaluationAgent = createAgent(config.agentType, agentOptions);
        evaluationAgent.init();

        const agent = createAgent(config.agentType, agentOptions);
        agent.init();

        logger.info(`Starting iterations for ${fixture.prompts.length} prompts, ${config.iterationCount} times each`);

        const promptCount = fixture.prompts.length;
        let currentPromptIndex = 0;
        for (const prompt of fixture.prompts) {
            currentPromptIndex++;
            logger.info(`[${currentPromptIndex} / ${promptCount}] Running prompt ${prompt.id}`);

            for (let iterationIndex = 0; iterationIndex < config.iterationCount; iterationIndex++) {
                const iterationId = crypto.randomUUID();

                logger.info(`Iteration ${iterationIndex + 1} of ${config.iterationCount} for prompt ${prompt.id}`);

                const tempPath = `${tmpdir()}/compass-iteration-${iterationId}`;

                logger.trace(`Creating temporary working directory at ${tempPath}`);
                await copyDirectory(config.repoPath, tempPath);

                const iterationAgent = config.useCache ? new Cache(agent, agentOptions, config.repoPath, iterationIndex.toString()) : agent;

                logger.trace(`Resetting repository to initial state`);
                throwIfStopOnError(config.stopOnError, await run(tempPath, "git", "reset", "--hard"));
                throwIfStopOnError(config.stopOnError, await run(tempPath, "git", "clean", "-fd"));

                logger.trace(`Executing agent for prompt ${prompt.id}`);
                const agentOutput = await iterationAgent.execute(prompt.prompt, config.model, tempPath);

                throwIfStopOnError(config.stopOnError, agentOutput);

                const agentOutputJson = JSON.stringify(agentOutput, null, 2);
                logger.trace(`Agent output: ${agentOutputJson}`);

                const evalPrompt = evaluator
                    .replace("{{ORIGINAL_PROMPT}}", prompt.prompt)
                    .replace("{{EXPECTED}}", prompt.expected)
                    .replace("{{RESULT}}", agentOutputJson);

                logger.trace(`Evaluating agent output for prompt ${prompt.id} with model ${config.evalModel}`);
                const evalOutput = await evaluationAgent.execute(evalPrompt, config.evalModel, tempPath);

                throwIfStopOnError(config.stopOnError, evalOutput);

                logger.trace(`Evaluation output: ${evalOutput.stdOut}`);

                logger.trace(`Parsing classification from evaluation output`);
                const classification = this.parseClassification(evalOutput.stdOut);

                logger.info(`Iteration ${iterationIndex + 1} for prompt ${prompt.id} classified as ${Classification[classification]}`);
                const points = this.classificationToPoints(classification);

                iterationResults.push({
                    promptId: prompt.id,
                    agentOutput: agentOutput,
                    evaluationOutput: evalOutput,
                    classification: Classification[classification] as keyof typeof Classification,
                    points: points,
                    agentType: config.agentType,
                    model: config.model,
                    iteration: iterationIndex + 1
                });

                try {
                    logger.trace(`Cleaning up temporary directory at ${tempPath}`);
                    await fsPromises.rm(tempPath, { recursive: true, force: true });
                }
                catch (err) {
                    logger.error(`Failed to delete temporary directory at ${tempPath}: ${(err as Error).message}`);
                }
            }
        }

        logger.trace(`Aggregating results from all iterations`);

        // Here we group by promptId and return the amount of iterations per prompt and the average points
        const aggregatedResults = fixture.prompts.map(prompt => {
            const resultsForPrompt = iterationResults.filter(r => r.promptId === prompt.id);
            const averagePoints = resultsForPrompt.reduce((sum, r) => sum + r.points, 0) / resultsForPrompt.length;

            return {
                promptId: prompt.id,
                iterations: resultsForPrompt.length,
                averagePoints: averagePoints,
                model: config.model
            };
        });

        logger.info(`Completed all iterations.`);
        for (const aggResult of aggregatedResults) {
            logger.info(`Average Points for prompt "${aggResult.promptId}": ${aggResult.averagePoints.toFixed(2)}`);
        }

        return {
            iterationResults,
            aggregatedResults
        };
    }

    private parseClassification(evaluatorOutput: string): Classification {
        if (evaluatorOutput.includes(Classification[Classification.SUCCESS])) {
            return Classification.SUCCESS;
        } else if (evaluatorOutput.includes(Classification[Classification.PARTIAL])) {
            return Classification.PARTIAL;
        } else {
            return Classification.FAILURE;
        }
    }

    private classificationToPoints(classification: Classification): number {
        switch (classification) {
            case Classification.SUCCESS:
                return 10;
            case Classification.PARTIAL:
                return 5;
            default:
                return 0;
        }
    }
}

function throwIfStopOnError(stopOnError: boolean, processOutput: ProcessOutput) {
    if (stopOnError && processOutput.exitCode !== 0) {
        throw new Error(`Process failed with exit code ${processOutput.exitCode}\nStdOut: ${processOutput.stdOut}\nStdErr: ${processOutput.stdErr}`);
    }
}

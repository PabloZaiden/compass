namespace Compass;

using System.Text.Json;
using Compass.Agents;

static class Program
{
    static async Task Main(string[] args)
    {
        var generalPrompts = new Prompts();

        CLIConfig cliConfig;
        try
        {
            cliConfig = CLIConfig.FromArgs(args);
        }
        catch (ArgumentException ex)
        {
            Logger.Log($"Error parsing arguments." + Environment.NewLine + ex.Message, Logger.LogLevel.Error);
            return;
        }
        Logger.CurrentLogLevel = cliConfig.VerboseLogging ? Logger.LogLevel.Verbose : Logger.LogLevel.Info;

        Logger.Log($"Compass evaluation started.", Logger.LogLevel.Info);
        Logger.Log($"Repository: {cliConfig.RepoPath}", Logger.LogLevel.Verbose);
        Logger.Log($"Config: {cliConfig.ConfigFile}", Logger.LogLevel.Verbose);
        Logger.Log($"Runs: {cliConfig.RunCount}", Logger.LogLevel.Verbose);
        Logger.Log($"Use Cache: {cliConfig.UseCache}", Logger.LogLevel.Verbose);

        var cfg = JsonSerializer.Deserialize<EvaluationConfig>(
            File.ReadAllText(cliConfig.ConfigFile),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (cfg is null)
        {
            Logger.Log("Evaluation config deserialization returned null", Logger.LogLevel.Error);
            throw new("Failed to parse config file: " + cliConfig.ConfigFile);
        }

        Logger.Log($"Loaded evaluation config for {cfg.Models.Count} models and {cfg.Prompts.Count} prompts", Logger.LogLevel.Verbose);

        var allRunResults = new List<RunResult>();
        Agent evaluationAgent = new GithubCopilot();

        Logger.Log("Beginning evaluation runs", Logger.LogLevel.Info);
        foreach (var model in cfg.Models)
        {
            Logger.Log($"Starting evaluations for model: {model}", Logger.LogLevel.Info);
            foreach (var prompt in cfg.Prompts)
            {
                Logger.Log($"Starting evaluations for prompt: {prompt.Id}", Logger.LogLevel.Info);
                for (int i = 1; i <= cliConfig.RunCount; i++)
                {
                    var tempRepoPath = Path.Combine(Path.GetTempPath(), $"compass-run-{Guid.NewGuid():N}");
                    Logger.Log($"Creating temporary repository copy at: {tempRepoPath}", Logger.LogLevel.Verbose);

                    FileSystemUtils.CopyDirectory(cliConfig.RepoPath, tempRepoPath);

                    Logger.Log($"Starting run: model={model} prompt={prompt.Id} iteration={i}", Logger.LogLevel.Info);
                    Agent agent;

                    if (cliConfig.UseCache)
                    {
                        var cachedAgent = new CachedAgent(new GithubCopilot());
                        cachedAgent.CacheKeyPrefix = i.ToString(); // separate cache per iteration
                        agent = cachedAgent;
                    }
                    else
                    {
                        agent = new GithubCopilot();
                    }

                    Logger.Log($"Resetting repository to clean state", Logger.LogLevel.Verbose);
                    await ProcessUtils.Git(tempRepoPath, "reset --hard");
                    await ProcessUtils.Git(tempRepoPath, "clean -fd");

                    Logger.Log($"Executing agent for prompt", Logger.LogLevel.Verbose);
                    var agentOutput = await agent.Execute(prompt.Prompt, model, tempRepoPath);
                    Logger.Log("Agent output", agentOutput, Logger.LogLevel.Verbose);

                    var tempResultFile = Path.GetTempFileName() + ".json";
                    File.WriteAllText(tempResultFile, JsonSerializer.Serialize(agentOutput));

                    Logger.Log($"Temporary result file created at: {tempResultFile}", Logger.LogLevel.Verbose);

                    var evalPrompt = generalPrompts.Evaluator
                        .Replace("{{RESULT_FILE_PATH}}", tempResultFile)
                        .Replace("{{EXPECTED}}", prompt.Expected);


                    Logger.Log($"Executing evaluation prompt", Logger.LogLevel.Verbose);
                    var evalOutput = await evaluationAgent.Execute(evalPrompt, model, tempRepoPath);

                    Logger.Log("Evaluation output", evalOutput, Logger.LogLevel.Verbose);

                    Logger.Log($"Parsing classification from evaluation output", Logger.LogLevel.Verbose);
                    var classification = ParseClassification(evalOutput);

                    Logger.Log($"Parsed classification: {classification}", Logger.LogLevel.Verbose);
                    int points = (int)classification;

                    Logger.Log($"Run completed: model={model} prompt={prompt.Id} iteration={i} classification={classification} points={points}", Logger.LogLevel.Info);

                    allRunResults.Add(new RunResult
                    {
                        Model = model,
                        PromptId = prompt.Id,
                        Iteration = i,
                        AgentOutput = agentOutput,
                        EvaluationOutput = evalOutput,
                        Classification = classification,
                        Points = points
                    });

                    // clean up temp repo copy
                    try
                    {
                        Logger.Log("Deleting temporary repository copy", Logger.LogLevel.Verbose);
                        Directory.Delete(tempRepoPath, true);
                    }
                    catch (Exception ex)
                    {
                        Logger.Log($"Failed to delete temp repo copy at {tempRepoPath}: {ex.Message}", Logger.LogLevel.Error);
                    }
                }
            }
        }

        Logger.Log("Aggregating results", Logger.LogLevel.Info);

        var aggregates = allRunResults
            .GroupBy(r => (r.Model, r.PromptId))
            .Select(g => new AggregatedResult { Model = g.Key.Model, PromptId = g.Key.PromptId, Runs = g.Count(), AveragePoints = g.Average(r => r.Points) })
            .OrderBy(a => a.Model).ThenBy(a => a.PromptId).ToList();

        object outObj;
        if (cliConfig.OutputMode == OutputMode.Aggregated)
        {
            Logger.Log("Output mode is Aggregated, emitting only aggregates", Logger.LogLevel.Verbose);
            outObj = new { aggregates };
        }
        else
        {
            Logger.Log("Output mode is Detailed, emitting all results", Logger.LogLevel.Verbose);
            outObj = new { results = allRunResults, aggregates };
        }

        Console.WriteLine(outObj.ToJsonString());
    }

    static Classification ParseClassification(ProcessOutput evalOutput)
    {
        if (evalOutput.StdOut?.Contains("SUCCESS") == true) return Classification.Success;
        if (evalOutput.StdOut?.Contains("PARTIAL") == true) return Classification.Partial;
        if (evalOutput.StdOut?.Contains("FAILURE") == true) return Classification.Failure;

        return Classification.Failure;
    }
}

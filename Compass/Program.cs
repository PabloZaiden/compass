namespace Compass;

using System.Text.Json;
using System.Diagnostics;
using Compass.Agents;

static class Program
{
    static async Task Main(string[] args)
    {
        var generalPrompts = new Prompts();
        var cliConfig = CLIConfig.FromArgs(args);
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

        Logger.Log("Beginning evaluation runs", Logger.LogLevel.Info);
        foreach (var model in cfg.Models)
        {
            Logger.Log($"Starting evaluations for model: {model}", Logger.LogLevel.Info);
            foreach (var prompt in cfg.Prompts)
            {
                Logger.Log($"Starting evaluations for prompt: {prompt.Id}", Logger.LogLevel.Info);
                for (int i = 1; i <= cliConfig.RunCount; i++)
                {
                    Logger.Log($"Starting run: model={model} prompt={prompt.Id} iteration={i}", Logger.LogLevel.Info);
                    IAgent agent;

                    if (cliConfig.UseCache)
                    {
                        agent = new CachedAgent(new GithubCopilot());
                    }
                    else
                    {
                        agent = new GithubCopilot();
                    }

                    Logger.Log($"Resetting repository to clean state", Logger.LogLevel.Verbose);
                    await ProcessUtils.Git(cliConfig.RepoPath, "reset --hard");
                    await ProcessUtils.Git(cliConfig.RepoPath, "clean -fd");

                    Logger.Log($"Executing agent for prompt", Logger.LogLevel.Verbose);
                    var agentProcessOutput = await agent.Execute(prompt.Prompt, model, cliConfig.RepoPath);

                    Logger.Log($"Collecting git diff after agent execution", Logger.LogLevel.Verbose);
                    var diff = await ProcessUtils.Git(cliConfig.RepoPath, "--no-pager diff");

                    var agentOutput = new AgentOutput
                    {
                        StdOut = agentProcessOutput.StdOut,
                        StdErr = agentProcessOutput.StdErr,
                        GitDiff = diff.StdOut
                    };
                    Logger.Log("Agent output", agentOutput, Logger.LogLevel.Verbose);

                    var tempResultFile = Path.GetTempFileName() + ".json";
                    File.WriteAllText(tempResultFile, JsonSerializer.Serialize(agentOutput));

                    Logger.Log($"Temporary result file created at: {tempResultFile}", Logger.LogLevel.Verbose);
                    
                    var evalPrompt = generalPrompts.Evaluator
                        .Replace("{{RESULT_FILE_PATH}}", tempResultFile)
                        .Replace("{{EXPECTED}}", prompt.Expected);


                    Logger.Log($"Executing evaluation prompt", Logger.LogLevel.Verbose);
                    var evalOutput = await agent.Execute(evalPrompt, model, cliConfig.RepoPath);

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
                }
            }
        }

        var aggregates = allRunResults
            .GroupBy(r => (r.Model, r.PromptId))
            .Select(g => new AggregatedResult { Model = g.Key.Model, PromptId = g.Key.PromptId, Runs = g.Count(), AveragePoints = g.Average(r => r.Points) })
            .OrderBy(a => a.Model).ThenBy(a => a.PromptId).ToList();

        Logger.Log("Aggregated results calculated", Logger.LogLevel.Info);

        if ((cliConfig.OutputMode & OutputMode.StdOut) == OutputMode.StdOut)
        {
            Logger.Log("Emitting run and aggregate details to standard output", Logger.LogLevel.Info);
            foreach (var r in allRunResults)
            {
                Console.WriteLine($"RUN model={r.Model} \n\nprompt={r.PromptId} \n\niter={r.Iteration} \n\nclass={r.Classification} \n\npoints={r.Points}\n\nAgent output:\n{r.AgentOutput.ToJsonString()}\n\n");
            }
            foreach (var a in aggregates)
            {
                Console.WriteLine($"AGG model={a.Model} \n\nprompt={a.PromptId} \n\nruns={a.Runs} \n\navgPoints={a.AveragePoints:F2}");
            }
        }

        if ((cliConfig.OutputMode & OutputMode.Json) == OutputMode.Json)
        {
            var outObj = new { results = allRunResults, aggregates };
            Console.WriteLine(outObj.ToJsonString());
            Logger.Log("Emitting results as JSON", Logger.LogLevel.Info);
        }
    }

    static Classification ParseClassification(ProcessOutput evalOutput)
    {
        if (evalOutput.StdOut?.Contains("SUCCESS") == true) return Classification.Success;
        if (evalOutput.StdOut?.Contains("PARTIAL") == true) return Classification.Partial;
        if (evalOutput.StdOut?.Contains("FAILURE") == true) return Classification.Failure;

        return Classification.Failure;
    }
}

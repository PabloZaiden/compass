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

        var cfg = JsonSerializer.Deserialize<EvaluationConfig>(
            File.ReadAllText(cliConfig.ConfigFile),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (cfg is null) throw new("Failed to parse config file: " + cliConfig.ConfigFile);

        var allRunResults = new List<RunResult>();

        foreach (var model in cfg.Models)
        {
            foreach (var prompt in cfg.Prompts)
            {
                for (int i = 1; i <= cliConfig.RunCount; i++)
                {
                    IAgent agent;
                    if (cliConfig.UseCache)
                    {
                        agent = new CachedAgent(new GithubCopilot());
                    }
                    else
                    {
                        agent = new GithubCopilot();
                    }

                    await ProcessUtils.Git(cliConfig.RepoPath, "reset --hard");
                    await ProcessUtils.Git(cliConfig.RepoPath, "clean -fd");

                    var agentProcessOutput = await agent.Execute(prompt.Prompt, model, cliConfig.RepoPath);

                    var diff = await ProcessUtils.Git(cliConfig.RepoPath, "--no-pager diff");

                    var agentOutput = new AgentOutput
                    {
                        StdOut = agentProcessOutput.StdOut,
                        StdErr = agentProcessOutput.StdErr,
                        GitDiff = diff.StdOut
                    };

                    var tempResultFile = Path.GetTempFileName() + ".json";
                    File.WriteAllText(tempResultFile, JsonSerializer.Serialize(agentOutput));

                    var evalPrompt = generalPrompts.Evaluator
                        .Replace("{{RESULT_FILE_PATH}}", tempResultFile)
                        .Replace("{{EXPECTED}}", prompt.Expected);

                    var evalOutput = await agent.Execute(evalPrompt, model, cliConfig.RepoPath);

                    var classification = ParseClassification(evalOutput);

                    int points = (int)classification;

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

        if ((cliConfig.OutputMode & OutputMode.StdOut) == OutputMode.StdOut)
        {
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

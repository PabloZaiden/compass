namespace Compass.Tests;

using System.Text;
using System.Text.Json;
using Compass.Agents;
using Xunit;

public class EndToEndTests
{
    private async Task SelfTest(Agent.Types agentType, string model, string evalModel)
    {
        var repoRoot = Utils.RepoRoot();
        var configPath = Path.Combine(repoRoot, "Compass", "config", "sample-config.json");

        Assert.True(File.Exists(configPath), $"Expected config file at {configPath}");

        var promptCount = JsonDocument.Parse(File.ReadAllText(configPath))
            .RootElement.GetProperty("prompts")
            .GetArrayLength();

        var originalCwd = Directory.GetCurrentDirectory();
        Directory.SetCurrentDirectory(repoRoot);

        var stringBuilder = new StringBuilder();
        Logger.Writers.Add(new StringWriter(stringBuilder));

        string result;
        try
        {
            var runner = new Runner();
            result = await runner.Run(new[]
            {
                "--repo-path", repoRoot,
                "--config", configPath,
                "--agent-type", agentType.ToString(),
                "--model", model,
                "--eval-model", evalModel,
                "--runs", "1",
                "--loglevel", "verbose"
            });
        }
        finally
        {
            Directory.SetCurrentDirectory(originalCwd);
            Logger.Writers = [Console.Out];
        }

        var output = stringBuilder.ToString();
        
        Assert.DoesNotContain("Error running process:", output, StringComparison.OrdinalIgnoreCase);

        var outputJson = JsonDocument.Parse(result);

        Logger.Log("End-to-end test completed. Output JSON:");    
        Logger.Log(result);

        //assert that there is a property called "aggregates" with 2 items (one per prompt)
        Assert.True(outputJson.RootElement.TryGetProperty("aggregates", out var aggregates));
        Assert.Equal(promptCount, aggregates.GetArrayLength());
    }    

    [Fact]
    public Task SelfTestGithubCopilot()
    {
        return SelfTest(Agent.Types.GithubCopilot, "gpt-5.1-codex-mini", "gpt-5.1-codex-mini");
    }

    [Fact]
    public Task SelfTestCodex()
    {
        return SelfTest(Agent.Types.Codex, "gpt-5.1-codex-mini", "gpt-5.1-codex-mini");
    }
}


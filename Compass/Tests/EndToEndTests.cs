namespace Compass.Tests;

using System.Text;
using System.Text.Json;
using Xunit;

public class EndToEndTests
{
    [Fact]
    public async Task SmokeTest()
    {
        var repoRoot = Utils.RepoRoot();
        var configPath = Path.Combine(repoRoot, "Compass", "config", "sample-config.json");

        Assert.True(File.Exists(configPath), $"Expected config file at {configPath}");

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
                "--agent-type", "githubcopilot",
                "--model", "gpt-5.1-codex-mini",
                "--eval-model", "gpt-4o",
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

        //assert that there is a property called "aggregates" with 4 items (one per tested model and prompt)
        Assert.True(outputJson.RootElement.TryGetProperty("aggregates", out var aggregates));
        Assert.Equal(2, aggregates.GetArrayLength());
    }
}


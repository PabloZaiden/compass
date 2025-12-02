namespace Compass.Tests;

using System.Text;
using Xunit;

public class EndToEndTests
{
    [Fact]
    public async Task SmokeTest()
    {
        var repoRoot = RepoRootLocator.Find();
        var configPath = Path.Combine(repoRoot, "Compass", "config", "sample-config.json");

        Assert.True(File.Exists(configPath), $"Expected config file at {configPath}");

        var originalCwd = Directory.GetCurrentDirectory();
        Directory.SetCurrentDirectory(repoRoot);

        var stringBuilder = new StringBuilder();
        Logger.Writer = new StringWriter(stringBuilder);

        try
        {
            await Program.Main(new[]
            {
                "--repo-path", repoRoot,
                "--config", configPath
            });
        }
        finally
        {
            Directory.SetCurrentDirectory(originalCwd);
            Logger.Writer = Console.Out;
        }

        var output = stringBuilder.ToString();
        System.Console.WriteLine("=== End-to-End Test Output ===");
        System.Console.WriteLine(output);

        Assert.DoesNotContain("Error running process:", output, StringComparison.OrdinalIgnoreCase);

        Assert.Contains("\"aggregates\"", output, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("gpt-5", output, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class ConsoleCapture : IDisposable
    {
        private readonly StringWriter _writer = new();
        private readonly TextWriter _originalOut = Console.Out;

        public ConsoleCapture()
        {
            Console.SetOut(_writer);
        }

        public string GetOutput() => _writer.ToString();

        public void WriteToOriginal(string text)
        {
            _originalOut.WriteLine(text);
            _originalOut.Flush();
        }

        public void Dispose()
        {
            Console.SetOut(_originalOut);
            _writer.Dispose();
        }
    }

    // Walks up from the test output directory to find the repo root reliably.
    private static class RepoRootLocator
    {
        public static string Find()
        {
            var current = Path.GetFullPath(AppContext.BaseDirectory);

            while (!string.IsNullOrEmpty(current))
            {
                if (File.Exists(Path.Combine(current, "compass.sln")))
                {
                    return current;
                }

                var parent = Directory.GetParent(current);
                if (parent is null)
                {
                    break;
                }

                current = parent.FullName;
            }

            throw new InvalidOperationException("Unable to locate repository root");
        }
    }
}


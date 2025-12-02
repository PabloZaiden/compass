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

		using var shimScope = new ToolShimScope();
		using var consoleCapture = new ConsoleCapture();

		var originalCwd = Directory.GetCurrentDirectory();
		Directory.SetCurrentDirectory(repoRoot);

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
		}

		var output = consoleCapture.GetOutput();
		consoleCapture.WriteToOriginal(output);

        Assert.DoesNotContain("Error running process:", output, StringComparison.OrdinalIgnoreCase);
        
		Assert.Contains("\"aggregates\"", output, StringComparison.OrdinalIgnoreCase);
		Assert.Contains("gpt-5", output, StringComparison.OrdinalIgnoreCase);
	}

	// Provides no-op stand-ins for git/copilot so the smoke test stays hermetic.
	private sealed class ToolShimScope : IDisposable
	{
		private readonly string _tempDirectory;
		private readonly string _originalPath;

		public ToolShimScope()
		{
			_tempDirectory = Directory.CreateDirectory(Path.Combine(Path.GetTempPath(), $"compass-tests-{Guid.NewGuid():N}")).FullName;

			WriteShim("git", GitShimPosix, GitShimWindows);
			WriteShim("copilot", CopilotShimPosix, CopilotShimWindows);

			_originalPath = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
			Environment.SetEnvironmentVariable("PATH", _tempDirectory + Path.PathSeparator + _originalPath);
		}

		public void Dispose()
		{
			Environment.SetEnvironmentVariable("PATH", _originalPath);
			try
			{
				Directory.Delete(_tempDirectory, true);
			}
			catch
			{
				// best effort cleanup
			}
		}

		private static readonly Encoding Utf8NoBom = new UTF8Encoding(false);

		private void WriteShim(string name, string posixScript, string windowsScript)
		{
			if (OperatingSystem.IsWindows())
			{
				var path = Path.Combine(_tempDirectory, $"{name}.cmd");
				File.WriteAllText(path, windowsScript, Utf8NoBom);
				return;
			}

			var shimPath = Path.Combine(_tempDirectory, name);
			File.WriteAllText(shimPath, posixScript, Utf8NoBom);
			File.SetUnixFileMode(shimPath, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
		}

		private const string CopilotShimPosix = "#!/bin/sh\necho \"SUCCESS\"\nexit 0\n";

		private const string CopilotShimWindows = "@echo off\necho SUCCESS\nexit /b 0\n";

		private const string GitShimPosix = "#!/bin/sh\nexit 0\n";

		private const string GitShimWindows = "@echo off\nexit /b 0\n";
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


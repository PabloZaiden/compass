using System.Diagnostics;

namespace Compass.Agents;

public class Codex : Agent
{
    public override string Name => "Codex";

    public override async Task EnsureLogin()
    {
        var checkLogin = await ProcessUtils.Run(
            Environment.CurrentDirectory,
            "codex",
            "login status");

        if (checkLogin.ExitCode != 0)
        {
            var loginProcess = Process.Start(new ProcessStartInfo
            {
                FileName = "codex",
                Arguments = "login --device-auth",
                WorkingDirectory = Environment.CurrentDirectory,
                RedirectStandardOutput = false,
                RedirectStandardError = false,
                UseShellExecute = false
            }) ?? throw new InvalidOperationException("Failed to start Codex login.");

            await loginProcess.WaitForExitAsync();

            if (loginProcess.ExitCode != 0)
            {
                throw new Exception("Codex login failed.");
            }
        }
    }

    public override async Task<AgentOutput> Execute(string prompt, string model, string workingDirectory)
    {
        var processOutput = await ProcessUtils.Run(
            workingDirectory,
            "codex",
            $"exec --model {model.EscapeArg()} --sandbox danger-full-access {prompt.EscapeArg()}");

        string? agentOutput = processOutput.StdOut;

        Logger.Log($"Collecting git diff after agent execution", Logger.LogLevel.Verbose);

        var diff = await ProcessUtils.Git(workingDirectory, "--no-pager diff");

        return new AgentOutput()
        {
            StdOut = agentOutput,
            StdErr = processOutput.StdErr,
            GitDiff = diff.StdOut
        };
    }
}

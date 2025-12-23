namespace Compass.Agents;

public class OpenCode : Agent
{
    public override string Name => "OpenCode";

    public override Task EnsureLogin()
    {
        return Task.CompletedTask;
    }

    public override async Task<AgentOutput> Execute(string prompt, string model, string workingDirectory)
    {
        var processOutput = await ProcessUtils.Run(
            workingDirectory,
            "opencode",
            $"--model {model.EscapeArg()} {prompt.EscapeArg()}");

        Logger.Log($"Collecting git diff after agent execution", Logger.LogLevel.Verbose);
        
        var diff = await ProcessUtils.Git(workingDirectory, "--no-pager diff");

        return new AgentOutput()
        {
            StdOut = processOutput.StdOut,
            StdErr = processOutput.StdErr,
            GitDiff = diff.StdOut
        };
    }
}

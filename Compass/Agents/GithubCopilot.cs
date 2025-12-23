namespace Compass.Agents;

public class GithubCopilot : Agent
{
    public override string Name => "GitHub Copilot";

    public override Task EnsureLogin()
    {
        // do nothing for now, since there is no non-interactive way to check this.
        return Task.CompletedTask;
    }

    public override async Task<AgentOutput> Execute(string prompt, string model, string workingDirectory)
    {
        var processOutput = await ProcessUtils.Run(
            workingDirectory,
            "copilot",
            $"--silent --no-color --model {model.EscapeArg()} --allow-all-tools --allow-all-paths --add-dir {workingDirectory.EscapeArg()} -p {prompt.EscapeArg()}");

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

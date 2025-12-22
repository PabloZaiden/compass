namespace Compass.Agents;

public class Codex : Agent
{
    public override string Name => "Codex";

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

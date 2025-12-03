namespace Compass.Agents;

public class Codex : Agent
{
    public override string Name => "Codex";

    public override async Task<AgentOutput> Execute(string prompt, string model, string workingDirectory)
    {
        var processOutput = await ProcessUtils.Run(
            workingDirectory,
            "codex",
            $"--model {model.EscapeArg()} --dangerously-auto-approve-everything --full-auto --quiet {prompt.EscapeArg()}");

        // from the stdout, extract the last line that is not empty
        var lastNonEmptyLine = processOutput.StdOut?
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .LastOrDefault()?.Trim();

        Logger.Log($"Collecting git diff after agent execution", Logger.LogLevel.Verbose);
        
        var diff = await ProcessUtils.Git(workingDirectory, "--no-pager diff");

        return new AgentOutput()
        {
            StdOut = lastNonEmptyLine,
            StdErr = processOutput.StdErr,
            GitDiff = diff.StdOut
        };
    }
}

namespace Compass.Agents;

public class Codex : Agent
{
    public override string Name => "Codex";

    public override async Task<AgentOutput> Execute(string prompt, string model, string workingDirectory)
    {
        var processOutput = await ProcessUtils.Run(
            workingDirectory,
            "codex",
            $"exec --json --model {model.EscapeArg()} --sandbox danger-full-access {prompt.EscapeArg()}");

        string? agentOutput = null;

        if (!string.IsNullOrEmpty(processOutput.StdOut))
        {
            // The output has one JSON object per line
            var lines = processOutput.StdOut.Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
            {
                var json = System.Text.Json.JsonDocument.Parse(line);
                // check for a property "item" that contains another 
                // property "type" with value "agent_message"
                if (json.RootElement.TryGetProperty("item", out var itemElement) &&
                    itemElement.TryGetProperty("type", out var typeElement) &&
                    typeElement.GetString() == "agent_message")
                {
                    if (itemElement.TryGetProperty("text", out var textElement))
                    {
                        agentOutput = textElement.GetString();
                    }
                }
            }
        }

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

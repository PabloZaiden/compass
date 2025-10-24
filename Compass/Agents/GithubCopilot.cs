
namespace Compass.Agents;

public class GithubCopilot : IAgent
{
    public string Name => "GitHub Copilot";

    public async Task<ProcessOutput> Execute(string prompt, string model, string workingDirectory)
    {
        var agentOut = await ProcessUtils.Run(
            workingDirectory,
            "copilot",
            $"--model {model.EscapeArg()} --allow-all-tools --allow-all-paths --add-dir {workingDirectory.EscapeArg()} -p {prompt.EscapeArg()}");

        return agentOut;
    }
}

namespace Compass.Tests;

using Compass.Agents;
using Xunit;

public class AgentsTests
{
    private async Task BasicTest(Agent.Types agentType, string model)
    {
        var agent = Agent.Create(agentType);

        var output = await agent.Execute("Explain what this project is about.", model, Utils.RepoRoot());
        System.Console.WriteLine("StdOut:" + output.StdOut);
        System.Console.WriteLine("StdErr:" + output.StdErr);

        Assert.Equal(0, output.ExitCode);
        Assert.NotNull(output);
        Assert.NotNull(output.StdOut);
    }

    [Fact]
    public Task BasicTestGithubCopilot()
    {
        return BasicTest(Agent.Types.GithubCopilot, "gpt-5-mini");
    }

    [Fact]
    public Task BasicTestCodex()
    {
        return BasicTest(Agent.Types.Codex, "gpt-5-mini");
    }

    [Fact]
    public Task BasicTestOpenCode()
    {
        return BasicTest(Agent.Types.OpenCode, "opencode/gpt-5-nano");
    }
}


namespace Compass.Tests;

using Compass.Agents;
using Xunit;

public class AgentsTests
{
    [Fact]
    public async Task GithubCopilotBasicTest()
    {
        var agent = Agent.Create(Agent.Types.GithubCopilot);

        var output = await agent.Execute("Explain what this project is about.", "gpt-5-mini", Utils.RepoRoot());

        System.Console.WriteLine("StdOut:" + output.StdOut);
        System.Console.WriteLine("StdErr:" + output.StdErr);

        Assert.NotNull(output);
        Assert.NotNull(output.StdOut);
    }

    [Fact]
    public async Task CodexBasicTest()
    {
        var agent = Agent.Create(Agent.Types.Codex);

        var output = await agent.Execute("Explain what this project is about.", "gpt-5.1-codex-mini", Utils.RepoRoot());

        System.Console.WriteLine("StdOut:" + output.StdOut);
        System.Console.WriteLine("StdErr:" + output.StdErr);

        Assert.NotNull(output);
        Assert.NotNull(output.StdOut);
    }
}


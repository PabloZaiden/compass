namespace Compass.Tests;

using System.Text;
using System.Text.Json;
using Compass.Agents;
using Xunit;

public class AgentsTests
{
    [Fact]
    public async Task GithubCopilotTest()
    {
        var agent = Agent.Create(Agent.Types.GithubCopilot);

        var output = await agent.Execute("Explain what this project is about.", "gpt-4", Utils.RepoRoot());

        Assert.NotNull(output);
        Assert.NotNull(output.StdOut);
        Assert.Null(output.StdErr);
    }

    
}


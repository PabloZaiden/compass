namespace Compass.Agents;

public abstract class Agent
{
    public abstract string Name { get; }
    public abstract Task<AgentOutput> Execute(string prompt, string model, string workingDirectory);
    public abstract Task EnsureLogin();
    
    public static Agent Create(Types agentType)
    {
        return agentType switch
        {
            Types.GithubCopilot => new GithubCopilot(),
            Types.Codex => new Codex(),
            Types.OpenCode => new OpenCode(),
            _ => throw new ArgumentException("Unsupported agent type: " + agentType),
        };
    }

    public enum Types
    {
        GithubCopilot,
        Codex,
        OpenCode,
    }
}
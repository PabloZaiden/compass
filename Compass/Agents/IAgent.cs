namespace Compass.Agents;

public interface IAgent
{
    string Name { get; }
    Task<AgentOutput> Execute(string prompt, string model, string workingDirectory);
}
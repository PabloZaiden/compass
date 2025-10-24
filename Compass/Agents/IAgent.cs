namespace Compass.Agents;

public interface IAgent
{
    string Name { get; }
    Task<ProcessOutput> Execute(string prompt, string model, string workingDirectory);
}
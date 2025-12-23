namespace Compass;

record PromptSpec(string Id, string Prompt, string Expected);
record EvaluationConfig(List<string> Models, List<PromptSpec> Prompts);

class RunResult
{
    public string Model { get; set; } = "";
    public string PromptId { get; set; } = "";
    public int Iteration { get; set; }
    public AgentOutput AgentOutput { get; set; } = new();
    public ProcessOutput EvaluationOutput { get; set; } = new();
    public Classification Classification { get; set; } = Classification.Failure;
    public int Points { get; set; }
}

class AggregatedResult
{
    public string Model { get; set; } = "";
    public string PromptId { get; set; } = "";
    public double AveragePoints { get; set; }
    public int Runs { get; set; }
}


public class ProcessOutput
{
    public string? StdOut { get; set; }
    public string? StdErr { get; set; }
    public int ExitCode { get; set; }
}

public class AgentOutput : ProcessOutput
{
    public string? GitDiff { get; set; }
}

enum Classification
{
    Success = 10,
    Partial = 5,
    Failure = 0
}

enum OutputMode
{
    Detailed,
    Aggregated
}
using Compass.Agents;

namespace Compass;

class CLIConfig
{
    private const string DefaultEvaluationModel = "gpt-4o";

    public string RepoPath { get; set; } = "";
    public string ConfigFile { get; set; } = "";
    public int RunCount { get; set; } = 1;
    public OutputMode OutputMode { get; set; } = OutputMode.Aggregated;
    public bool VerboseLogging { get; set; } = false;
    public bool UseCache { get; set; } = true;
    public string EvalModel { get; set; } = DefaultEvaluationModel;
    public Agent.Types AgentType { get; set; }
    public CLIConfig()
    {
    }

    static string? GetArg(string[] args, string name)
    {
        var index = Array.IndexOf(args, name);

        if (index < 0)
        {
            return null;
        }

        if (index >= 0 && index + 1 < args.Length)
        {
            return args[index + 1];
        }

        // if it's the last arg and has no value, return the name itself (for flags)
        return name;
    }

    public static CLIConfig FromArgs(string[] args)
    {
        string? repoPath = GetArg(args, "--repo-path");
        string? configFile = GetArg(args, "--config");

        string runsCount = GetArg(args, "--runs") ?? "1";
        string outputMode = GetArg(args, "--output") ?? OutputMode.Aggregated.ToString();
        string? evalModel = GetArg(args, "--eval-model");
        string agentTypeStr = GetArg(args, "--agent-type") ?? Agent.Types.GithubCopilot.ToString();

        bool useCache = GetArg(args, "--no-cache") == null;
        bool verboseLogging = GetArg(args, "--verbose") != null;

        if (repoPath == null || configFile == null)
        {
            throw new ArgumentException("Required: --repo-path <path> --config <file>");
        }

        if (!Directory.Exists(repoPath))
        {
            throw new ArgumentException("Repo path not found");
        }

        if (!File.Exists(configFile))
        {
            throw new ArgumentException("Config file not found");
        }

        if (!int.TryParse(runsCount, out int runs) || runs < 1)
        {
            throw new ArgumentException("Invalid --runs");
        }

        if (!Enum.TryParse<OutputMode>(outputMode, true, out var parsedOutputMode))
        {
            throw new ArgumentException("Invalid --output");
        }

        if (Enum.TryParse<Agent.Types>(agentTypeStr, true, out var parsedAgentType) == false)
        {
            throw new ArgumentException("Invalid --agent-type");
        }

        return new CLIConfig
        {
            RepoPath = repoPath,
            ConfigFile = configFile,
            RunCount = runs,
            OutputMode = parsedOutputMode,
            EvalModel = evalModel ?? DefaultEvaluationModel,
            UseCache = useCache,
            VerboseLogging = verboseLogging,
            AgentType = parsedAgentType
        };
    }
}
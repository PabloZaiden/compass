namespace Compass;

class CLIConfig
{
    private const string DefaultEvaluationModel = "gpt-4o";

    public string RepoPath { get; set; } = "";
    public string ConfigFile { get; set; } = "";
    public int RunCount { get; set; } = 1;
    public OutputMode OutputMode { get; set; } = OutputMode.Aggregated;
    public bool UseCache { get; set; } = true;
    public string EvalModel { get; set; } = DefaultEvaluationModel;

    public CLIConfig()
    {
    }

    static string? GetArg(string[] args, string name)
    {
        var idx = Array.IndexOf(args, name);
        if (idx >= 0 && idx + 1 < args.Length) return args[idx + 1];
        return null;
    }

    public static CLIConfig FromArgs(string[] args)
    {
        string? repoPath = GetArg(args, "--repo-path");
        string? configFile = GetArg(args, "--config");

        string runsCount = GetArg(args, "--runs") ?? "1";
        string outputMode = GetArg(args, "--output") ?? OutputMode.Aggregated.ToString();
        string? evalModel = GetArg(args, "--eval-model");

        bool useCache = GetArg(args, "--no-cache") == null;

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

        return new CLIConfig
        {
            RepoPath = repoPath,
            ConfigFile = configFile,
            RunCount = runs,
            OutputMode = parsedOutputMode,
            EvalModel = evalModel ?? DefaultEvaluationModel,
            UseCache = useCache
        };
    }
}
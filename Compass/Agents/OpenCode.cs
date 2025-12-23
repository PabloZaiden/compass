namespace Compass.Agents;

public class OpenCode : Agent
{
    public override string Name => "OpenCode";

    private string _command = "opencode";

    public OpenCode() : base()
    {
        Logger.Log("Checking for OpenCode binary in PATH", Logger.LogLevel.Verbose);

        var opencodePath = ProcessUtils.Run(".", "which", "opencode").Result;
        if (opencodePath.ExitCode != 0)
        {
            Logger.Log("OpenCode binary not found in PATH, checking ~/.opencode/bin", Logger.LogLevel.Verbose);
            
            var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            var potentialPath = Path.Combine(home, ".opencode", "bin", "opencode");
            if (File.Exists(potentialPath))
            {
                Logger.Log("Found OpenCode binary in ~/.opencode/bin", Logger.LogLevel.Verbose);
                _command = potentialPath;
            }
            else
            {
                throw new Exception("OpenCode binary not found in PATH or ~/.opencode/bin");
            }
        }

        Logger.Log($"Found OpenCode binary at: {_command}", Logger.LogLevel.Verbose);
    }

    public override Task EnsureLogin()
    {
        return Task.CompletedTask;
    }

    public override async Task<AgentOutput> Execute(string prompt, string model, string workingDirectory)
    {
        var processOutput = await ProcessUtils.Run(
            workingDirectory,
            _command,
            $"run --model {model.EscapeArg()} {prompt.EscapeArg()}");

        Logger.Log($"Collecting git diff after agent execution", Logger.LogLevel.Verbose);
        
        var diff = await ProcessUtils.Git(workingDirectory, "--no-pager diff");

        return new AgentOutput()
        {
            StdOut = processOutput.StdOut,
            StdErr = processOutput.StdErr,
            GitDiff = diff.StdOut
        };
    }
}

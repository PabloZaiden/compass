using System.Diagnostics;
using System.Text.Json;

namespace Compass;

public static class StringExtensions
{
    public static string EscapeArg(this string arg)
    {
        return "\"" + arg.Replace("\"", "\\\"") + "\"";
    }

    public static string ToJsonString(this object obj)
    {
        return JsonSerializer.Serialize(obj, new JsonSerializerOptions { WriteIndented = true });
    }
}

public static class ProcessUtils
{
    public static async Task<ProcessOutput> Git(string cwd, string arguments) => await Run(cwd, "git", arguments);

    public static async Task<ProcessOutput> Run(string workingDirectory, string fileNameOrCommand, string arguments)
    {
        Logger.Log($"Running command: {fileNameOrCommand} {arguments} in {workingDirectory}", Logger.LogLevel.Verbose);
        try
        {
            var psi = new ProcessStartInfo(fileNameOrCommand, arguments)
            {
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            var p = Process.Start(psi)!;

            string stdout = await p.StandardOutput.ReadToEndAsync();
            string stderr = await p.StandardError.ReadToEndAsync();
            await p.WaitForExitAsync();

            return new ProcessOutput(stdout, stderr);
        }
        catch (Exception ex)
        {
            Logger.Log($"Error running process: {ex.Message}", Logger.LogLevel.Error);
            return new ProcessOutput(null, $"PROCESS_ERROR: {ex.Message}");
        }
    }
}

public static class Logger
{
    public enum LogLevel
    {
        Verbose = 0,
        Info = 1,
        Warning = 2,
        Error = 3
    }

    private static LogLevel CurrentLogLevel = LogLevel.Info;

    public static void Log(string message, object obj, LogLevel level = LogLevel.Info)
    {
        Log($"{message}\n{obj.ToJsonString()}", level);
    }

    public static void Log(string message, LogLevel level = LogLevel.Info)
    {
        if (level < CurrentLogLevel) return;

        var text = $"[LOG {DateTime.Now:HH:mm:ss}] {message}";
        LogToConsole(text);
    }

    public static void LogToConsole(string text)
    {
        Console.WriteLine(text);
    }
}
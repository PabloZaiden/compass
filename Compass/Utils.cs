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
        catch (Exception ex) { return new ProcessOutput(null, $"PROCESS_ERROR: {ex.Message}"); }
    }
}
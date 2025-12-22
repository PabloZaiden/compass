namespace Compass;

public static class Logger
{
    public enum LogLevel
    {
        Verbose = 0,
        Info = 1,
        Warning = 2,
        Error = 3
    }

    public static List<TextWriter> Writers { get; set; } = [Console.Out];

    public static LogLevel CurrentLogLevel = LogLevel.Verbose;

    public static void Log(string message, object obj, LogLevel level = LogLevel.Info, bool includeTimestamp = true)
    {
        Log($"{message}\n{obj.ToJsonString()}", level, includeTimestamp);
    }

    public static void Log(string message, LogLevel level = LogLevel.Info, bool includeTimestamp = true)
    {
        if (level < CurrentLogLevel) return;

        message = System.Text.RegularExpressions.Regex.Unescape(message);
        if (includeTimestamp)
        {
            message = $"[{DateTime.Now:HH:mm:ss}] {message}";
        }
        var text = message;

        LogToWriter(text);
    }

    public static void LogToWriter(string text)
    {
        if (Writers is not null)
        {
            foreach (var writer in Writers)
            {
                writer.WriteLine(text);
            }
        }
    }
}
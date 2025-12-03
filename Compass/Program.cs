namespace Compass;

public static class Program
{
    public static async Task Main(string[] args) {
        var runner = new Runner();
        var result = await runner.Run(args);

        Logger.Log(result, Logger.LogLevel.Info, false);
    }
}

namespace Compass.Tests;

static class Utils
{
    public static string RepoRoot()
    {
        var current = Path.GetFullPath(AppContext.BaseDirectory);

        while (!string.IsNullOrEmpty(current))
        {
            if (File.Exists(Path.Combine(current, "compass.sln")))
            {
                return current;
            }

            var parent = Directory.GetParent(current);
            if (parent is null)
            {
                break;
            }

            current = parent.FullName;
        }

        throw new InvalidOperationException("Unable to locate repository root");
    }
}
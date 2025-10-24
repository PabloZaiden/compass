using System.Text.Json;

namespace Compass;

public class Prompts
{
    private const string ConfigDirectory = "Compass/config";
    private const string PromptsFileName = "prompts.json";

    private JsonElement _config;

    public static string GetPromptsFilePath()
    {
        return Path.Combine(ConfigDirectory, PromptsFileName);
    }

    public Prompts() : this(GetPromptsFilePath())
    {
    }

    public Prompts(string filePath)
    {
        _config = JsonDocument.Parse(File.ReadAllText(filePath)).RootElement;
    }

    public string Evaluator
    {
        get
        {
            return _config.GetProperty("evaluator").GetString() ?? string.Empty;
        }
    }
}
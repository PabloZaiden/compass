using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Compass.Agents
{
    public class CachedAgent : IAgent
    {
        private readonly IAgent _innerAgent;
        
        private string CacheDir => Path.Combine(".cache", Name);
        public string Name => _innerAgent.Name + " (Cached)";

        public CachedAgent(IAgent innerAgent)
        {
            _innerAgent = innerAgent;
            Directory.CreateDirectory(CacheDir);
        }

        private string GetCacheKey(string prompt, string model, string workingDirectory)
        {
            string id = $"{prompt}-{model}-{workingDirectory}";
            byte[] hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(id));
            return Convert.ToBase64String(hashBytes);
        }

        public async Task<ProcessOutput> Execute(string prompt, string model, string workingDirectory)
        {
            var cacheKey = GetCacheKey(prompt, model, workingDirectory);
            var cacheFile = Path.Combine(CacheDir, cacheKey + ".json");

            if (File.Exists(cacheFile))
            {
                var cachedJson = await File.ReadAllTextAsync(cacheFile);
                var cachedOutput = await JsonSerializer.DeserializeAsync<ProcessOutput>(
                    new MemoryStream(Encoding.UTF8.GetBytes(cachedJson))
                );

                if (cachedOutput != null)
                {
                    Logger.Log($"Cache hit for key: {cacheKey}", Logger.LogLevel.Verbose);
                    return cachedOutput;
                }
            }
            Logger.Log($"Cache miss for key: {cacheKey}", Logger.LogLevel.Verbose);

            var output = await _innerAgent.Execute(prompt, model, workingDirectory);

            Logger.Log($"Caching output for key: {cacheKey}", Logger.LogLevel.Verbose);
            var outputJson = JsonSerializer.Serialize(output, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(cacheFile, outputJson);

            return output;
        }
    }
}
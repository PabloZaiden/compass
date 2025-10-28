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

            Logger.Log($"Initializing cache directory at: {CacheDir}", Logger.LogLevel.Verbose);
            Directory.CreateDirectory(CacheDir);
        }

        private string GetCacheKey(string prompt, string model, string workingDirectory)
        {
            string id = $"{prompt}-{model}-{workingDirectory}";
            Logger.Log($"Generating cache key for id: {id}", Logger.LogLevel.Verbose);
            byte[] hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(id));
            return Convert.ToBase64String(hashBytes).Replace("/", "_").Replace("+", "-").TrimEnd('=');
        }

        public async Task<ProcessOutput> Execute(string prompt, string model, string workingDirectory)
        {
            var cacheKey = GetCacheKey(prompt, model, workingDirectory);

            var cacheFile = Path.Combine(CacheDir, cacheKey + ".json");
            Logger.Log($"Looking for cache file: {cacheFile}", Logger.LogLevel.Verbose);

            if (File.Exists(cacheFile))
            {
                Logger.Log($"Found cache file: {cacheFile}", Logger.LogLevel.Verbose);

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

            Logger.Log($"Writing cache file: {cacheFile}", Logger.LogLevel.Verbose);
            await File.WriteAllTextAsync(cacheFile, outputJson);

            return output;
        }
    }
}
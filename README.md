# Compass

Console tool to benchmark Coding agents using different agents and models across prompts against expected outcomes.

## Requirements

- Git
- .NET 9 SDK
- `copilot` in path for GitHub Copilot CLI
- `codex` in path for OpenAI Codex CLI
- `opencode` in path for OpenCode CLI

## Usage

```bash
dotnet run --project Compass -- \
  --repo-path ../path-to-target-repo \
  --config Compass/sample-config.json \
  --runs 3 \
  --output detailed \
  --eval-model gpt-4o
```

## Docker

```bash
docker build -f Dockerfile -t compass .

docker run --rm -ti \
  -e GH_TOKEN=$(gh auth token) \
  -v /absolute/path/to/target-repo:/target-repo \
  -v /absolute/path/to/Compass/config.json:/config.json \
  compass \
  --repo-path /target-repo \
  --config /config.json \
  --runs 3 \
  --output detailed \
  --eval-model gpt-4o
```

Mount your configuration as `/config.json` and repo to evaluate at `/target-repo` so the container can reset git state via git commands. The image already bundles `Compass/config`, but you can bind-mount your own config folder if desired.

For instance, to run the sample configuration against Compass itself:

```bash
docker run --rm -ti \
  -e GH_TOKEN=$(gh auth token) \
  -v $(pwd):/target-repo \
  -v $(pwd)/Compass/config/sample-config.json:/config.json \
  compass \
  --repo-path /target-repo \
  --config /config.json \
  --runs 3 \
  --output detailed \
  --eval-model gpt-4o
```


## Configuration File

See `Compass/config/sample-config.json` for structure.

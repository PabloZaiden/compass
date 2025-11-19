# Compass

Console tool to benchmark Coding agents using different agents and models across prompts against expected outcomes.

## Requirements

- .NET 9 SDK
- `copilot` in path for GitHub Copilot CLI

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
docker build -t compass .

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

Mount your evaluation repo at `/workspace/target-repo` (or adjust the path) so the container can reset git state via git commands. The image already bundles `Compass/config`, but you can bind-mount your own config folder if desired.

## Configuration File

See `Compass/config/sample-config.json` for structure.


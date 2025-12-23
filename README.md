# Compass

Console tool to benchmark Coding agents using different agents and models across prompts against expected outcomes.

## Supported Agents

- GitHub Copilot
- OpenAI Codex
- Anthropic Claude (work-in-progress)
- OpenCode (work-in-progress)

## Requirements

- Git
- .NET 9 SDK
- `copilot` in path for GitHub Copilot CLI
- `codex` in path for OpenAI Codex CLI
- `opencode` in path for OpenCode CLI
- `claude` in path for Anthropic Claude CLI

## Optional Requirements
- `az` authenticated for Azure AI Foundry models

## Usage

```bash
dotnet run --project Compass -- \
  --repo-path ../path-to-target-repo \
  --config Compass/sample-config.json \
  --agent-type githubcopilot \
  --model gpt-5.1-codex-mini \
  --eval-model gpt-4o \
  --runs 3 \
  --output detailed
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
  --agent-type githubcopilot \
  --model gpt-5.1-codex-mini \
  --eval-model gpt-4o \
  --runs 3 \
  --output detailed
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
  --agent-type githubcopilot \
  --model gpt-5.1-codex-mini \
  --eval-model gpt-4o \
  --runs 3 \
  --output detailed
```


## Configuration File

See `Compass/config/sample-config.json` for structure.

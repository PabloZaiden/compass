# Compass

Console tool to benchmark Coding agents using different agents and models across prompts against expected outcomes.

## Supported Agents

- GitHub Copilot
- OpenAI Codex
- Anthropic Claude (work-in-progress)
- OpenCode (work-in-progress)

## Requirements

- Git
- Bun runtime (https://bun.sh)
- **At least one of the following agent CLIs must be installed and configured:**
  - `copilot` in path for GitHub Copilot CLI (install via `gh extension install github/gh-copilot`)
  - `codex` in path for OpenAI Codex CLI
  - `opencode` in path for OpenCode CLI
  - `claude` in path for Anthropic Claude CLI

## Optional Requirements
- `az` authenticated for Azure AI Foundry models

## Installation

Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

Install dependencies:
```bash
bun install
```

Build the executable:
```bash
bun run build
```

This creates a single-file executable called `compass` that can be run standalone.

## Setting Up Agents

### GitHub Copilot
```bash
# Install GitHub CLI if not already installed
# Install the Copilot extension
gh extension install github/gh-copilot

# Authenticate (if needed)
gh auth login
```

### OpenCode
Follow the instructions at the OpenCode project to install the CLI.

### Codex
Install the Codex CLI following the official documentation.

## Usage

Using the executable:
```bash
./compass \
  --repo-path ../path-to-target-repo \
  --config Compass/config/sample-config.json \
  --agent-type githubcopilot \
  --model gpt-5.1-codex-mini \
  --eval-model gpt-4o \
  --runs 3 \
  --output detailed
```

Or run directly with Bun:
```bash
bun run dev -- \
  --repo-path ../path-to-target-repo \
  --config Compass/config/sample-config.json \
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

## Development

Run tests:
```bash
bun test
```

Run in development mode:
```bash
bun run dev -- [arguments]
```

## Testing Without Real Agents

**Note:** This project is designed to work with real AI coding agents. It does not use mocks or simulations. To properly test the functionality, you must have at least one of the supported agent CLIs installed and configured. The tests will fail if no agents are available, which is expected behavior.

# Compass

Console tool to benchmark Coding agents using different agents and models across prompts against expected outcomes.

## Supported Agents

- GitHub Copilot
- OpenAI Codex
- OpenCode
- Google Gemini CLI
- Claude Code (coming soon)

## Requirements

- Git
- Bun runtime (https://bun.sh/)
- `copilot` in path for GitHub Copilot CLI
- `codex` in path for OpenAI Codex CLI
- `opencode` in path for OpenCode CLI
- `gemini` in path for Google Gemini CLI
- `claude` in path for Anthropic Claude CLI

## Optional Requirements

- `az` authenticated for Azure AI Foundry models

## Usage

```bash
bun src/index.ts \
  --repo "/path/to/target/repo" \
  --fixture "/path/to/fixture.json" \
  --agent OpenCode
```

Every option can be specified via command-line arguments or environment variables. Command-line arguments should use `--` prefix and camel-case names, while environment variables should use `COMPASS_` prefix and uppercase with underscores.

Command-line arguments take precedence over environment variables.

For a full list of options, check `src/config/config.ts`

## Docker

```bash
docker run --rm -ti \
  -v /absolute/path/to/target-repo:/target-repo \
  -v /absolute/path/to/fixture.json:/fixture.json \
  ghcr.io/pablozaiden/compass:latest \
  --repo /target-repo \
  --fixture /fixture.json \
  --agent OpenCode
```

Mount your fixture as `/fixture.json` and repo to evaluate at `/target-repo` so the container can reset git state via git commands.

For instance, to run the sample configuration against Compass itself:

```bash
docker run --rm -ti \
  -v $(pwd):/target-repo \
  -v $(pwd)/src/sample-fixture.json:/fixture.json \
  compass \
  --repo /target-repo \
  --fixture /fixture.json \
  --agent OpenCode
```

## Fixture File

See `src/sample-fixture.json` for structure.

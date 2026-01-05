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
- [Bun runtime](https://bun.sh/) (if not using Docker or pre-built binaries)
- `copilot` in path for GitHub Copilot CLI
- `codex` in path for OpenAI Codex CLI
- `opencode` in path for OpenCode CLI
- `gemini` in path for Google Gemini CLI
- `claude` in path for Anthropic Claude CLI

## Optional Requirements

- `az` authenticated for Azure AI Foundry models

## Usage

Compass supports three commands:

### Interactive Mode (default)

Launch the interactive Terminal UI:

```bash
bun start
# or explicitly:
bun start interactive
```

### Run Mode

Execute the benchmark runner:

```bash
bun src/index.ts run \
  --repo "/path/to/target/repo" \
  --fixture "/path/to/fixture.json" \
  --agent OpenCode
```

### Help

Show all available options:

```bash
bun src/index.ts help
```

### Options

Every option can be specified via command-line arguments or environment variables. Command-line arguments should use `--` prefix (e.g., `--repo`), while environment variables should use `COMPASS_` prefix and uppercase with underscores (e.g., `COMPASS_REPO`).

Command-line arguments take precedence over environment variables.

| Option | Environment Variable | Required | Description |
|--------|---------------------|----------|-------------|
| `--repo` | `COMPASS_REPO` | Yes | Path to the repository to evaluate |
| `--fixture` | `COMPASS_FIXTURE` | Yes | Path to the fixture JSON file |
| `--agent` | `COMPASS_AGENT` | Yes | Agent type (Copilot, Codex, OpenCode, ClaudeCode, Gemini) |
| `--iterations` | `COMPASS_ITERATIONS` | No | Number of iterations per prompt (default: 1) |
| `--output-mode` | `COMPASS_OUTPUT_MODE` | No | Output format: Detailed, Aggregated (default) |
| `--log-level` | `COMPASS_LOG_LEVEL` | No | Logging verbosity (default: Info) |
| `--use-cache` | `COMPASS_USE_CACHE` | No | Enable caching of agent responses |
| `--stop-on-error` | `COMPASS_STOP_ON_ERROR` | No | Stop on first error (default: true) |
| `--allow-full-access` | `COMPASS_ALLOW_FULL_ACCESS` | No | Allow full repository access (default: true) |
| `--model` | `COMPASS_MODEL` | No | Model to use for the agent |
| `--eval-model` | `COMPASS_EVAL_MODEL` | No | Model to use for evaluation |

## Terminal UI

The default mode launches an interactive Terminal UI. To start it, simply run:

```bash
bun start
```

Features:
- Interactive form for all CLI options.
- Live `tslog` stream in the right panel and spinner-based activity indicator while running
- Pretty-printed JSON results inside the TUI (no JSON is written to stdout when TUI is enabled)
- "Show as CLI flags" overlay to copy the equivalent command

## Docker

```bash
docker run --rm -ti \
  -v /absolute/path/to/target-repo:/target-repo \
  -v /absolute/path/to/fixture.json:/fixture.json \
  ghcr.io/pablozaiden/compass:latest \
  run \
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
  run \
  --repo /target-repo \
  --fixture /fixture.json \
  --agent OpenCode
```

## Fixture File

See `src/sample-fixture.json` for structure.

# Compass

Console tool to benchmark Coding agents using different agents and models across prompts against expected outcomes.

## Monorepo Structure

This repository is organized as a monorepo with the following packages:

| Package | Description |
|---------|-------------|
| [compass](packages/compass/README.md) | Main CLI/TUI application for benchmarking AI coding agents |
| [terminator](packages/terminator/README.md) | CLI/TUI application framework with auto-generated terminal UIs |

```
packages/
├── compass/     # Benchmarking tool (uses terminator)
└── terminator/  # CLI/TUI framework library
```

## Installation

This package is hosted on GitHub Package Registry. To install, you need to be authenticated with GitHub CLI:

```bash
curl -fsSL -H "Authorization: token $(gh auth token)" https://raw.githubusercontent.com/pablozaiden/compass/main/install.sh | bash
```

> **Note:** Make sure you have [GitHub CLI](https://cli.github.com/) installed, and authenticated with the `read:packages` scope (`gh auth login --scopes read:packages`).

### Install Development Build

To install the latest development build from the `main` branch:

```bash
curl -fsSL -H "Authorization: token $(gh auth token)" https://raw.githubusercontent.com/pablozaiden/compass/main/install.sh | COMPASS_VERSION=0.0.0-development bash
```

> **⚠️ Warning:** This installs a development build from the `main` branch, which may contain unstable or untested features, breaking changes, or bugs not present in official releases. For production use, prefer the standard installation method above.

## Supported Agents

- GitHub Copilot (`copilot`)
- OpenAI Codex (`codex`)
- OpenCode (`opencode`)
- Google Gemini CLI (`gemini`)
- Claude Code (`claudeCode`)

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

Compass supports the following commands:

### Interactive Mode (default)

Launch the interactive Terminal UI by running compass without arguments:

```bash
compass
```

### Run Mode

Execute the benchmark runner:

```bash
compass run \
  --repo "/path/to/target/repo" \
  --fixture "/path/to/fixture.json" \
  --agent opencode
```

### Generate Mode

Auto-generate a fixture file for a repository using an AI agent:

```bash
compass generate \
  --repo "/path/to/target/repo" \
  --agent opencode \
  --count 10
```

The agent will analyze the repository and create a `{repo-folder-name}.compass.json` fixture file with the specified number of prompts and expectations.

You can optionally steer the generation with additional instructions:

```bash
compass generate \
  --repo "/path/to/target/repo" \
  --agent copilot \
  --count 15 \
  --steering "Focus on API endpoints and error handling"
```

### Check Mode

Verify that required agent dependencies are installed:

```bash
compass check                    # Check all agent dependencies
compass check --agent copilot    # Check copilot dependencies only
```

### Version

Show the application version:

```bash
compass version
```

### Help

Show all available options:

```bash
compass help
compass run help      # Help for run command
compass generate help # Help for generate command
```

### Options

Options are specified via command-line arguments with the `--` prefix.

#### Run Options

| Option | Required | Description |
|--------|----------|-------------|
| `--repo` | Yes | Path to the repository to evaluate |
| `--fixture` | Yes | Path to the fixture JSON file |
| `--agent` | Yes | Agent type: `copilot`, `codex`, `opencode`, `gemini`, `claudeCode` |
| `--iterations` | No | Number of iterations per prompt (default: `1`) |
| `--output-mode` | No | Output format: `Detailed`, `Aggregated` (default) |
| `--use-cache` / `--no-use-cache` | No | Enable/disable caching of agent responses (default: `false`) |
| `--stop-on-error` / `--no-stop-on-error` | No | Stop on first error or continue (default: `true`) |
| `--allow-full-access` / `--no-allow-full-access` | No | Allow/restrict full repository access (default: `true`) |
| `--model` | No | Model to use for the agent |
| `--eval-model` | No | Model to use for evaluation |

#### Generate Options

| Option | Required | Description |
|--------|----------|-------------|
| `--repo` | Yes | Path to the repository to analyze |
| `--agent` | Yes | Agent type: `copilot`, `codex`, `opencode`, `gemini`, `claudeCode` |
| `--count` | Yes | Number of prompts to generate |
| `--model` | No | Model to use for the agent |
| `--steering` | No | Additional instructions to steer generation |

#### Check Options

| Option | Required | Description |
|--------|----------|-------------|
| `--agent` | No | Check dependencies for a specific agent only |

#### Common Options

These options are available for all commands:

| Option | Description |
|--------|-------------|
| `--log-level` | Logging verbosity: `Trace`, `Debug`, `Info`, `Warn`, `Error` (default: `Info`) |
| `--detailed-logs` / `--no-detailed-logs` | Show detailed logs with timestamp and level (default: `false`) |

## Terminal UI

The default mode launches an interactive Terminal UI. To start it, simply run:

```bash
compass
```

Features:
- Interactive form for all CLI options
- Live log streaming with real-time updates
- Pretty-printed JSON results inside the TUI
- Copy to clipboard with Ctrl+Y
- "Show as CLI flags" overlay to copy the equivalent command (press `C`)
- Cancellation support during command execution (press `Esc`)

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate fields/commands |
| Enter | Edit field / Execute command |
| Tab | Cycle focus between panels |
| C | Show CLI command modal |
| L | Toggle logs panel |
| Ctrl+Y | Copy current content to clipboard |
| Esc | Back / Cancel running command |
| Q | Quit |

## Docker

```bash
docker run --rm -ti \
  -v /absolute/path/to/target-repo:/target-repo \
  -v /absolute/path/to/fixture.json:/fixture.json \
  ghcr.io/pablozaiden/compass:latest \
  run \
  --repo /target-repo \
  --fixture /fixture.json \
  --agent opencode
```

Mount your fixture as `/fixture.json` and repo to evaluate at `/target-repo` so the container can reset git state via git commands.

For instance, to run the sample configuration against Compass itself:

```bash
docker run --rm -ti \
  -v $(pwd):/target-repo \
  -v $(pwd)/src/sample-fixture.json:/fixture.json \
  ghcr.io/pablozaiden/compass:latest \
  run \
  --repo /target-repo \
  --fixture /fixture.json \
  --agent opencode
```

## Fixture File

A fixture file defines the prompts and expected outcomes for benchmarking. See [src/sample-fixture.json](src/sample-fixture.json) for an example:

```json
{
  "prompts": [
    {
      "id": "explain_repo",
      "prompt": "Describe this repo.",
      "expected": "This repo is a console tool to benchmark coding agents..."
    }
  ]
}
```

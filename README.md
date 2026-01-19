# Compass

A CLI and TUI tool for benchmarking AI coding agents across prompts and fixtures.

## Overview

Compass runs agents (GitHub Copilot, Claude Code, OpenCode, Codex, Gemini) against a target repository using a fixture file (prompts + expected outcomes), then aggregates results.

## Installation

### Install latest release

```bash
curl -fsSL https://raw.githubusercontent.com/PabloZaiden/compass/main/install.sh | bash
```

This will download and install the latest `compass` binary to `~/.local/bin`.

Ensure `gh` CLI is installed and authenticated with the `repo` scope:

```bash
gh auth login
gh auth refresh -s repo
```

### Install from sources

```bash
bun local-install
```

This will build and install `compass` binary to your `~/.local/bin` folder.

### Run from source

```bash
bun start
```

## Supported Agents

- GitHub Copilot
- OpenAI Codex
- OpenCode
- Google Gemini CLI
- Claude Code

## Requirements

- Git
- [Bun runtime](https://bun.sh/) (if not using Docker or pre-built binaries)
- `copilot` in path for GitHub Copilot
- `codex` in path for OpenAI Codex
- `opencode` in path for OpenCode
- `gemini` in path for Google Gemini
- `claude` in path for Anthropic Claude

## Optional Requirements

- `az` authenticated for Azure AI Foundry models

## Usage

Compass supports the following commands:

### Interactive Mode (Terminal UI)

Launch the interactive Terminal UI by running compass without arguments:

```bash
compass
```

### Interactive Mode (Basic)

```bash
compass --mode ink
```


The Interactive Modes provides:
- Visual form-based configuration
- Command selection via keyboard shortcuts
- Live log streaming
- Results display with Ctrl+Y to copy to clipboard
- Cancellation support with Esc during execution

### Run Mode

Execute the benchmark runner:

```bash
compass --mode cli run \
  --repo "/path/to/target/repo" \
  --fixture "/path/to/fixture.json" \
  --agent opencode
```

### Generate Mode

Auto-generate a fixture file for a repository using an AI agent:

```bash
compass --mode cli generate \
  --repo "/path/to/target/repo" \
  --agent opencode \
  --count 10
```

The agent will analyze the repository and create a `{repo-folder-name}.compass.json` fixture file with the specified number of prompts and expectations.

You can optionally steer the generation with additional instructions:

```bash
compass --mode cli generate \
  --repo "/path/to/target/repo" \
  --agent copilot \
  --count 15 \
  --steering "Focus on API endpoints and error handling"
```

### Check Mode

Verify that required agent dependencies are installed:

```bash
compass --mode cli check                    # Check all agent dependencies
compass --mode cli check --agent copilot    # Check copilot dependencies only
```

### Version

Show the application version:

```bash
compass --mode cli --version
```

### Help

Show all available options:

```bash
compass --mode cli help
compass --mode cli run help      # Help for run command
compass --mode cli generate help # Help for generate command
```

### Options

Options are specified via command-line arguments with the `--` prefix.

#### Run Options

| Option | Required | Description |
|--------|----------|-------------|
| `--repo` | Yes | Path to the repository to evaluate |
| `--fixture` | Yes | Path to the fixture JSON file |
| `--agent` | Yes | Agent type: `Copilot`, `Codex`, `OpenCode`, `Gemini`, `ClaudeCode` |
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
| `--mode` | Execution mode: `cli` (default), `opentui` (Default Terminal UI), `ink` (Basic UI) |
| `--log-level` | Logging verbosity: `Trace`, `Debug`, `Info`, `Warn`, `Error` (default: `Info`) |
| `--detailed-logs` / `--no-detailed-logs` | Show detailed logs with timestamp and level (default: `false`) |

## Docker

```bash
docker run --rm -ti \
  -v /absolute/path/to/target-repo:/target-repo \
  -v /absolute/path/to/fixture.json:/fixture.json \
  ghcr.io/pablozaiden/compass:latest \
  --mode cli run \
  --repo /target-repo \
  --fixture /fixture.json \
  --agent opencode
```

Mount your fixture as `/fixture.json` and your repo as `/target-repo` so the container can reset git state via git commands.

For instance, to run the sample configuration against Compass itself:

```bash
docker run --rm -ti \
  -v $(pwd):/target-repo \
  -v $(pwd)/src/sample-fixture.json:/fixture.json \
  ghcr.io/pablozaiden/compass:latest \
  --mode cli run \
  --repo /target-repo \
  --fixture /fixture.json \
  --agent opencode
```

## Fixture File

A fixture file defines the prompts and expected outcomes for benchmarking. See [src/sample-fixture.json](src/sample-fixture.json) for an example.

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

## Architecture

Compass uses the `@pablozaiden/terminatui` framework to provide a unified CLI + TUI experience (auto-generated forms, command routing, option validation, and cancellation).

## Development

```bash
# Run in development
bun run start

# Run tests
bun run test

# Run agent tests (requires agent setup)
bun run test:agents

# Build type checking
bun run build

# Compile to binary
bun run compile
```

### Using a local `terminatui` checkout

If you have a local checkout of `@pablozaiden/terminatui` in a sibling directory, you can link it for local development:

```bash
# from the @pablozaiden/terminatui directory
bun link

# from ./compass
bun link @pablozaiden/terminatui
```

## License

MIT

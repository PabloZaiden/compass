# Compass

A CLI and TUI tool for benchmarking AI coding agents across prompts and fixtures.

## Overview

Compass runs agents (GitHub Copilot, Claude Code, OpenCode, Codex, Gemini) against a target repository using a fixture file (prompts + expected outcomes), then aggregates results.

## Installation

### Install pre-built binary (recommended)

This installs from GitHub Package Registry. You need GitHub CLI authenticated with the `read:packages` scope.

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

### Run from source

```bash
bun install
bun run start
```

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

The TUI provides:
- Visual form-based configuration
- Command selection via keyboard shortcuts
- Live log streaming
- Results display with Ctrl+Y to copy to clipboard
- Cancellation support with Esc during execution

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

Mount your fixture as `/fixture.json` and your repo as `/target-repo` so the container can reset git state via git commands.

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

### Project Structure

```
src/
├── app.ts           # CompassApp entry point
├── index.ts         # Main entry point
├── models.ts        # Data models and types
├── utils.ts         # Utility functions
├── prompts.ts       # Prompt templates
├── commands/        # Command implementations
│   ├── run.ts       # Run command with RunConfig
│   ├── check.ts     # Check command
│   └── generate.ts  # Generate command with GenerateConfig
├── agents/          # Agent implementations
│   ├── agent.ts     # Agent interface
│   ├── factory.ts   # Agent factory
│   ├── cache.ts     # Caching agent wrapper
│   ├── copilot.ts   # GitHub Copilot
│   ├── codex.ts     # OpenAI Codex
│   ├── opencode.ts  # OpenCode
│   ├── claudeCode.ts # Claude Code
│   └── gemini.ts    # Google Gemini
├── run/             # Runner logic
│   └── runner.ts    # Benchmark runner
├── check/           # Checker logic
│   └── checker.ts   # Agent availability checker
├── generate/        # Generator logic
│   └── generator.ts # Fixture generator
├── react/           # React/TSX components
│   └── RunResultRenderer.tsx  # Custom result rendering
└── options/         # Option schema definitions
    ├── run.ts       # Run options
    ├── check.ts     # Check options
    └── generate.ts  # Generate options
```

## Development

```bash
# Run in development
bun run start

# Run tests
bun test

# Run agent tests (requires agent setup)
COMPASS_TEST_AGENTS=1 bun test

# Build type checking
bun run build

# Compile to binary
bun run compile
```

### Using a local `terminatui` checkout

If you have a local checkout of `@pablozaiden/terminatui` in a sibling directory, you can link it for local development:

```bash
# from ../terminatui
bun link

# from ./compass
bun link @pablozaiden/terminatui
```

## License

MIT

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

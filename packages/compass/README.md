# Compass

A CLI and TUI tool for benchmarking AI coding agents across prompts and fixtures.

## Overview

Compass evaluates AI coding agents (like GitHub Copilot, Claude Code, OpenCode, Codex, and Gemini) by running them against predefined test fixtures and measuring their performance. It supports both command-line and interactive terminal UI modes.

## Installation

```bash
# From npm (when published)
npm install -g @pablozaiden/compass

# From source
bun install
bun run start
```

## Usage

### Interactive TUI Mode

Launch the interactive terminal UI by running compass without arguments:

```bash
compass
```

The TUI provides:
- Visual form-based configuration
- Command selection via keyboard shortcuts
- Live log streaming
- Results display with copy-to-clipboard

### CLI Mode

Run commands directly from the command line:

```bash
# Run an evaluation
compass run --repo /path/to/repo --fixture test.json --agent copilot

# Check agent availability
compass check --agent all

# Generate fixtures
compass generate --repo /path/to/repo --output fixtures.json

# Show help
compass help
compass run help
```

## Commands

### `run`

Run evaluations against a repository with a specific agent.

```bash
compass run [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--repo` | Path to the repository to evaluate | (required) |
| `--fixture` | Path to the fixture file | (required) |
| `--agent` | Agent to use: `copilot`, `codex`, `opencode`, `claudecode`, `gemini` | (required) |
| `--iterations` | Number of iterations to run | `1` |
| `--output-mode` | Output format: `quiet`, `normal`, `verbose`, `json` | `normal` |
| `--model` | Model override for the agent | - |
| `--eval-model` | Model for evaluation | - |
| `--use-cache` | Use cached results | `true` |
| `--stop-on-error` | Stop on first error | `false` |
| `--allow-full-access` | Allow agent full repository access | `false` |
| `--log-level` | Log level: `trace`, `debug`, `info`, `warn`, `error` | `info` |

### `check`

Check if agents are available and properly configured.

```bash
compass check [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--agent` | Agent to check: `all`, `copilot`, `codex`, `opencode`, `claudecode`, `gemini` | `all` |

### `generate`

Generate fixture files from a repository.

```bash
compass generate [options]
```

### `version`

Display version information.

```bash
compass version
```

## Architecture

Compass is built on the [Terminator](../terminator/README.md) framework, which provides:

- **TuiApplication**: Auto-generates a TUI from command definitions
- **Command**: Base class with CLI and TUI support
- **OptionSchema**: Type-safe option definitions with TUI metadata

### Project Structure

```
src/
├── app.ts           # CompassApp entry point
├── commands/        # Command implementations
│   ├── run.ts       # Run command
│   ├── check.ts     # Check command
│   └── generate.ts  # Generate command
├── agents/          # Agent implementations
│   ├── copilot.ts
│   ├── codex.ts
│   ├── opencode.ts
│   ├── claudeCode.ts
│   └── gemini.ts
├── run/             # Runner logic
├── check/           # Checker logic
├── generate/        # Generator logic
└── options/         # Option schema definitions
```

## Adding New Agents

To add a new agent:

1. Create a new agent class in `src/agents/`:

```typescript
import { type Agent } from "./agent.ts";

export class MyAgent implements Agent {
  readonly name = "myagent";
  
  async check(): Promise<boolean> {
    // Return true if agent is available
  }
  
  async execute(prompt: string, options: AgentOptions): Promise<AgentResult> {
    // Execute the agent and return result
  }
}
```

2. Register it in `src/agents/factory.ts`
3. Add it to the valid agent values in `src/options/run.ts`

## Configuration

Compass uses TUI metadata in option schemas for rich form rendering:

```typescript
const options: OptionSchema = {
  repo: {
    type: "string",
    description: "Repository path",
    label: "Repository Path",    // TUI label
    placeholder: "/path/to/repo", // TUI placeholder
    order: 1,                     // TUI display order
    group: "Required",            // TUI group heading
  },
};
```

## Development

```bash
# Run in development
bun run start

# Run tests
bun test

# Run agent tests (requires agent setup)
bun test:agents

# Build type checking
bun run build

# Compile to binary
bun run compile
```

## License

MIT

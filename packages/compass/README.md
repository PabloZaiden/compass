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
- Results display with Ctrl+Y to copy to clipboard
- Cancellation support with Esc during execution

### CLI Mode

Run commands directly from the command line:

```bash
# Run an evaluation
compass run --repo /path/to/repo --fixture test.json --agent copilot

# Check agent availability
compass check --agent all

# Generate fixtures
compass generate --repo /path/to/repo --agent opencode --count 10

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
| `--agent` | Agent to use: `copilot`, `codex`, `opencode`, `claudeCode`, `gemini` | (required) |
| `--iterations` | Number of iterations to run | `1` |
| `--output-mode` | Output format: `Detailed`, `Aggregated` | `Aggregated` |
| `--model` | Model override for the agent | agent default |
| `--eval-model` | Model for evaluation | agent default |
| `--use-cache` | Use cached results | `false` |
| `--stop-on-error` | Stop on first error | `true` |
| `--allow-full-access` | Allow agent full repository access | `true` |
| `--log-level` | Log level: `Trace`, `Debug`, `Info`, `Warn`, `Error` | `Info` |

### `check`

Check if agents are available and properly configured.

```bash
compass check [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--agent` | Agent to check: `all`, `copilot`, `codex`, `opencode`, `claudeCode`, `gemini` | `all` |

### `generate`

Generate fixture files from a repository using an AI agent.

```bash
compass generate [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--repo` | Path to the repository to analyze | (required) |
| `--agent` | Agent to use for generation | (required) |
| `--count` | Number of prompts to generate | (required) |
| `--model` | Model override for the agent | agent default |
| `--steering` | Additional instructions to steer generation | - |
| `--use-cache` | Use cached results | `false` |

### `version`

Display version information.

```bash
compass version
```

## Architecture

Compass is built on the [Terminatui](../terminatui/README.md) framework, which provides:

- **TuiApplication**: Auto-generates a TUI from command definitions
- **Command**: Base class with unified CLI and TUI support
- **OptionSchema**: Type-safe option definitions with TUI metadata
- **Cancellation**: AbortSignal-based cancellation support

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

## Adding New Agents

To add a new agent:

1. Create a new agent class in `src/agents/`:

```typescript
import { type Agent, type AgentOptions } from "./agent.ts";
import type { ProcessOutput } from "../models.ts";

export class MyAgent implements Agent {
  readonly name = "myagent";
  
  async check(): Promise<boolean> {
    // Return true if agent CLI is available
    try {
      const result = await run(".", ["myagent", "--version"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
  
  async execute(
    prompt: string, 
    model: string, 
    workingDirectory: string,
    signal?: AbortSignal
  ): Promise<ProcessOutput> {
    // Execute the agent and return result
    return run(workingDirectory, ["myagent", "run", prompt], signal);
  }
}
```

2. Register it in `src/agents/factory.ts`:

```typescript
export enum AgentTypes {
  // ... existing agents
  MyAgent = "myagent",
}

export const defaultModels: Record<AgentTypes, string> = {
  // ... existing defaults
  [AgentTypes.MyAgent]: "my-default-model",
};
```

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

## Keyboard Shortcuts (TUI)

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate fields/commands |
| Enter | Edit field / Execute command |
| Tab | Cycle focus between panels |
| C | Show CLI command modal |
| L | Toggle logs panel |
| Ctrl+Y | Copy current content to clipboard |
| Esc | Back / Cancel running command |

## Development

```bash
# Run in development
bun run start

# Run tests
bun test

# Run agent tests (requires agent setup)
COMPASS_TEST_AGENTS=1 bun test:agents

# Build type checking
bun run build

# Compile to binary
bun run compile
```

## License

MIT

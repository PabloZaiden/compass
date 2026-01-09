# Terminatui Framework Guides

Step-by-step tutorials for building CLI applications with the terminatui framework.

## Guide Overview

| # | Guide | Level | Topics |
|---|-------|-------|--------|
| 1 | [Hello World](01-hello-world.md) | Super Simple | Basic Command, Application |
| 2 | [Adding Options](02-adding-options.md) | Super Simple | Option types, defaults, aliases |
| 3 | [Multiple Commands](03-multiple-commands.md) | Basic | Multiple commands, project structure |
| 4 | [Subcommands](04-subcommands.md) | Basic | Nested subcommands, hierarchies |
| 5 | [Interactive TUI](05-interactive-tui.md) | Normal | TuiApplication, metadata, keyboard |
| 6 | [Config Validation](06-config-validation.md) | Normal | buildConfig, ConfigValidationError |
| 7 | [Async Cancellation](07-async-cancellation.md) | Complex | AbortSignal, cancellation, cleanup |
| 8 | [Complete Application](08-complete-application.md) | Complex | Full app, services, best practices |

## Learning Path

### Beginners
Start with guides 1-2 to understand the basics of commands and options.

### Intermediate
Continue with guides 3-4 to learn about organizing larger applications.

### Advanced
Work through guides 5-8 to master TUI features, validation, and production patterns.

## Quick Start

```bash
# Create a new project
mkdir my-cli && cd my-cli
bun init -y
bun add @pablozaiden/terminatui

# Create your first command
cat > src/index.ts << 'EOF'
import { Command, Application, type AppContext, type OptionSchema } from "@pablozaiden/terminatui";

const options = {
  name: { type: "string", description: "Your name" },
} satisfies OptionSchema;

class HelloCommand extends Command<typeof options> {
  readonly name = "hello";
  readonly description = "Say hello";
  readonly options = options;

  async execute(ctx: AppContext, config: Record<string, unknown>) {
    const name = config["name"] ?? "World";
    console.log(`Hello, ${name}!`);
    return { success: true };
  }
}

class MyCLI extends Application {
  constructor() {
    super({ name: "my-cli", version: "1.0.0", commands: [new HelloCommand()] });
  }
}

await new MyCLI().run();
EOF

# Run it
bun src/index.ts hello --name "Developer"
```

## Prerequisites

- [Bun](https://bun.sh) or Node.js 18+
- Basic TypeScript knowledge
- Terminal/command-line familiarity

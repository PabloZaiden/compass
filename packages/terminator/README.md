# @pablozaiden/terminator

A type-safe, class-based framework for building CLI and TUI applications in TypeScript.

## Features

- **Type-safe CLI parsing** - Define options with schemas that provide full TypeScript types
- **Class-based architecture** - Extend `Command` and `Application` classes for structured apps
- **Dual execution modes** - Commands can support CLI, TUI, or both modes
- **Built-in commands** - Automatic `help` and `version` commands
- **Nested subcommands** - Hierarchical command structures with path resolution
- **Lifecycle hooks** - `beforeExecute()` and `afterExecute()` hooks on commands
- **Service container** - `AppContext` provides dependency injection for services
- **Integrated logging** - Logger with TUI-aware output handling

## Installation

```bash
bun add @pablozaiden/terminator
```

## Quick Start

### 1. Define a Command

```typescript
import { Command, ExecutionMode, type OptionSchema } from "@pablozaiden/terminator";

class GreetCommand extends Command {
  name = "greet";
  description = "Greet someone";
  
  options: Record<string, OptionSchema> = {
    name: {
      type: "string",
      description: "Name to greet",
      required: true,
    },
    loud: {
      type: "boolean",
      description: "Use uppercase",
      alias: "l",
      default: false,
    },
  };

  override executeCli(args: string[], options: Record<string, unknown>): void {
    const name = options.name as string;
    const message = `Hello, ${name}!`;
    console.log(options.loud ? message.toUpperCase() : message);
  }
}
```

### 2. Create an Application

```typescript
import { Application } from "@pablozaiden/terminator";

class MyApp extends Application {
  constructor() {
    super({
      name: "myapp",
      version: "1.0.0",
      description: "My awesome CLI app",
      commands: [new GreetCommand()],
    });
  }
}
```

### 3. Run the Application

```typescript
// index.ts
await new MyApp().run();
```

```bash
# Usage
myapp greet --name World
# Output: Hello, World!

myapp greet --name World --loud
# Output: HELLO, WORLD!

myapp help
# Shows all commands

myapp greet help
# Shows greet command options
```

## Core Concepts

### ExecutionMode

Commands can support different execution modes:

```typescript
import { ExecutionMode } from "@pablozaiden/terminator";

ExecutionMode.Cli  // Command-line interface
ExecutionMode.Tui  // Terminal user interface (interactive)
```

### Command

The `Command` abstract class is the base for all commands:

```typescript
abstract class Command {
  abstract name: string;
  abstract description: string;
  
  options?: Record<string, OptionSchema>;
  subCommands?: Command[];
  aliases?: string[];
  hidden?: boolean;
  examples?: string[];
  
  // Override to support CLI mode
  executeCli?(args: string[], options: Record<string, unknown>): Promise<void> | void;
  
  // Override to support TUI mode
  executeTui?(args: string[], options: Record<string, unknown>): Promise<void> | void;
  
  // Lifecycle hooks
  beforeExecute?(mode: ExecutionMode): Promise<void> | void;
  afterExecute?(mode: ExecutionMode): Promise<void> | void;
}
```

### Application

The `Application` class manages command registration and execution:

```typescript
class Application {
  constructor(config: ApplicationConfig);
  
  run(args?: string[]): Promise<void>;
  getContext(): AppContext;
  
  // Lifecycle hooks (override in subclass)
  beforeRun?(): Promise<void> | void;
  afterRun?(): Promise<void> | void;
}

interface ApplicationConfig {
  name: string;
  version: string;
  description?: string;
  commands: Command[];
}
```

### AppContext

Access application-wide services and configuration:

```typescript
import { AppContext } from "@pablozaiden/terminator";

// Get the current context (set during Application.run())
const ctx = AppContext.current;

// Access the logger
ctx.logger.info("Hello");
ctx.logger.warn("Warning");
ctx.logger.error("Error");

// Access app config
console.log(ctx.config.name, ctx.config.version);

// Register and retrieve services
ctx.setService("myService", myServiceInstance);
const service = ctx.requireService<MyService>("myService");
```

### OptionSchema

Define typed options for commands:

```typescript
interface OptionSchema {
  type: "string" | "boolean" | "number";
  description: string;
  required?: boolean;
  default?: unknown;
  alias?: string;
  enum?: string[];  // For string type, restrict to values
}
```

## Subcommands

Commands can have nested subcommands:

```typescript
class DbCommand extends Command {
  name = "db";
  description = "Database operations";
  
  subCommands = [
    new DbMigrateCommand(),
    new DbSeedCommand(),
  ];
}

// Usage: myapp db migrate
//        myapp db seed
```

## Built-in Commands

The framework automatically injects:

- **`help`** - Shows command help (injected into every command as subcommand)
- **`version`** - Shows app version (top-level only)

```bash
myapp help           # App-level help
myapp greet help     # Command-level help
myapp version        # Shows version
```

## TUI Mode

Commands that support TUI mode implement `executeTui()`:

```typescript
class InteractiveCommand extends Command {
  name = "interactive";
  description = "Interactive mode";
  
  // Only TUI, no CLI
  override async executeTui(): Promise<void> {
    // Launch your TUI (e.g., with Ink, blessed, etc.)
    const { render } = await import("ink");
    render(<App />);
  }
}
```

## Examples

See the [compass](../compass) package for a complete example application using terminator.

## License

MIT

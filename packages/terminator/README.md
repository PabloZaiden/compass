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

  override execute(ctx: AppContext, config: Record<string, unknown>): void {
    const name = config.name as string;
    const message = `Hello, ${name}!`;
    console.log(config.loud ? message.toUpperCase() : message);
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
  
  // Implement to handle command execution (required)
  abstract execute(ctx: AppContext, config: TConfig): Promise<CommandResult | void> | CommandResult | void;
  
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

Terminator provides built-in TUI (Terminal User Interface) support that automatically generates interactive UIs from your command definitions.

### TuiApplication

Extend `TuiApplication` instead of `Application` to get automatic TUI support:

```typescript
import { TuiApplication, Command, type OptionSchema } from "@pablozaiden/terminator";

class MyApp extends TuiApplication {
  constructor() {
    super({
      name: "myapp",
      version: "1.0.0",
      commands: [new RunCommand(), new ConfigCommand()],
      enableTui: true, // default: true
    });
  }
}
```

When run with no arguments (or `--interactive`), the app launches an interactive TUI instead of showing help:

```bash
myapp              # Launches TUI
myapp --interactive # Same as above
myapp run --verbose # Runs in CLI mode
```

### TUI Metadata

Add TUI-specific metadata to your option schemas to customize the UI:

```typescript
const myOptions = {
  repo: {
    type: "string",
    description: "Repository path",
    required: true,
    // TUI metadata
    label: "Repository",    // Custom label in form
    order: 1,               // Field ordering
    group: "Required",      // Group fields together
    placeholder: "path",    // Placeholder text
    tuiHidden: false,       // Hide from TUI form
  },
  verbose: {
    type: "boolean",
    description: "Verbose output",
    label: "Verbose Mode",
    order: 10,
    group: "Options",
  },
} satisfies OptionSchema;
```

### Command TUI Properties

Commands can customize their TUI behavior:

```typescript
class RunCommand extends Command {
  name = "run";
  description = "Run the task";
  options = runOptions;

  // TUI customization
  override readonly actionLabel = "Start Run";      // Button text
  override readonly immediateExecution = false;     // Run immediately on selection

  // Return structured results for display
  override async execute(ctx: AppContext, config: RunConfig): Promise<CommandResult> {
    const result = await runTask(config);
    return { 
      success: true, 
      data: result,
      message: "Task completed"
    };
  }

  // Custom result rendering
  override renderResult(result: CommandResult): string {
    return JSON.stringify(result.data, null, 2);
  }

  // Content for clipboard (Ctrl+C in results view)
  override getClipboardContent(result: CommandResult): string | undefined {
    return JSON.stringify(result.data, null, 2);
  }
}
```

### CommandResult Interface

Commands should return a `CommandResult` from `execute()`:

```typescript
interface CommandResult {
  success: boolean;
  data?: unknown;         // Result data
  error?: Error;          // Error object if failed
  message?: string;       // User-friendly message
}
```

### TUI Features

The built-in TUI provides:

- **Command Selector** - Navigate and select commands with arrow keys
- **Config Form** - Auto-generated forms from option schemas
- **Field Editor** - Edit field values (text, number, boolean, enum)
- **CLI Modal** - View equivalent CLI command (press `C`)
- **Results Panel** - Display command results with custom rendering
- **Logs Panel** - View application logs in real-time
- **Clipboard Support** - Copy results with Ctrl+C

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate fields |
| Enter | Edit field / Execute command |
| C | Show CLI command |
| Esc | Back / Cancel |
| Q | Quit |

### TUI Utilities

The package exports utilities for building custom TUI components:

```typescript
import { 
  schemaToFieldConfigs,  // Convert OptionSchema to form fields
  buildCliCommand,       // Build CLI command from config
  KeyboardProvider,      // Keyboard context provider
  useKeyboardHandler,    // Register keyboard handlers
  useSpinner,            // Animated spinner hook
  useClipboard,          // Clipboard operations
} from "@pablozaiden/terminator";
```

## Examples

See the [compass](../compass) package for a complete example application using terminator.

## License

MIT

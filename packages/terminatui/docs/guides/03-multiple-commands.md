# Guide 3: Multiple Commands (Basic)

Build a CLI with multiple commands that share common functionality.

## What You'll Build

A file utility CLI with `list` and `count` commands:

```bash
fileutil list --dir ./src
# Lists files in directory

fileutil count --dir ./src --ext .ts
# Counts files with extension
```

## Step 1: Create the List Command

Create `src/commands/list.ts`:

```typescript
import { readdirSync } from "fs";
import { Command, type AppContext, type OptionSchema, type CommandResult } from "@pablozaiden/terminatui";

const options = {
  dir: {
    type: "string",
    description: "Directory to list",
    required: true,
    alias: "d",
  },
} satisfies OptionSchema;

export class ListCommand extends Command<typeof options> {
  readonly name = "list";
  readonly description = "List files in a directory";
  readonly options = options;

  execute(_ctx: AppContext, config: { dir: string }): CommandResult {
    try {
      const files = readdirSync(config.dir);
      console.log(`Files in ${config.dir}:`);
      files.forEach((file) => console.log(`  ${file}`));
      return { success: true, message: `Found ${files.length} files` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
```

## Step 2: Create the Count Command

Create `src/commands/count.ts`:

```typescript
import { readdirSync } from "fs";
import { Command, type AppContext, type OptionSchema, type CommandResult } from "@pablozaiden/terminatui";

const options = {
  dir: {
    type: "string",
    description: "Directory to search",
    required: true,
    alias: "d",
  },
  ext: {
    type: "string",
    description: "File extension to count (e.g., .ts)",
    alias: "e",
  },
} satisfies OptionSchema;

export class CountCommand extends Command<typeof options> {
  readonly name = "count";
  readonly description = "Count files in a directory";
  readonly options = options;

  execute(_ctx: AppContext, config: { dir: string; ext?: string }): CommandResult {
    try {
      let files = readdirSync(config.dir);
      
      if (config.ext) {
        files = files.filter((f) => f.endsWith(config.ext!));
      }
      
      console.log(`Found ${files.length} files${config.ext ? ` with ${config.ext}` : ""}`);
      return { success: true, data: { count: files.length } };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
```

## Step 3: Create the Application

Create `src/index.ts`:

```typescript
import { Application } from "@pablozaiden/terminatui";
import { ListCommand } from "./commands/list";
import { CountCommand } from "./commands/count";

class FileUtilApp extends Application {
  constructor() {
    super({
      name: "fileutil",
      version: "1.0.0",
      description: "File utility commands",
      commands: [
        new ListCommand(),
        new CountCommand(),
      ],
    });
  }
}

await new FileUtilApp().run();
```

## Step 4: Test It

```bash
# List files
bun src/index.ts list --dir ./src
# Files in ./src:
#   commands
#   index.ts

# Count all files
bun src/index.ts count -d ./src
# Found 2 files

# Count only .ts files
bun src/index.ts count -d ./src -e .ts
# Found 1 files with .ts

# Show help
bun src/index.ts help
# Lists: list, count, version, help
```

## Project Structure

```
src/
├── index.ts           # App entry point
└── commands/
    ├── list.ts        # List command
    └── count.ts       # Count command
```

## What You Learned

- Create multiple commands in separate files
- Return structured `CommandResult` with data
- Handle errors gracefully
- Use consistent option patterns across commands

## Next Steps

→ [Guide 4: Subcommands](04-subcommands.md)

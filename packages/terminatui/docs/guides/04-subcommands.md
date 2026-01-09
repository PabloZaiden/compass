# Guide 4: Subcommands (Basic)

Organize related commands under a parent command for cleaner CLI structure.

## What You'll Build

A database CLI with nested subcommands:

```bash
dbctl db migrate --target latest
dbctl db seed --file data.json
dbctl db status
```

## Step 1: Create the Subcommands

Create `src/commands/db/migrate.ts`:

```typescript
import { Command, type AppContext, type OptionSchema, type CommandResult } from "@pablozaiden/terminatui";

const options = {
  target: {
    type: "string",
    description: "Migration target version",
    default: "latest",
  },
  dry: {
    type: "boolean",
    description: "Dry run without applying",
    default: false,
  },
} satisfies OptionSchema;

export class MigrateCommand extends Command<typeof options> {
  readonly name = "migrate";
  readonly description = "Run database migrations";
  readonly options = options;

  execute(ctx: AppContext, config: { target: string; dry: boolean }): CommandResult {
    ctx.logger.info(`Migrating to: ${config.target}`);
    
    if (config.dry) {
      console.log("DRY RUN: Would migrate to", config.target);
    } else {
      console.log("Migrating to", config.target, "...");
      console.log("Migration complete!");
    }
    
    return { success: true };
  }
}
```

Create `src/commands/db/seed.ts`:

```typescript
import { Command, type AppContext, type OptionSchema, type CommandResult } from "@pablozaiden/terminatui";

const options = {
  file: {
    type: "string",
    description: "Seed data file",
    required: true,
    alias: "f",
  },
} satisfies OptionSchema;

export class SeedCommand extends Command<typeof options> {
  readonly name = "seed";
  readonly description = "Seed the database with data";
  readonly options = options;

  execute(ctx: AppContext, config: { file: string }): CommandResult {
    ctx.logger.info(`Seeding from: ${config.file}`);
    console.log(`Loading seed data from ${config.file}...`);
    console.log("Database seeded successfully!");
    return { success: true };
  }
}
```

Create `src/commands/db/status.ts`:

```typescript
import { Command, type AppContext, type CommandResult } from "@pablozaiden/terminatui";

export class StatusCommand extends Command {
  readonly name = "status";
  readonly description = "Show database status";
  readonly options = {};

  execute(_ctx: AppContext): CommandResult {
    console.log("Database Status:");
    console.log("  Connected: Yes");
    console.log("  Version: 1.2.3");
    console.log("  Migrations: 5 applied");
    return { success: true };
  }
}
```

## Step 2: Create the Parent Command

Create `src/commands/db/index.ts`:

```typescript
import { Command, type AppContext, type CommandResult } from "@pablozaiden/terminatui";
import { MigrateCommand } from "./migrate";
import { SeedCommand } from "./seed";
import { StatusCommand } from "./status";

export class DbCommand extends Command {
  readonly name = "db";
  readonly description = "Database operations";
  readonly options = {};
  
  // Subcommands are nested here
  override readonly subCommands = [
    new MigrateCommand(),
    new SeedCommand(),
    new StatusCommand(),
  ];

  // Parent command can have its own execute (optional)
  execute(_ctx: AppContext): CommandResult {
    console.log("Use 'dbctl db <command>' for database operations.");
    console.log("Available: migrate, seed, status");
    return { success: true };
  }
}
```

## Step 3: Create the Application

Create `src/index.ts`:

```typescript
import { Application } from "@pablozaiden/terminatui";
import { DbCommand } from "./commands/db";

class DbCtlApp extends Application {
  constructor() {
    super({
      name: "dbctl",
      version: "1.0.0",
      description: "Database control CLI",
      commands: [new DbCommand()],
    });
  }
}

await new DbCtlApp().run();
```

## Step 4: Test It

```bash
# Show db command help
bun src/index.ts db help
# Shows: migrate, seed, status

# Run migration
bun src/index.ts db migrate
# Migrating to latest...

# Dry run migration
bun src/index.ts db migrate --target v2 --dry
# DRY RUN: Would migrate to v2

# Seed database
bun src/index.ts db seed -f data.json
# Loading seed data from data.json...

# Check status
bun src/index.ts db status
# Database Status: ...

# Get help for subcommand
bun src/index.ts db migrate help
# Shows migrate options
```

## Project Structure

```
src/
├── index.ts
└── commands/
    └── db/
        ├── index.ts    # Parent command
        ├── migrate.ts  # Subcommand
        ├── seed.ts     # Subcommand
        └── status.ts   # Subcommand
```

## What You Learned

- Group related commands under a parent
- Define subcommands with `subCommands` property
- Each subcommand has its own options
- Help is automatically nested (`db help`, `db migrate help`)

## Next Steps

→ [Guide 5: Interactive TUI](05-interactive-tui.md)

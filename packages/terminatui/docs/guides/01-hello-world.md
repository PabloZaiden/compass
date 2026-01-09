# Guide 1: Hello World CLI (Super Simple)

Create your first CLI app with Terminatui in under 5 minutes.

## What You'll Build

A simple CLI that greets the user by name.

```bash
myapp greet --name Alice
# Output: Hello, Alice!
```

## Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)

## Step 1: Create Project

```bash
mkdir hello-cli && cd hello-cli
bun init -y
bun add @pablozaiden/terminatui
```

## Step 2: Create the Command

Create `src/greet.ts`:

```typescript
import { Command, type AppContext, type OptionSchema, type CommandResult } from "@pablozaiden/terminatui";

const options = {
  name: {
    type: "string",
    description: "Name to greet",
    required: true,
  },
} satisfies OptionSchema;

export class GreetCommand extends Command<typeof options> {
  readonly name = "greet";
  readonly description = "Greet someone";
  readonly options = options;

  execute(_ctx: AppContext, config: { name: string }): CommandResult {
    console.log(`Hello, ${config.name}!`);
    return { success: true };
  }
}
```

## Step 3: Create the App

Create `src/index.ts`:

```typescript
import { Application } from "@pablozaiden/terminatui";
import { GreetCommand } from "./greet";

class MyApp extends Application {
  constructor() {
    super({
      name: "myapp",
      version: "1.0.0",
      commands: [new GreetCommand()],
    });
  }
}

await new MyApp().run();
```

## Step 4: Run It

```bash
bun src/index.ts greet --name Alice
# Output: Hello, Alice!

bun src/index.ts help
# Shows available commands

bun src/index.ts greet help
# Shows greet options
```

## What You Learned

- Commands extend the `Command` class
- Options are defined with `OptionSchema`
- The `execute()` method handles the logic
- `Application` ties everything together

## Next Steps

→ [Guide 2: Adding Options](02-adding-options.md)

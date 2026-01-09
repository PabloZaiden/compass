# Guide 2: Adding Options (Super Simple)

Add boolean and string options to make your CLI more flexible.

## What You'll Build

Extend the greeting command with a `--loud` flag:

```bash
myapp greet --name Alice
# Output: Hello, Alice!

myapp greet --name Alice --loud
# Output: HELLO, ALICE!
```

## Step 1: Add the Option

Update `src/greet.ts`:

```typescript
import { Command, type AppContext, type OptionSchema, type CommandResult } from "@pablozaiden/terminatui";

const options = {
  name: {
    type: "string",
    description: "Name to greet",
    required: true,
  },
  loud: {
    type: "boolean",
    description: "Shout the greeting",
    alias: "l",        // Short flag: -l
    default: false,
  },
} satisfies OptionSchema;

export class GreetCommand extends Command<typeof options> {
  readonly name = "greet";
  readonly description = "Greet someone";
  readonly options = options;

  execute(_ctx: AppContext, config: { name: string; loud: boolean }): CommandResult {
    const message = `Hello, ${config.name}!`;
    console.log(config.loud ? message.toUpperCase() : message);
    return { success: true };
  }
}
```

## Step 2: Test It

```bash
# Normal greeting
bun src/index.ts greet --name Alice
# Hello, Alice!

# Loud greeting with long flag
bun src/index.ts greet --name Bob --loud
# HELLO, BOB!

# Loud greeting with short flag
bun src/index.ts greet --name Charlie -l
# HELLO, CHARLIE!

# View help to see options
bun src/index.ts greet help
```

## Key Concepts

### Option Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text value | `--name Alice` |
| `boolean` | Flag (true/false) | `--loud` or `--no-loud` |
| `number` | Numeric value | `--count 5` |
| `array` | Multiple values | `--tags a --tags b` |

### Option Properties

```typescript
{
  type: "string",
  description: "Help text",   // Required
  required: true,             // Must be provided
  default: "value",           // Default if not provided
  alias: "n",                 // Short flag (-n)
  enum: ["a", "b", "c"],      // Restrict to values
}
```

## What You Learned

- Add options with different types
- Use `alias` for short flags (-l instead of --loud)
- Use `default` for optional values
- Boolean flags can be negated with `--no-` prefix

## Next Steps

→ [Guide 3: Multiple Commands](03-multiple-commands.md)

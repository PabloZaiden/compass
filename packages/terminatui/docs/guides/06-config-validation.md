# Guide 6: Config Validation (Normal)

Transform and validate options before execution with `buildConfig`.

## What You'll Build

A deploy CLI that validates paths, resolves environment configs, and provides helpful error messages:

```bash
deploy --app ./myapp --env production --replicas 3
```

## Step 1: Define Options and Config Types

Create `src/commands/deploy.ts`:

```typescript
import path from "node:path";
import { existsSync } from "node:fs";
import { 
  Command, 
  ConfigValidationError,
  type AppContext, 
  type OptionSchema, 
  type OptionValues,
  type CommandResult 
} from "@pablozaiden/terminatui";

// Raw CLI options
const options = {
  app: {
    type: "string",
    description: "Path to application",
    required: true,
  },
  env: {
    type: "string",
    description: "Deployment environment",
    required: true,
    enum: ["development", "staging", "production"],
  },
  replicas: {
    type: "string",  // CLI args are strings
    description: "Number of replicas",
    default: "1",
  },
  "dry-run": {
    type: "boolean",
    description: "Preview without deploying",
    default: false,
  },
} satisfies OptionSchema;

// Validated config type
interface DeployConfig {
  appPath: string;        // Resolved absolute path
  appName: string;        // Extracted from path
  environment: string;
  replicas: number;       // Parsed to number
  dryRun: boolean;
  envConfig: {            // Environment-specific settings
    url: string;
    timeout: number;
  };
}
```

## Step 2: Implement buildConfig

```typescript
// Environment-specific configurations
const ENV_CONFIGS = {
  development: { url: "http://localhost:3000", timeout: 5000 },
  staging: { url: "https://staging.example.com", timeout: 10000 },
  production: { url: "https://example.com", timeout: 30000 },
};

export class DeployCommand extends Command<typeof options, DeployConfig> {
  readonly name = "deploy";
  readonly description = "Deploy an application";
  readonly options = options;

  /**
   * Transform and validate raw options into DeployConfig.
   * Runs before execute() - errors here show helpful messages.
   */
  override buildConfig(
    _ctx: AppContext, 
    opts: OptionValues<typeof options>
  ): DeployConfig {
    // 1. Validate app path exists
    const appRaw = opts["app"] as string | undefined;
    if (!appRaw) {
      throw new ConfigValidationError(
        "Missing required option: app",
        "app"  // Field to highlight in TUI
      );
    }
    
    const appPath = path.resolve(appRaw);
    if (!existsSync(appPath)) {
      throw new ConfigValidationError(
        `Application path does not exist: ${appPath}`,
        "app"
      );
    }

    // 2. Extract app name from path
    const appName = path.basename(appPath);

    // 3. Validate environment
    const environment = opts["env"] as string;
    if (!environment) {
      throw new ConfigValidationError(
        "Missing required option: env",
        "env"
      );
    }

    // 4. Parse and validate replicas
    const replicasStr = opts["replicas"] as string ?? "1";
    const replicas = parseInt(replicasStr, 10);
    
    if (isNaN(replicas)) {
      throw new ConfigValidationError(
        `Replicas must be a number, got: ${replicasStr}`,
        "replicas"
      );
    }
    
    if (replicas < 1 || replicas > 10) {
      throw new ConfigValidationError(
        "Replicas must be between 1 and 10",
        "replicas"
      );
    }

    // 5. Get environment-specific config
    const envConfig = ENV_CONFIGS[environment as keyof typeof ENV_CONFIGS];

    // 6. Return validated config
    return {
      appPath,
      appName,
      environment,
      replicas,
      dryRun: opts["dry-run"] as boolean ?? false,
      envConfig,
    };
  }
```

## Step 3: Implement execute with clean config

```typescript
  /**
   * Execute with fully validated DeployConfig.
   * No need to validate here - buildConfig already did it!
   */
  async execute(ctx: AppContext, config: DeployConfig): Promise<CommandResult> {
    ctx.logger.info(`Deploying ${config.appName} to ${config.environment}`);
    ctx.logger.debug(`Path: ${config.appPath}`);
    ctx.logger.debug(`Replicas: ${config.replicas}`);
    ctx.logger.debug(`URL: ${config.envConfig.url}`);

    if (config.dryRun) {
      console.log("DRY RUN - Would deploy:");
      console.log(`  App: ${config.appName}`);
      console.log(`  Environment: ${config.environment}`);
      console.log(`  Replicas: ${config.replicas}`);
      console.log(`  Target: ${config.envConfig.url}`);
      return { success: true, message: "Dry run completed" };
    }

    console.log(`Deploying ${config.appName}...`);
    console.log(`  Creating ${config.replicas} replicas...`);
    console.log(`  Targeting ${config.envConfig.url}...`);
    
    // Simulate deployment
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    console.log("Deployment successful!");

    return { 
      success: true,
      data: {
        app: config.appName,
        environment: config.environment,
        replicas: config.replicas,
        url: config.envConfig.url,
      },
      message: `Deployed ${config.appName} to ${config.environment}`
    };
  }
}
```

## Step 4: Create the Application

Create `src/index.ts`:

```typescript
import { TuiApplication } from "@pablozaiden/terminatui";
import { DeployCommand } from "./commands/deploy";

class DeployCLI extends TuiApplication {
  constructor() {
    super({
      name: "deploy",
      version: "1.0.0",
      commands: [new DeployCommand()],
    });
  }
}

await new DeployCLI().run();
```

## Step 5: Test Validation

```bash
# Missing required option
bun src/index.ts deploy --env production
# Error: Missing required option: app

# Invalid path
bun src/index.ts deploy --app ./nonexistent --env staging
# Error: Application path does not exist: /path/to/nonexistent

# Invalid replicas
bun src/index.ts deploy --app . --env production --replicas abc
# Error: Replicas must be a number, got: abc

# Out of range replicas
bun src/index.ts deploy --app . --env production --replicas 100
# Error: Replicas must be between 1 and 10

# Dry run (valid)
bun src/index.ts deploy --app . --env production --replicas 3 --dry-run
# DRY RUN - Would deploy: ...

# Full deploy
bun src/index.ts deploy --app . --env staging --replicas 2
# Deploying myapp...
```

## Benefits of buildConfig

1. **Separation of concerns** - Validation separate from logic
2. **Type safety** - `execute()` receives validated `DeployConfig`
3. **Better errors** - `ConfigValidationError` highlights fields in TUI
4. **Reusable** - Works for both CLI and TUI modes
5. **Testable** - Easy to unit test validation logic

## What You Learned

- Use `buildConfig` to transform and validate options
- Throw `ConfigValidationError` with field name for TUI highlighting
- Parse strings to numbers and resolve paths
- Keep `execute()` clean with pre-validated config

## Next Steps

→ [Guide 7: Async Commands with Cancellation](07-async-cancellation.md)

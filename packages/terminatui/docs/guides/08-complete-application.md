# Guide 8: Building a Complete Application (Complex)

Bring together everything to build a production-ready CLI application with multiple commands, services, logging, and a polished TUI.

## What You'll Build

A task management CLI with:
- Multiple commands: list, add, complete, stats
- Shared services (database, notifications)
- Logging with configurable verbosity
- Full TUI support with custom result rendering
- Config validation and type safety

```bash
tasks add "Write documentation" --priority high
tasks list --filter pending
tasks complete abc123
tasks stats
tasks --tui  # Interactive mode
```

## Project Structure

```
src/
├── index.ts              # Application entry
├── services/
│   ├── database.ts       # Task storage
│   └── notifications.ts  # Task notifications
├── commands/
│   ├── add.ts
│   ├── list.ts
│   ├── complete.ts
│   └── stats.ts
└── types.ts              # Shared types
```

## Step 1: Define Shared Types

Create `src/types.ts`:

```typescript
export interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed";
  createdAt: Date;
  completedAt?: Date;
}

export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  byPriority: Record<string, number>;
}
```

## Step 2: Create Services

Create `src/services/database.ts`:

```typescript
import type { Task, TaskStats } from "../types";

// In-memory database (replace with real DB in production)
const tasks: Map<string, Task> = new Map();

export class Database {
  async addTask(title: string, priority: Task["priority"]): Promise<Task> {
    const id = Math.random().toString(36).substring(7);
    const task: Task = {
      id,
      title,
      priority,
      status: "pending",
      createdAt: new Date(),
    };
    tasks.set(id, task);
    return task;
  }

  async getTask(id: string): Promise<Task | undefined> {
    return tasks.get(id);
  }

  async listTasks(filter?: "pending" | "completed" | "all"): Promise<Task[]> {
    const all = Array.from(tasks.values());
    if (!filter || filter === "all") return all;
    return all.filter((t) => t.status === filter);
  }

  async completeTask(id: string): Promise<Task | undefined> {
    const task = tasks.get(id);
    if (task) {
      task.status = "completed";
      task.completedAt = new Date();
      tasks.set(id, task);
    }
    return task;
  }

  async getStats(): Promise<TaskStats> {
    const all = Array.from(tasks.values());
    return {
      total: all.length,
      pending: all.filter((t) => t.status === "pending").length,
      completed: all.filter((t) => t.status === "completed").length,
      byPriority: {
        high: all.filter((t) => t.priority === "high").length,
        medium: all.filter((t) => t.priority === "medium").length,
        low: all.filter((t) => t.priority === "low").length,
      },
    };
  }
}
```

Create `src/services/notifications.ts`:

```typescript
import type { Task } from "../types";
import type { Logger } from "@pablozaiden/terminatui";

export class NotificationService {
  constructor(private logger: Logger) {}

  taskAdded(task: Task): void {
    this.logger.info(`📝 Task added: ${task.title} [${task.priority}]`);
    if (task.priority === "high") {
      this.logger.warn(`⚠️ High priority task created!`);
    }
  }

  taskCompleted(task: Task): void {
    this.logger.info(`✅ Task completed: ${task.title}`);
    const duration = task.completedAt!.getTime() - task.createdAt.getTime();
    const hours = Math.floor(duration / 3600000);
    if (hours > 24) {
      this.logger.debug(`Task took ${hours} hours to complete`);
    }
  }
}
```

## Step 3: Create Commands

Create `src/commands/add.ts`:

```typescript
import React from "react";
import { Text, Box } from "ink";
import {
  Command,
  ConfigValidationError,
  type AppContext,
  type OptionSchema,
  type OptionValues,
  type CommandResult,
} from "@pablozaiden/terminatui";
import { Database } from "../services/database";
import { NotificationService } from "../services/notifications";
import type { Task } from "../types";

const options = {
  title: {
    type: "string",
    description: "Task title",
    required: true,
    label: "Task Title",
    order: 1,
  },
  priority: {
    type: "string",
    description: "Task priority",
    default: "medium",
    enum: ["low", "medium", "high"],
    label: "Priority",
    order: 2,
  },
} satisfies OptionSchema;

interface AddConfig {
  title: string;
  priority: Task["priority"];
}

export class AddCommand extends Command<typeof options, AddConfig> {
  readonly name = "add";
  readonly description = "Add a new task";
  readonly options = options;
  readonly displayName = "Add Task";
  readonly actionLabel = "Create Task";
  readonly group = "Tasks";
  readonly order = 1;

  private db = new Database();

  override buildConfig(
    _ctx: AppContext,
    opts: OptionValues<typeof options>
  ): AddConfig {
    const title = (opts["title"] as string)?.trim();
    if (!title) {
      throw new ConfigValidationError("Task title cannot be empty", "title");
    }
    if (title.length > 200) {
      throw new ConfigValidationError(
        "Task title must be 200 characters or less",
        "title"
      );
    }

    const priority = opts["priority"] as Task["priority"] ?? "medium";

    return { title, priority };
  }

  async execute(ctx: AppContext, config: AddConfig): Promise<CommandResult> {
    ctx.logger.debug(`Creating task: ${config.title}`);

    const task = await this.db.addTask(config.title, config.priority);
    
    const notifications = new NotificationService(ctx.logger);
    notifications.taskAdded(task);

    return {
      success: true,
      data: task,
      message: `Created task: ${task.title} (${task.id})`,
    };
  }

  override renderResult(result: CommandResult): React.ReactNode {
    if (!result.success) {
      return <Text color="red">✗ {result.message}</Text>;
    }

    const task = result.data as Task;
    const priorityColor = {
      high: "red",
      medium: "yellow",
      low: "green",
    }[task.priority] as "red" | "yellow" | "green";

    return (
      <Box flexDirection="column" gap={1}>
        <Text color="green">✓ Task Created</Text>
        <Box>
          <Text dimColor>ID: </Text>
          <Text>{task.id}</Text>
        </Box>
        <Box>
          <Text dimColor>Title: </Text>
          <Text>{task.title}</Text>
        </Box>
        <Box>
          <Text dimColor>Priority: </Text>
          <Text color={priorityColor}>{task.priority}</Text>
        </Box>
      </Box>
    );
  }

  override getClipboardContent(result: CommandResult): string | undefined {
    return result.data?.id;
  }
}
```

Create `src/commands/list.ts`:

```typescript
import React from "react";
import { Text, Box } from "ink";
import {
  Command,
  type AppContext,
  type OptionSchema,
  type OptionValues,
  type CommandResult,
} from "@pablozaiden/terminatui";
import { Database } from "../services/database";
import type { Task } from "../types";

const options = {
  filter: {
    type: "string",
    description: "Filter by status",
    default: "all",
    enum: ["all", "pending", "completed"],
    label: "Status Filter",
  },
  priority: {
    type: "string",
    description: "Filter by priority",
    enum: ["low", "medium", "high"],
    label: "Priority Filter",
  },
} satisfies OptionSchema;

interface ListConfig {
  filter: "all" | "pending" | "completed";
  priority?: Task["priority"];
}

export class ListCommand extends Command<typeof options, ListConfig> {
  readonly name = "list";
  readonly description = "List tasks";
  readonly options = options;
  readonly displayName = "List Tasks";
  readonly actionLabel = "Show Tasks";
  readonly group = "Tasks";
  readonly order = 2;

  // Execute immediately when selected in TUI
  readonly immediateExecution = true;

  private db = new Database();

  override buildConfig(
    _ctx: AppContext,
    opts: OptionValues<typeof options>
  ): ListConfig {
    return {
      filter: (opts["filter"] as ListConfig["filter"]) ?? "all",
      priority: opts["priority"] as Task["priority"] | undefined,
    };
  }

  async execute(ctx: AppContext, config: ListConfig): Promise<CommandResult> {
    ctx.logger.debug(`Listing tasks: filter=${config.filter}`);

    let tasks = await this.db.listTasks(config.filter);

    if (config.priority) {
      tasks = tasks.filter((t) => t.priority === config.priority);
    }

    return {
      success: true,
      data: tasks,
      message: `Found ${tasks.length} tasks`,
    };
  }

  override renderResult(result: CommandResult): React.ReactNode {
    const tasks = (result.data as Task[]) ?? [];

    if (tasks.length === 0) {
      return <Text dimColor>No tasks found</Text>;
    }

    const priorityColor = (p: string) =>
      ({ high: "red", medium: "yellow", low: "green" })[p] as "red" | "yellow" | "green";

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>Tasks ({tasks.length})</Text>
        {tasks.map((task) => (
          <Box key={task.id} gap={2}>
            <Text dimColor>[{task.id}]</Text>
            <Text color={task.status === "completed" ? "gray" : undefined}>
              {task.status === "completed" ? "✓" : "○"} {task.title}
            </Text>
            <Text color={priorityColor(task.priority)}>{task.priority}</Text>
          </Box>
        ))}
      </Box>
    );
  }

  override getClipboardContent(result: CommandResult): string | undefined {
    const tasks = result.data as Task[];
    return tasks?.map((t) => `${t.id}: ${t.title}`).join("\n");
  }
}
```

Create `src/commands/complete.ts`:

```typescript
import React from "react";
import { Text, Box } from "ink";
import {
  Command,
  ConfigValidationError,
  type AppContext,
  type OptionSchema,
  type OptionValues,
  type CommandResult,
} from "@pablozaiden/terminatui";
import { Database } from "../services/database";
import { NotificationService } from "../services/notifications";
import type { Task } from "../types";

const options = {
  id: {
    type: "string",
    description: "Task ID to complete",
    required: true,
    label: "Task ID",
  },
} satisfies OptionSchema;

interface CompleteConfig {
  id: string;
}

export class CompleteCommand extends Command<typeof options, CompleteConfig> {
  readonly name = "complete";
  readonly description = "Mark a task as complete";
  readonly options = options;
  readonly displayName = "Complete Task";
  readonly actionLabel = "Mark Complete";
  readonly group = "Tasks";
  readonly order = 3;

  private db = new Database();

  override buildConfig(
    _ctx: AppContext,
    opts: OptionValues<typeof options>
  ): CompleteConfig {
    const id = opts["id"] as string;
    if (!id?.trim()) {
      throw new ConfigValidationError("Task ID is required", "id");
    }
    return { id: id.trim() };
  }

  async execute(ctx: AppContext, config: CompleteConfig): Promise<CommandResult> {
    ctx.logger.debug(`Completing task: ${config.id}`);

    const task = await this.db.completeTask(config.id);
    
    if (!task) {
      return {
        success: false,
        message: `Task not found: ${config.id}`,
      };
    }

    const notifications = new NotificationService(ctx.logger);
    notifications.taskCompleted(task);

    return {
      success: true,
      data: task,
      message: `Completed: ${task.title}`,
    };
  }

  override renderResult(result: CommandResult): React.ReactNode {
    if (!result.success) {
      return <Text color="red">✗ {result.message}</Text>;
    }

    const task = result.data as Task;
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Task Completed</Text>
        <Text>{task.title}</Text>
        <Text dimColor>
          Completed at: {task.completedAt?.toLocaleString()}
        </Text>
      </Box>
    );
  }
}
```

Create `src/commands/stats.ts`:

```typescript
import React from "react";
import { Text, Box } from "ink";
import {
  Command,
  type AppContext,
  type OptionSchema,
  type CommandResult,
} from "@pablozaiden/terminatui";
import { Database } from "../services/database";
import type { TaskStats } from "../types";

const options = {} satisfies OptionSchema;

export class StatsCommand extends Command<typeof options> {
  readonly name = "stats";
  readonly description = "Show task statistics";
  readonly options = options;
  readonly displayName = "Statistics";
  readonly actionLabel = "Show Stats";
  readonly group = "Analytics";
  readonly order = 1;
  readonly immediateExecution = true;

  private db = new Database();

  async execute(ctx: AppContext): Promise<CommandResult> {
    ctx.logger.debug("Fetching statistics");

    const stats = await this.db.getStats();

    return {
      success: true,
      data: stats,
      message: `Total: ${stats.total}, Pending: ${stats.pending}, Completed: ${stats.completed}`,
    };
  }

  override renderResult(result: CommandResult): React.ReactNode {
    const stats = result.data as TaskStats;

    const completionRate = stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>📊 Task Statistics</Text>
        
        <Box flexDirection="column">
          <Box gap={2}>
            <Text dimColor>Total:</Text>
            <Text>{stats.total}</Text>
          </Box>
          <Box gap={2}>
            <Text dimColor>Pending:</Text>
            <Text color="yellow">{stats.pending}</Text>
          </Box>
          <Box gap={2}>
            <Text dimColor>Completed:</Text>
            <Text color="green">{stats.completed}</Text>
          </Box>
          <Box gap={2}>
            <Text dimColor>Completion Rate:</Text>
            <Text color={completionRate >= 50 ? "green" : "yellow"}>
              {completionRate}%
            </Text>
          </Box>
        </Box>

        <Box flexDirection="column" marginTop={1}>
          <Text bold>By Priority:</Text>
          <Box gap={2}>
            <Text color="red">High: {stats.byPriority.high}</Text>
            <Text color="yellow">Medium: {stats.byPriority.medium}</Text>
            <Text color="green">Low: {stats.byPriority.low}</Text>
          </Box>
        </Box>
      </Box>
    );
  }
}
```

## Step 4: Create the Application

Create `src/index.ts`:

```typescript
import { TuiApplication } from "@pablozaiden/terminatui";
import { AddCommand } from "./commands/add";
import { ListCommand } from "./commands/list";
import { CompleteCommand } from "./commands/complete";
import { StatsCommand } from "./commands/stats";

class TasksCLI extends TuiApplication {
  constructor() {
    super({
      name: "tasks",
      version: "1.0.0",
      description: "A simple task management CLI",
      commands: [
        new AddCommand(),
        new ListCommand(),
        new CompleteCommand(),
        new StatsCommand(),
      ],
    });
  }

  // Optional: Override onBeforeRun for setup
  protected override async onBeforeRun(): Promise<void> {
    this.logger.debug("Tasks CLI starting...");
    // Initialize database connections, load config, etc.
  }

  // Optional: Override onAfterRun for cleanup
  protected override async onAfterRun(): Promise<void> {
    this.logger.debug("Tasks CLI shutting down...");
    // Close database connections, save state, etc.
  }
}

await new TasksCLI().run();
```

## Step 5: Configure Package

Update `package.json`:

```json
{
  "name": "tasks-cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "tasks": "./src/index.ts"
  },
  "scripts": {
    "start": "bun src/index.ts",
    "tui": "bun src/index.ts --tui",
    "build": "bun build src/index.ts --outdir dist --target bun"
  },
  "dependencies": {
    "@pablozaiden/terminatui": "^1.0.0"
  }
}
```

## Step 6: Run the Application

```bash
# CLI Mode
bun start add "Write documentation" --priority high
bun start list --filter pending
bun start complete abc123
bun start stats

# TUI Mode
bun tui

# With verbose logging
bun start --verbose add "Debug task" --priority low
```

## TUI Feature Summary

| Feature | Implementation |
|---------|----------------|
| Command Groups | `group = "Tasks"` or `"Analytics"` |
| Command Order | `order = 1, 2, 3` |
| Display Names | `displayName = "Add Task"` |
| Action Labels | `actionLabel = "Create Task"` |
| Immediate Execution | `immediateExecution = true` |
| Custom Results | `renderResult()` |
| Clipboard Support | `getClipboardContent()` |

## What You Learned

- **Project Structure**: Organize code into commands, services, types
- **Shared Services**: Database and notification services
- **Command Groups**: Organize commands in TUI sidebar
- **Full TUI Integration**: Custom rendering, clipboard, immediate execution
- **Lifecycle Hooks**: `onBeforeRun` and `onAfterRun`
- **Production Patterns**: Error handling, validation, logging

## Complete Series Summary

1. **Hello World** - Basic command structure
2. **Adding Options** - Option types and defaults
3. **Multiple Commands** - Command organization
4. **Subcommands** - Nested command hierarchies
5. **Interactive TUI** - TuiApplication basics
6. **Config Validation** - buildConfig and validation
7. **Async Cancellation** - Cancellable operations
8. **Complete Application** - Full production app

You now have all the tools to build powerful CLI applications with terminatui! 🎉

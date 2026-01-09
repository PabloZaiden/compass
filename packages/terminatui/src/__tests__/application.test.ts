import { describe, test, expect, afterEach } from "bun:test";
import { Application } from "../core/application.ts";
import { Command } from "../core/command.ts";
import { AppContext } from "../core/context.ts";
import type { OptionSchema, OptionValues, OptionDef } from "../types/command.ts";

// Define a proper option schema
const testOptions = {
  value: { 
    type: "string" as const, 
    description: "Test value" 
  } satisfies OptionDef
} as const satisfies OptionSchema;

// Test command implementations
class TestCommand extends Command<typeof testOptions> {
  readonly name = "test";
  readonly description = "A test command";
  readonly options = testOptions;

  executedWith: Record<string, unknown> | null = null;

  override async execute(
    _ctx: AppContext,
    opts: OptionValues<typeof testOptions>
  ): Promise<void> {
    this.executedWith = opts as Record<string, unknown>;
  }
}

class TuiCommand extends Command<OptionSchema> {
  readonly name = "tui-cmd";
  readonly description = "A TUI command";
  readonly options = {};

  executed = false;

  override async execute(_ctx: AppContext): Promise<void> {
    this.executed = true;
  }
}

describe("Application", () => {
  afterEach(() => {
    AppContext.clearCurrent();
  });

  describe("constructor", () => {
    test("creates application with name and version", () => {
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [],
      });
      expect(app.name).toBe("test-app");
      expect(app.version).toBe("1.0.0");
    });

    test("creates context and sets as current", () => {
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [],
      });
      expect(AppContext.hasCurrent()).toBe(true);
      expect(app.context).toBe(AppContext.current);
    });

    test("registers provided commands", () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      expect(app.registry.has("test")).toBe(true);
    });

    test("auto-registers version command", () => {
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [],
      });
      expect(app.registry.has("version")).toBe(true);
    });

    test("auto-registers help command", () => {
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [],
      });
      expect(app.registry.has("help")).toBe(true);
    });

    test("injects help subcommand into commands", () => {
      const cmd = new TestCommand();
      // Creating the Application injects help into commands
      new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      expect(cmd.subCommands).toBeDefined();
      expect(cmd.subCommands?.some((c) => c.name === "help")).toBe(true);
    });
  });

  describe("getContext", () => {
    test("returns the application context", () => {
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [],
      });
      expect(app.getContext()).toBe(app.context);
    });
  });

  describe("run", () => {
    test("shows help when no args and no default command", async () => {
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [new TestCommand()],
      });
      // Should not throw
      await app.run([]);
    });

    test("runs default command when no args", async () => {
      const cmd = new TuiCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
        defaultCommand: "tui-cmd",
      });
      await app.run([]);
      expect(cmd.executed).toBe(true);
    });

    test("runs specified command", async () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      await app.run(["test"]);
      expect(cmd.executedWith).not.toBeNull();
    });

    test("passes options to command", async () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      await app.run(["test", "--value", "hello"]);
      expect(cmd.executedWith).not.toBeNull();
      expect(cmd.executedWith?.["value"]).toBe("hello");
    });
  });

  describe("lifecycle hooks", () => {
    test("calls onBeforeRun", async () => {
      let called = false;
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      app.setHooks({
        onBeforeRun: async () => {
          called = true;
        },
      });
      await app.run(["test"]);
      expect(called).toBe(true);
    });

    test("calls onAfterRun", async () => {
      let called = false;
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      app.setHooks({
        onAfterRun: async () => {
          called = true;
        },
      });
      await app.run(["test"]);
      expect(called).toBe(true);
    });

    test("calls onError on exception", async () => {
      let errorCaught: Error | undefined;

      class ErrorCommand extends Command<OptionSchema> {
        readonly name = "error-cmd";
        readonly description = "A command that throws";
        readonly options = {};

        override async execute(): Promise<void> {
          throw new Error("Test error");
        }
      }

      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [new ErrorCommand()],
      });
      app.setHooks({
        onError: async (_ctx, error) => {
          errorCaught = error;
        },
      });
      await app.run(["error-cmd"]);
      expect(errorCaught?.message).toBe("Test error");
    });
  });

  describe("buildConfig", () => {
    // Config type for testing
    interface ParsedConfig {
      value: string;
      count: number;
    }

    const configOptions = {
      value: { type: "string" as const, description: "A value" },
      count: { type: "string" as const, description: "A count" },
    } as const satisfies OptionSchema;

    test("calls buildConfig before execute", async () => {
      let buildConfigCalled = false;
      let receivedConfig: ParsedConfig | null = null as ParsedConfig | null;

      class ConfigCommand extends Command<typeof configOptions, ParsedConfig> {
        readonly name = "config-cmd";
        readonly description = "A command with buildConfig";
        readonly options = configOptions;

        override buildConfig(
          _ctx: AppContext,
          opts: OptionValues<typeof configOptions>
        ): ParsedConfig {
          buildConfigCalled = true;
          return {
            value: opts.value as string,
            count: parseInt(opts.count as string, 10),
          };
        }

        override async execute(_ctx: AppContext, config: ParsedConfig): Promise<void> {
          receivedConfig = config;
        }
      }

      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [new ConfigCommand()],
      });

      await app.run(["config-cmd", "--value", "test", "--count", "42"]);
      
      expect(buildConfigCalled).toBe(true);
      expect(receivedConfig).toEqual({ value: "test", count: 42 });
    });

    test("passes raw options when buildConfig is not defined", async () => {
      let receivedOpts: Record<string, unknown> | null = null as Record<string, unknown> | null;

      class NoConfigCommand extends Command<typeof testOptions> {
        readonly name = "no-config-cmd";
        readonly description = "A command without buildConfig";
        readonly options = testOptions;

        override async execute(
          _ctx: AppContext,
          opts: OptionValues<typeof testOptions>
        ): Promise<void> {
          receivedOpts = opts as Record<string, unknown>;
        }
      }

      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [new NoConfigCommand()],
      });

      await app.run(["no-config-cmd", "--value", "hello"]);
      
      expect(receivedOpts).toEqual({ value: "hello" });
    });

    test("buildConfig errors are caught and handled", async () => {
      let errorCaught: Error | undefined;

      class FailConfigCommand extends Command<typeof testOptions, never> {
        readonly name = "fail-config";
        readonly description = "A command that fails buildConfig";
        readonly options = testOptions;

        override buildConfig(): never {
          throw new Error("Config validation failed");
        }

        override async execute(): Promise<void> {
          // Should never be called
        }
      }

      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [new FailConfigCommand()],
      });
      
      app.setHooks({
        onError: async (_ctx, error) => {
          errorCaught = error;
        },
      });

      await app.run(["fail-config", "--value", "test"]);
      
      expect(errorCaught?.message).toBe("Config validation failed");
    });
  });

  describe("global options", () => {
    test("parses --log-level before command", async () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      
      // Should not throw - global option should be parsed and removed
      await app.run(["--log-level", "debug", "test", "--value", "hello"]);
      expect(cmd.executedWith?.["value"]).toBe("hello");
    });

    test("parses --log-level after command", async () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      
      await app.run(["test", "--log-level", "debug", "--value", "hello"]);
      expect(cmd.executedWith?.["value"]).toBe("hello");
    });

    test("applies log-level case-insensitively", async () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      
      // All of these should work (case-insensitive)
      await app.run(["--log-level", "debug", "test"]);
      expect(app.context.logger.getMinLevel()).toBe(2); // Debug = 2
      
      await app.run(["--log-level", "Debug", "test"]);
      expect(app.context.logger.getMinLevel()).toBe(2);
      
      await app.run(["--log-level", "DEBUG", "test"]);
      expect(app.context.logger.getMinLevel()).toBe(2);
    });

    test("parses --detailed-logs flag", async () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      
      await app.run(["--detailed-logs", "test"]);
      // Should not throw - flag is recognized
      expect(cmd.executedWith).not.toBeNull();
    });

    test("parses --no-detailed-logs flag", async () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      
      await app.run(["--no-detailed-logs", "test"]);
      // Should not throw - flag is recognized
      expect(cmd.executedWith).not.toBeNull();
    });

    test("parses --log-level=value format", async () => {
      const cmd = new TestCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      
      await app.run(["--log-level=warn", "test"]);
      expect(app.context.logger.getMinLevel()).toBe(4); // Warn = 4
    });
  });
});

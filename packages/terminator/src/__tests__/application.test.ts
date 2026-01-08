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
class TestCliCommand extends Command<typeof testOptions> {
  readonly name = "test";
  readonly description = "A test command";
  readonly options = testOptions;

  executedWith: Record<string, unknown> | null = null;

  override async executeCli(
    _ctx: AppContext,
    opts: OptionValues<typeof testOptions>
  ): Promise<void> {
    this.executedWith = opts as Record<string, unknown>;
  }
}

class TestTuiCommand extends Command<OptionSchema> {
  readonly name = "tui-cmd";
  readonly description = "A TUI command";
  readonly options = {};

  executed = false;

  override async executeTui(_ctx: AppContext): Promise<void> {
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
      const cmd = new TestCliCommand();
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
      const cmd = new TestCliCommand();
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
        commands: [new TestCliCommand()],
      });
      // Should not throw
      await app.run([]);
    });

    test("runs default command when no args", async () => {
      const cmd = new TestTuiCommand();
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
      const cmd = new TestCliCommand();
      const app = new Application({
        name: "test-app",
        version: "1.0.0",
        commands: [cmd],
      });
      await app.run(["test"]);
      expect(cmd.executedWith).not.toBeNull();
    });

    test("passes options to command", async () => {
      const cmd = new TestCliCommand();
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
      const cmd = new TestCliCommand();
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
      const cmd = new TestCliCommand();
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

        override async executeCli(): Promise<void> {
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
});

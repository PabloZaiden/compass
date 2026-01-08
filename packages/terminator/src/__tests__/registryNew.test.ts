import { describe, test, expect, beforeEach } from "bun:test";
import { CommandRegistry } from "../core/registry.ts";
import { Command } from "../core/command.ts";
import type { AppContext } from "../core/context.ts";
import type { OptionSchema } from "../types/command.ts";

// Test command implementations
class TestCommand extends Command<OptionSchema> {
  constructor(
    public readonly name: string,
    public readonly description: string = "Test command"
  ) {
    super();
  }
  readonly options = {};

  override async execute(_ctx: AppContext): Promise<void> {}
}

describe("CommandRegistry (new)", () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe("register", () => {
    test("registers a command", () => {
      const cmd = new TestCommand("test");
      registry.register(cmd);
      expect(registry.has("test")).toBe(true);
    });

    test("throws on duplicate registration", () => {
      const cmd = new TestCommand("test");
      registry.register(cmd);
      expect(() => registry.register(cmd)).toThrow(
        "Command 'test' is already registered"
      );
    });
  });

  describe("registerAll", () => {
    test("registers multiple commands", () => {
      const cmd1 = new TestCommand("cmd1");
      const cmd2 = new TestCommand("cmd2");
      registry.registerAll([cmd1, cmd2]);
      expect(registry.has("cmd1")).toBe(true);
      expect(registry.has("cmd2")).toBe(true);
    });
  });

  describe("get", () => {
    test("returns command by name", () => {
      const cmd = new TestCommand("test");
      registry.register(cmd);
      expect(registry.get("test")).toBe(cmd);
    });

    test("returns undefined for unknown command", () => {
      expect(registry.get("unknown")).toBeUndefined();
    });
  });

  describe("has", () => {
    test("returns true for registered command", () => {
      registry.register(new TestCommand("test"));
      expect(registry.has("test")).toBe(true);
    });

    test("returns false for unknown command", () => {
      expect(registry.has("unknown")).toBe(false);
    });
  });

  describe("list", () => {
    test("returns empty array for empty registry", () => {
      expect(registry.list()).toEqual([]);
    });

    test("returns all registered commands", () => {
      const cmd1 = new TestCommand("cmd1");
      const cmd2 = new TestCommand("cmd2");
      registry.registerAll([cmd1, cmd2]);
      expect(registry.list()).toContain(cmd1);
      expect(registry.list()).toContain(cmd2);
    });
  });

  describe("names", () => {
    test("returns command names", () => {
      registry.register(new TestCommand("cmd1"));
      registry.register(new TestCommand("cmd2"));
      expect(registry.names()).toContain("cmd1");
      expect(registry.names()).toContain("cmd2");
    });
  });

  describe("resolve", () => {
    test("returns undefined for empty path", () => {
      const result = registry.resolve([]);
      expect(result.command).toBeUndefined();
    });

    test("resolves single command", () => {
      const cmd = new TestCommand("test");
      registry.register(cmd);
      const result = registry.resolve(["test"]);
      expect(result.command).toBe(cmd);
      expect(result.resolvedPath).toEqual(["test"]);
      expect(result.remainingPath).toEqual([]);
    });

    test("returns undefined for unknown command", () => {
      const result = registry.resolve(["unknown"]);
      expect(result.command).toBeUndefined();
      expect(result.remainingPath).toEqual(["unknown"]);
    });

    test("resolves nested subcommands", () => {
      const subCmd = new TestCommand("sub");
      const cmd = new TestCommand("parent");
      cmd.subCommands = [subCmd];
      registry.register(cmd);

      const result = registry.resolve(["parent", "sub"]);
      expect(result.command).toBe(subCmd);
      expect(result.resolvedPath).toEqual(["parent", "sub"]);
      expect(result.remainingPath).toEqual([]);
    });

    test("returns remaining path for unresolved parts", () => {
      const cmd = new TestCommand("parent");
      registry.register(cmd);

      const result = registry.resolve(["parent", "unknown"]);
      expect(result.command).toBe(cmd);
      expect(result.resolvedPath).toEqual(["parent"]);
      expect(result.remainingPath).toEqual(["unknown"]);
    });
  });

  describe("clear", () => {
    test("clears all commands", () => {
      registry.register(new TestCommand("test"));
      registry.clear();
      expect(registry.size).toBe(0);
    });
  });

  describe("size", () => {
    test("returns number of registered commands", () => {
      expect(registry.size).toBe(0);
      registry.register(new TestCommand("cmd1"));
      expect(registry.size).toBe(1);
      registry.register(new TestCommand("cmd2"));
      expect(registry.size).toBe(2);
    });
  });
});

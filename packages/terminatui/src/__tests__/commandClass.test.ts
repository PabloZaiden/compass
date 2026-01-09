import { describe, test, expect } from "bun:test";
import { Command, type CommandResult } from "../core/command.ts";
import type { AppContext } from "../core/context.ts";
import type { OptionSchema, OptionValues } from "../types/command.ts";

// Test command with options
class TestCommand extends Command<{ name: { type: "string"; description: string } }> {
  readonly name = "test";
  readonly description = "A test command";
  readonly options = {
    name: { type: "string" as const, description: "Name option" },
  };

  executedWith: OptionValues<typeof this.options> | null = null;

  override async execute(
    _ctx: AppContext,
    opts: OptionValues<typeof this.options>
  ): Promise<CommandResult> {
    this.executedWith = opts;
    return { success: true, message: "Executed" };
  }
}

// Simple command without options
class SimpleCommand extends Command<OptionSchema> {
  readonly name = "simple";
  readonly description = "A simple command";
  readonly options = {};

  executed = false;

  override async execute(_ctx: AppContext): Promise<CommandResult> {
    this.executed = true;
    return { success: true, message: "Done" };
  }
}

describe("Command", () => {
  describe("core properties", () => {
    test("has name", () => {
      const cmd = new TestCommand();
      expect(cmd.name).toBe("test");
    });

    test("has description", () => {
      const cmd = new TestCommand();
      expect(cmd.description).toBe("A test command");
    });

    test("has options", () => {
      const cmd = new TestCommand();
      expect(cmd.options).toEqual({
        name: { type: "string", description: "Name option" },
      });
    });
  });

  describe("optional metadata", () => {
    test("subCommands defaults to undefined", () => {
      const cmd = new TestCommand();
      expect(cmd.subCommands).toBeUndefined();
    });

    test("examples defaults to undefined", () => {
      const cmd = new TestCommand();
      expect(cmd.examples).toBeUndefined();
    });

    test("longDescription defaults to undefined", () => {
      const cmd = new TestCommand();
      expect(cmd.longDescription).toBeUndefined();
    });
  });

  describe("supportsCli", () => {
    test("returns true for command with execute", () => {
      const cmd = new TestCommand();
      expect(cmd.supportsCli()).toBe(true);
    });
  });

  describe("supportsTui", () => {
    test("returns true for command with execute", () => {
      const cmd = new TestCommand();
      expect(cmd.supportsTui()).toBe(true);
    });
  });

  describe("both modes", () => {
    test("command supports both CLI and TUI", () => {
      const cmd = new TestCommand();
      expect(cmd.supportsCli()).toBe(true);
      expect(cmd.supportsTui()).toBe(true);
    });
  });

  describe("validate", () => {
    test("passes for command with execute", () => {
      const cmd = new TestCommand();
      expect(() => cmd.validate()).not.toThrow();
    });
  });

  describe("subcommands", () => {
    test("hasSubCommands returns false when no subcommands", () => {
      const cmd = new TestCommand();
      expect(cmd.hasSubCommands()).toBe(false);
    });

    test("hasSubCommands returns true when subcommands exist", () => {
      const cmd = new TestCommand();
      cmd.subCommands = [new SimpleCommand()];
      expect(cmd.hasSubCommands()).toBe(true);
    });

    test("getSubCommand finds subcommand by name", () => {
      const cmd = new TestCommand();
      const subCmd = new SimpleCommand();
      cmd.subCommands = [subCmd];
      expect(cmd.getSubCommand("simple")).toBe(subCmd);
    });

    test("getSubCommand returns undefined for unknown name", () => {
      const cmd = new TestCommand();
      cmd.subCommands = [new SimpleCommand()];
      expect(cmd.getSubCommand("unknown")).toBeUndefined();
    });
  });
});

import { describe, test, expect } from "bun:test";
import { Command } from "../core/command.ts";
import type { AppContext } from "../core/context.ts";
import type { OptionSchema, OptionValues } from "../types/command.ts";

// Test command implementations
class TestCliCommand extends Command<{ name: { type: "string"; description: string } }> {
  readonly name = "test-cli";
  readonly description = "A test CLI command";
  readonly options = {
    name: { type: "string" as const, description: "Name option" },
  };

  executedWith: OptionValues<typeof this.options> | null = null;

  override async executeCli(
    _ctx: AppContext,
    opts: OptionValues<typeof this.options>
  ): Promise<void> {
    this.executedWith = opts;
  }
}

class TestTuiCommand extends Command<OptionSchema> {
  readonly name = "test-tui";
  readonly description = "A test TUI command";
  readonly options = {};

  executed = false;

  override async executeTui(_ctx: AppContext): Promise<void> {
    this.executed = true;
  }
}

class TestBothCommand extends Command<OptionSchema> {
  readonly name = "test-both";
  readonly description = "A command supporting both modes";
  readonly options = {};

  cliExecuted = false;
  tuiExecuted = false;

  override async executeCli(_ctx: AppContext): Promise<void> {
    this.cliExecuted = true;
  }

  override async executeTui(_ctx: AppContext): Promise<void> {
    this.tuiExecuted = true;
  }
}

class InvalidCommand extends Command<OptionSchema> {
  readonly name = "invalid";
  readonly description = "A command with no execute methods";
  readonly options = {};
  // No execute methods - should fail validation
}

describe("Command", () => {
  describe("core properties", () => {
    test("has name", () => {
      const cmd = new TestCliCommand();
      expect(cmd.name).toBe("test-cli");
    });

    test("has description", () => {
      const cmd = new TestCliCommand();
      expect(cmd.description).toBe("A test CLI command");
    });

    test("has options", () => {
      const cmd = new TestCliCommand();
      expect(cmd.options).toEqual({
        name: { type: "string", description: "Name option" },
      });
    });
  });

  describe("optional metadata", () => {
    test("subCommands defaults to undefined", () => {
      const cmd = new TestCliCommand();
      expect(cmd.subCommands).toBeUndefined();
    });

    test("examples defaults to undefined", () => {
      const cmd = new TestCliCommand();
      expect(cmd.examples).toBeUndefined();
    });

    test("longDescription defaults to undefined", () => {
      const cmd = new TestCliCommand();
      expect(cmd.longDescription).toBeUndefined();
    });
  });

  describe("supportsCli", () => {
    test("returns true when executeCli is implemented", () => {
      const cmd = new TestCliCommand();
      expect(cmd.supportsCli()).toBe(true);
    });

    test("returns false when executeCli is not implemented", () => {
      const cmd = new TestTuiCommand();
      expect(cmd.supportsCli()).toBe(false);
    });
  });

  describe("supportsTui", () => {
    test("returns true when executeTui is implemented", () => {
      const cmd = new TestTuiCommand();
      expect(cmd.supportsTui()).toBe(true);
    });

    test("returns false when executeTui is not implemented", () => {
      const cmd = new TestCliCommand();
      expect(cmd.supportsTui()).toBe(false);
    });
  });

  describe("both modes", () => {
    test("command can support both CLI and TUI", () => {
      const cmd = new TestBothCommand();
      expect(cmd.supportsCli()).toBe(true);
      expect(cmd.supportsTui()).toBe(true);
    });
  });

  describe("validate", () => {
    test("passes for CLI command", () => {
      const cmd = new TestCliCommand();
      expect(() => cmd.validate()).not.toThrow();
    });

    test("passes for TUI command", () => {
      const cmd = new TestTuiCommand();
      expect(() => cmd.validate()).not.toThrow();
    });

    test("passes for command supporting both", () => {
      const cmd = new TestBothCommand();
      expect(() => cmd.validate()).not.toThrow();
    });

    test("throws for command with no execute methods", () => {
      const cmd = new InvalidCommand();
      expect(() => cmd.validate()).toThrow(
        "Command 'invalid' must implement at least one of: executeCli, executeTui"
      );
    });
  });

  describe("subcommands", () => {
    test("hasSubCommands returns false when no subcommands", () => {
      const cmd = new TestCliCommand();
      expect(cmd.hasSubCommands()).toBe(false);
    });

    test("hasSubCommands returns true when subcommands exist", () => {
      const cmd = new TestCliCommand();
      cmd.subCommands = [new TestTuiCommand()];
      expect(cmd.hasSubCommands()).toBe(true);
    });

    test("getSubCommand finds subcommand by name", () => {
      const cmd = new TestCliCommand();
      const subCmd = new TestTuiCommand();
      cmd.subCommands = [subCmd];
      expect(cmd.getSubCommand("test-tui")).toBe(subCmd);
    });

    test("getSubCommand returns undefined for unknown name", () => {
      const cmd = new TestCliCommand();
      cmd.subCommands = [new TestTuiCommand()];
      expect(cmd.getSubCommand("unknown")).toBeUndefined();
    });
  });
});

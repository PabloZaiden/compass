import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { createVersionCommand, formatVersion } from "../builtins/version.ts";
import { createHelpCommand } from "../commands/help.ts";
import { defineCommand } from "../types/command.ts";

describe("Built-in Commands", () => {
  let originalLog: typeof console.log;
  let logOutput: string[];

  beforeEach(() => {
    originalLog = console.log;
    logOutput = [];
    console.log = (...args: unknown[]) => {
      logOutput.push(args.map(String).join(" "));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  describe("formatVersion", () => {
    test("formats version with commit hash", () => {
      const result = formatVersion("1.0.0", "abc1234567890");
      expect(result).toBe("1.0.0 - abc1234");
    });

    test("formats version with short commit hash", () => {
      const result = formatVersion("1.0.0", "abc1234");
      expect(result).toBe("1.0.0 - abc1234");
    });

    test("shows (dev) when no commit hash", () => {
      const result = formatVersion("1.0.0");
      expect(result).toBe("1.0.0 - (dev)");
    });

    test("shows (dev) when commit hash is empty", () => {
      const result = formatVersion("1.0.0", "");
      expect(result).toBe("1.0.0 - (dev)");
    });
  });

  describe("VersionCommand", () => {
    test("creates command with name 'version'", () => {
      const cmd = createVersionCommand("myapp", "1.0.0");
      expect(cmd.name).toBe("version");
    });

    test("has description", () => {
      const cmd = createVersionCommand("myapp", "1.0.0");
      expect(cmd.description).toBeDefined();
      expect(cmd.description.length).toBeGreaterThan(0);
    });

    test("has aliases including --version", () => {
      const cmd = createVersionCommand("myapp", "1.0.0");
      expect(cmd.aliases).toContain("--version");
      expect(cmd.aliases).toContain("-v");
    });

    test("getFormattedVersion returns version with dev", () => {
      const cmd = createVersionCommand("myapp", "1.2.3");
      expect(cmd.getFormattedVersion()).toBe("1.2.3 - (dev)");
    });

    test("getFormattedVersion returns version with commit hash", () => {
      const cmd = createVersionCommand("myapp", "1.2.3", "abc1234567890");
      expect(cmd.getFormattedVersion()).toBe("1.2.3 - abc1234");
    });
  });

  describe("createHelpCommand", () => {
    const mockCommands = [
      defineCommand({
        name: "run",
        description: "Run something",
        execute: () => {},
      }),
      defineCommand({
        name: "build",
        description: "Build something",
        execute: () => {},
      }),
    ];

    test("creates command with name 'help'", () => {
      const cmd = createHelpCommand({ getCommands: () => mockCommands });
      expect(cmd.name).toBe("help");
    });

    test("has description", () => {
      const cmd = createHelpCommand({ getCommands: () => mockCommands });
      expect(cmd.description).toBeDefined();
    });

    test("has aliases including --help", () => {
      const cmd = createHelpCommand({ getCommands: () => mockCommands });
      expect(cmd.aliases).toContain("--help");
    });

    test("is hidden by default", () => {
      const cmd = createHelpCommand({ getCommands: () => mockCommands });
      expect(cmd.hidden).toBe(true);
    });

    test("has command option", () => {
      const cmd = createHelpCommand({ getCommands: () => mockCommands });
      expect(cmd.options?.["command"]).toBeDefined();
    });

    test("execute calls getCommands", () => {
      const getCommands = mock(() => mockCommands);
      const cmd = createHelpCommand({ getCommands });
      // @ts-expect-error - testing with partial options
      cmd.execute({ options: {}, args: [], commandPath: ["help"] });
      expect(getCommands).toHaveBeenCalled();
    });

    test("shows help for specific command when provided", () => {
      const cmd = createHelpCommand({
        getCommands: () => mockCommands,
        appName: "myapp",
      });
      cmd.execute({
        options: { command: "run" },
        args: [],
        commandPath: ["help"],
      });
      expect(logOutput.join("")).toContain("run");
    });
  });
});

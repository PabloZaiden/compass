import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { createVersionCommand } from "../commands/version.ts";
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

  describe("createVersionCommand", () => {
    test("creates command with name 'version'", () => {
      const cmd = createVersionCommand("1.0.0");
      expect(cmd.name).toBe("version");
    });

    test("has description", () => {
      const cmd = createVersionCommand("1.0.0");
      expect(cmd.description).toBeDefined();
      expect(cmd.description.length).toBeGreaterThan(0);
    });

    test("has aliases including --version", () => {
      const cmd = createVersionCommand("1.0.0");
      expect(cmd.aliases).toContain("--version");
    });

    test("is not hidden", () => {
      const cmd = createVersionCommand("1.0.0");
      expect(cmd.hidden).toBeFalsy();
    });

    test("execute logs version", () => {
      const cmd = createVersionCommand("1.2.3");
      cmd.execute({ options: {}, args: [], commandPath: ["version"] });
      expect(logOutput.join("")).toContain("1.2.3");
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

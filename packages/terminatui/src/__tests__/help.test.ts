import { test, expect, describe } from "bun:test";
import {
  generateHelp,
  formatUsage,
  formatCommands,
  formatOptions,
  formatExamples,
  getCommandSummary,
  formatGlobalOptions,
  generateCommandHelp,
} from "../cli/help.ts";
import { defineCommand } from "../types/command.ts";

describe("Help Generation", () => {
  describe("formatUsage", () => {
    test("formats basic usage", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test command",
        execute: () => {},
      });

      const usage = formatUsage(cmd, "myapp");
      expect(usage).toContain("myapp");
      expect(usage).toContain("test");
    });

    test("includes [command] for commands with subcommands", () => {
      const cmd = defineCommand({
        name: "parent",
        description: "Parent command",
        subcommands: {
          child: defineCommand({
            name: "child",
            description: "Child",
            execute: () => {},
          }),
        },
        execute: () => {},
      });

      const usage = formatUsage(cmd);
      expect(usage).toContain("[command]");
    });

    test("includes [options] for commands with options", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test command",
        options: {
          verbose: { type: "boolean", description: "Verbose" },
        },
        execute: () => {},
      });

      const usage = formatUsage(cmd);
      expect(usage).toContain("[options]");
    });
  });

  describe("formatCommands", () => {
    test("formats subcommands list", () => {
      const cmd = defineCommand({
        name: "parent",
        description: "Parent",
        subcommands: {
          child: defineCommand({
            name: "child",
            description: "Child command",
            execute: () => {},
          }),
        },
        execute: () => {},
      });

      const commands = formatCommands(cmd);
      expect(commands).toContain("child");
      expect(commands).toContain("Child command");
    });

    test("excludes hidden commands", () => {
      const cmd = defineCommand({
        name: "parent",
        description: "Parent",
        subcommands: {
          visible: defineCommand({
            name: "visible",
            description: "Visible",
            execute: () => {},
          }),
          hidden: defineCommand({
            name: "hidden",
            description: "Hidden",
            hidden: true,
            execute: () => {},
          }),
        },
        execute: () => {},
      });

      const commands = formatCommands(cmd);
      expect(commands).toContain("visible");
      expect(commands).not.toMatch(/\bhidden\b/);
    });

    test("shows command aliases", () => {
      const cmd = defineCommand({
        name: "parent",
        description: "Parent",
        subcommands: {
          list: defineCommand({
            name: "list",
            description: "List items",
            aliases: ["ls", "l"],
            execute: () => {},
          }),
        },
        execute: () => {},
      });

      const commands = formatCommands(cmd);
      expect(commands).toContain("ls");
      expect(commands).toContain("l");
    });

    test("returns empty for no subcommands", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        execute: () => {},
      });

      const commands = formatCommands(cmd);
      expect(commands).toBe("");
    });
  });

  describe("formatOptions", () => {
    test("formats options with descriptions", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        options: {
          verbose: { type: "boolean", description: "Enable verbose" },
        },
        execute: () => {},
      });

      const options = formatOptions(cmd);
      expect(options).toContain("--verbose");
      expect(options).toContain("Enable verbose");
    });

    test("shows option aliases", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        options: {
          verbose: { type: "boolean", alias: "v", description: "Verbose" },
        },
        execute: () => {},
      });

      const options = formatOptions(cmd);
      expect(options).toContain("-v");
    });

    test("shows default values", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        options: {
          count: { type: "number", default: 10, description: "Count" },
        },
        execute: () => {},
      });

      const options = formatOptions(cmd);
      expect(options).toContain("10");
    });

    test("shows required marker", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        options: {
          name: { type: "string", required: true, description: "Name" },
        },
        execute: () => {},
      });

      const options = formatOptions(cmd);
      expect(options).toContain("*");
    });

    test("shows enum values", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        options: {
          level: {
            type: "string",
            enum: ["low", "high"],
            description: "Level",
          },
        },
        execute: () => {},
      });

      const options = formatOptions(cmd);
      expect(options).toContain("low");
      expect(options).toContain("high");
    });

    test("returns empty for no options", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        execute: () => {},
      });

      const options = formatOptions(cmd);
      expect(options).toBe("");
    });
  });

  describe("formatExamples", () => {
    test("formats examples list", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        examples: [
          { command: "test --verbose", description: "Run with verbose" },
        ],
        execute: () => {},
      });

      const examples = formatExamples(cmd);
      expect(examples).toContain("test --verbose");
      expect(examples).toContain("Run with verbose");
    });

    test("returns empty for no examples", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        execute: () => {},
      });

      const examples = formatExamples(cmd);
      expect(examples).toBe("");
    });
  });

  describe("generateHelp", () => {
    test("generates help with app name and version", () => {
      const cmd = defineCommand({
        name: "root",
        description: "Root command",
        execute: () => {},
      });

      const help = generateHelp(cmd, { appName: "myapp", version: "1.0.0" });
      expect(help).toContain("myapp");
      expect(help).toContain("1.0.0");
    });

    test("includes usage section", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        execute: () => {},
      });

      const help = generateHelp(cmd);
      expect(help).toContain("Usage:");
    });

    test("includes command description", () => {
      const cmd = defineCommand({
        name: "test",
        description: "A test command for testing",
        execute: () => {},
      });

      const help = generateHelp(cmd);
      expect(help).toContain("A test command for testing");
    });

    test("includes options section", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test",
        options: {
          verbose: { type: "boolean", description: "Verbose mode" },
        },
        execute: () => {},
      });

      const help = generateHelp(cmd);
      expect(help).toContain("Options:");
      expect(help).toContain("--verbose");
    });

    test("generates root help with commands", () => {
      const cmd = defineCommand({
        name: "root",
        description: "Root",
        subcommands: {
          run: defineCommand({
            name: "run",
            description: "Run something",
            execute: () => {},
          }),
        },
        execute: () => {},
      });

      const help = generateHelp(cmd);
      expect(help).toContain("Commands:");
      expect(help).toContain("run");
    });
  });

  describe("getCommandSummary", () => {
    test("returns command summary", () => {
      const cmd = defineCommand({
        name: "test",
        description: "A test command",
        execute: () => {},
      });

      const summary = getCommandSummary(cmd);
      expect(summary).toContain("test");
      expect(summary).toContain("A test command");
    });

    test("includes aliases in summary", () => {
      const cmd = defineCommand({
        name: "list",
        description: "List items",
        aliases: ["ls"],
        execute: () => {},
      });

      const summary = getCommandSummary(cmd);
      expect(summary).toContain("ls");
    });
  });

  describe("formatGlobalOptions", () => {
    test("includes --log-level option", () => {
      const result = formatGlobalOptions();
      expect(result).toContain("--log-level");
      expect(result).toContain("Set log level");
    });

    test("includes log level choices", () => {
      const result = formatGlobalOptions();
      expect(result).toContain("silly");
      expect(result).toContain("trace");
      expect(result).toContain("debug");
      expect(result).toContain("info");
      expect(result).toContain("warn");
      expect(result).toContain("error");
      expect(result).toContain("fatal");
    });

    test("includes --detailed-logs option", () => {
      const result = formatGlobalOptions();
      expect(result).toContain("--detailed-logs");
    });

    test("includes --no-detailed-logs option", () => {
      const result = formatGlobalOptions();
      expect(result).toContain("--no-detailed-logs");
    });
  });

  describe("generateCommandHelp with global options", () => {
    test("includes Global Options section", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test command",
        execute: () => {},
      });

      const help = generateCommandHelp(cmd, "myapp");
      expect(help).toContain("Global Options:");
      expect(help).toContain("--log-level");
      expect(help).toContain("--detailed-logs");
    });

    test("global options appear after command options", () => {
      const cmd = defineCommand({
        name: "test",
        description: "Test command",
        options: {
          verbose: { type: "boolean", description: "Verbose output" },
        },
        execute: () => {},
      });

      const help = generateCommandHelp(cmd, "myapp");
      const optionsIndex = help.indexOf("Options:");
      const globalOptionsIndex = help.indexOf("Global Options:");
      
      expect(optionsIndex).toBeGreaterThan(-1);
      expect(globalOptionsIndex).toBeGreaterThan(optionsIndex);
    });
  });
});
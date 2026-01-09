import { test, expect, describe } from "bun:test";
import {
  extractCommandChain,
  schemaToParseArgsOptions,
  parseOptionValues,
  validateOptions,
  parseCliArgs,
} from "../cli/parser.ts";
import type { OptionSchema } from "../types/command.ts";
import { defineCommand } from "../types/command.ts";

describe("extractCommandChain", () => {
  test("extracts command path with no flags", () => {
    const result = extractCommandChain(["run", "test"]);
    expect(result.commands).toEqual(["run", "test"]);
    expect(result.remaining).toEqual([]);
  });

  test("separates commands from flags", () => {
    const result = extractCommandChain(["run", "--verbose", "file.ts"]);
    expect(result.commands).toEqual(["run"]);
    expect(result.remaining).toEqual(["--verbose", "file.ts"]);
  });

  test("handles args starting with flags", () => {
    const result = extractCommandChain(["--help"]);
    expect(result.commands).toEqual([]);
    expect(result.remaining).toEqual(["--help"]);
  });

  test("handles short flags", () => {
    const result = extractCommandChain(["run", "-v"]);
    expect(result.commands).toEqual(["run"]);
    expect(result.remaining).toEqual(["-v"]);
  });

  test("handles empty args", () => {
    const result = extractCommandChain([]);
    expect(result.commands).toEqual([]);
    expect(result.remaining).toEqual([]);
  });

  test("extracts nested command path", () => {
    const result = extractCommandChain(["config", "set", "--key", "value"]);
    expect(result.commands).toEqual(["config", "set"]);
    expect(result.remaining).toEqual(["--key", "value"]);
  });
});

describe("schemaToParseArgsOptions", () => {
  test("converts string option", () => {
    const schema: OptionSchema = {
      name: { type: "string", description: "Name" },
    };
    const result = schemaToParseArgsOptions(schema);
    expect(result.options!["name"]?.type).toBe("string");
  });

  test("converts boolean option", () => {
    const schema: OptionSchema = {
      verbose: { type: "boolean", description: "Verbose" },
    };
    const result = schemaToParseArgsOptions(schema);
    expect(result.options!["verbose"]?.type).toBe("boolean");
  });

  test("converts alias to short", () => {
    const schema: OptionSchema = {
      verbose: { type: "boolean", alias: "v", description: "Verbose" },
    };
    const result = schemaToParseArgsOptions(schema);
    expect(result.options!["verbose"]?.short).toBe("v");
  });

  test("converts array option to multiple", () => {
    const schema: OptionSchema = {
      files: { type: "array", description: "Files" },
    };
    const result = schemaToParseArgsOptions(schema);
    expect(result.options!["files"]?.multiple).toBe(true);
  });

  test("includes default values", () => {
    const schema: OptionSchema = {
      count: { type: "number", default: 10, description: "Count" },
    };
    const result = schemaToParseArgsOptions(schema);
    // parseArgs expects string defaults for non-boolean types
    expect(result.options!["count"]?.default).toBe("10");
  });

  test("includes default values for boolean", () => {
    const schema: OptionSchema = {
      verbose: { type: "boolean", default: false, description: "Verbose" },
    };
    const result = schemaToParseArgsOptions(schema);
    // Boolean defaults remain as boolean
    expect(result.options!["verbose"]?.default).toBe(false);
  });
});

describe("parseOptionValues", () => {
  test("passes through string values", () => {
    const schema: OptionSchema = {
      name: { type: "string", description: "Name" },
    };
    const result = parseOptionValues(schema, { name: "test" });
    expect(result["name"]).toBe("test");
  });

  test("coerces number values", () => {
    const schema: OptionSchema = {
      count: { type: "number", description: "Count" },
    };
    const result = parseOptionValues(schema, { count: "42" });
    expect(result["count"]).toBe(42);
  });

  test("coerces boolean values", () => {
    const schema: OptionSchema = {
      verbose: { type: "boolean", description: "Verbose" },
    };
    const result = parseOptionValues(schema, { verbose: "true" });
    expect(result["verbose"]).toBe(true);
  });

  test("applies default values", () => {
    const schema: OptionSchema = {
      count: { type: "number", default: 5, description: "Count" },
    };
    const result = parseOptionValues(schema, {});
    expect(result["count"]).toBe(5);
  });

  test("reads from environment variables", () => {
    process.env["TEST_VALUE"] = "env-value";
    const schema: OptionSchema = {
      value: { type: "string", env: "TEST_VALUE", description: "Value" },
    };
    const result = parseOptionValues(schema, {});
    expect(result["value"]).toBe("env-value");
    delete process.env["TEST_VALUE"];
  });

  test("validates enum values", () => {
    const schema: OptionSchema = {
      level: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Level",
      },
    };
    const result = parseOptionValues(schema, { level: "medium" });
    expect(result["level"]).toBe("medium");
  });

  test("throws on invalid enum value", () => {
    const schema: OptionSchema = {
      level: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Level",
      },
    };
    expect(() => parseOptionValues(schema, { level: "invalid" })).toThrow();
  });
});

describe("validateOptions", () => {
  test("returns empty array for valid options", () => {
    const schema: OptionSchema = {
      name: { type: "string", description: "Name" },
    };
    const errors = validateOptions(schema, { name: "test" });
    expect(errors).toEqual([]);
  });

  test("returns error for missing required option", () => {
    const schema: OptionSchema = {
      name: { type: "string", required: true, description: "Name" },
    };
    const errors = validateOptions(schema, {} as Record<string, unknown>);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.type).toBe("missing_required");
  });

  test("validates number min/max", () => {
    const schema: OptionSchema = {
      count: { type: "number", min: 1, max: 10, description: "Count" },
    };
    const errors = validateOptions(schema, { count: 0 });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.type).toBe("validation");
  });
});

describe("parseCliArgs", () => {
  test("parses command name", () => {
    const cmd = defineCommand({
      name: "run",
      description: "Run command",
      execute: () => {},
    });

    const result = parseCliArgs({
      args: ["run"],
      commands: { run: cmd },
    });

    expect(result.command).toBe(cmd);
    expect(result.commandPath).toEqual(["run"]);
  });

  test("detects help flag", () => {
    const cmd = defineCommand({
      name: "run",
      description: "Run command",
      execute: () => {},
    });

    const result = parseCliArgs({
      args: ["run", "--help"],
      commands: { run: cmd },
    });

    expect(result.showHelp).toBe(true);
  });

  test("detects -h flag", () => {
    const cmd = defineCommand({
      name: "run",
      description: "Run command",
      execute: () => {},
    });

    const result = parseCliArgs({
      args: ["run", "-h"],
      commands: { run: cmd },
    });

    expect(result.showHelp).toBe(true);
  });

  test("returns error for unknown command", () => {
    const result = parseCliArgs({
      args: ["unknown"],
      commands: {},
    });

    expect(result.error?.type).toBe("unknown_command");
  });

  test("uses default command if provided", () => {
    const cmd = defineCommand({
      name: "default",
      description: "Default command",
      execute: () => {},
    });

    const result = parseCliArgs({
      args: [],
      commands: { default: cmd },
      defaultCommand: "default",
    });

    expect(result.command).toBe(cmd);
  });
});

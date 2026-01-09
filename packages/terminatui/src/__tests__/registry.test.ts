import { test, expect, describe } from "bun:test";
import { createCommandRegistry } from "../registry/commandRegistry.ts";
import { defineCommand } from "../types/command.ts";

describe("createCommandRegistry", () => {
  test("registers a command", () => {
    const registry = createCommandRegistry();
    const cmd = defineCommand({
      name: "test",
      description: "Test command",
      execute: () => {},
    });

    registry.register(cmd);

    expect(registry.has("test")).toBe(true);
  });

  test("retrieves command by name", () => {
    const registry = createCommandRegistry();
    const cmd = defineCommand({
      name: "greet",
      description: "Greet command",
      execute: () => {},
    });

    registry.register(cmd);

    expect(registry.get("greet")).toBe(cmd);
  });

  test("resolves command by alias", () => {
    const registry = createCommandRegistry();
    const cmd = defineCommand({
      name: "list",
      description: "List command",
      aliases: ["ls", "l"],
      execute: () => {},
    });

    registry.register(cmd);

    expect(registry.resolve("ls")).toBe(cmd);
    expect(registry.resolve("l")).toBe(cmd);
  });

  test("returns undefined for unknown command", () => {
    const registry = createCommandRegistry();
    expect(registry.get("unknown")).toBeUndefined();
  });

  test("lists all commands", () => {
    const registry = createCommandRegistry();
    const cmd1 = defineCommand({
      name: "a",
      description: "A",
      execute: () => {},
    });
    const cmd2 = defineCommand({
      name: "b",
      description: "B",
      execute: () => {},
    });

    registry.register(cmd1);
    registry.register(cmd2);

    const commands = registry.list();
    expect(commands).toContain(cmd1);
    expect(commands).toContain(cmd2);
  });

  test("throws on duplicate registration", () => {
    const registry = createCommandRegistry();
    const cmd = defineCommand({
      name: "dup",
      description: "Duplicate",
      execute: () => {},
    });

    registry.register(cmd);

    expect(() => registry.register(cmd)).toThrow();
  });

  test("throws on alias conflict", () => {
    const registry = createCommandRegistry();
    const cmd1 = defineCommand({
      name: "first",
      description: "First",
      aliases: ["f"],
      execute: () => {},
    });
    const cmd2 = defineCommand({
      name: "second",
      description: "Second",
      aliases: ["f"],
      execute: () => {},
    });

    registry.register(cmd1);

    expect(() => registry.register(cmd2)).toThrow();
  });

  test("has method checks existence by name", () => {
    const registry = createCommandRegistry();
    const cmd = defineCommand({
      name: "exists",
      description: "Exists",
      execute: () => {},
    });

    registry.register(cmd);

    expect(registry.has("exists")).toBe(true);
    expect(registry.has("notexists")).toBe(false);
  });

  test("has method checks existence by alias", () => {
    const registry = createCommandRegistry();
    const cmd = defineCommand({
      name: "cmd",
      description: "Cmd",
      aliases: ["c"],
      execute: () => {},
    });

    registry.register(cmd);

    expect(registry.has("c")).toBe(true);
  });

  test("getNames returns command names", () => {
    const registry = createCommandRegistry();
    const cmdA = defineCommand({
      name: "a",
      description: "A",
      execute: () => {},
    });
    const cmdB = defineCommand({
      name: "b",
      description: "B",
      execute: () => {},
    });

    registry.register(cmdA);
    registry.register(cmdB);

    const names = registry.getNames();
    expect(names).toContain("a");
    expect(names).toContain("b");
  });

  test("getCommandMap returns command map", () => {
    const registry = createCommandRegistry();
    const cmdA = defineCommand({
      name: "a",
      description: "A",
      execute: () => {},
    });
    const cmdB = defineCommand({
      name: "b",
      description: "B",
      execute: () => {},
    });

    registry.register(cmdA);
    registry.register(cmdB);

    const map = registry.getCommandMap();
    expect(map["a"]).toBe(cmdA);
    expect(map["b"]).toBe(cmdB);
  });

  test("resolve returns undefined for non-existent command", () => {
    const registry = createCommandRegistry();
    expect(registry.resolve("nonexistent")).toBeUndefined();
  });

  test("get does not resolve aliases", () => {
    const registry = createCommandRegistry();
    const cmd = defineCommand({
      name: "list",
      description: "List command",
      aliases: ["ls"],
      execute: () => {},
    });

    registry.register(cmd);

    expect(registry.get("ls")).toBeUndefined();
    expect(registry.resolve("ls")).toBe(cmd);
  });
});

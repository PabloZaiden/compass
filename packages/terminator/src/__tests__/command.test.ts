import { test, expect, describe } from "bun:test";
import { defineCommand } from "../types/command.ts";

describe("defineCommand", () => {
  test("creates a command with name and description", () => {
    const cmd = defineCommand({
      name: "test",
      description: "A test command",
      execute: () => {},
    });

    expect(cmd.name).toBe("test");
    expect(cmd.description).toBe("A test command");
  });

  test("creates a command with options", () => {
    const cmd = defineCommand({
      name: "test",
      description: "A test command",
      options: {
        verbose: {
          type: "boolean",
          description: "Enable verbose output",
          alias: "v",
        },
      },
      execute: () => {},
    });

    expect(cmd.options?.["verbose"]).toBeDefined();
    expect(cmd.options?.["verbose"]?.type).toBe("boolean");
  });

  test("creates a command with aliases", () => {
    const cmd = defineCommand({
      name: "test",
      description: "A test command",
      aliases: ["t", "tst"],
      execute: () => {},
    });

    expect(cmd.aliases).toEqual(["t", "tst"]);
  });

  test("creates a command with subcommands", () => {
    const sub = defineCommand({
      name: "sub",
      description: "A subcommand",
      execute: () => {},
    });

    const cmd = defineCommand({
      name: "parent",
      description: "A parent command",
      subcommands: { sub },
      execute: () => {},
    });

    expect(cmd.subcommands?.["sub"]).toBe(sub);
  });

  test("executes sync command", () => {
    let executed = false;
    const cmd = defineCommand({
      name: "test",
      description: "A test command",
      execute: () => {
        executed = true;
      },
    });

    cmd.execute({ options: {}, args: [], commandPath: ["test"] });
    expect(executed).toBe(true);
  });

  test("executes async command", async () => {
    let executed = false;
    const cmd = defineCommand({
      name: "test",
      description: "A test command",
      execute: async () => {
        await new Promise((r) => setTimeout(r, 10));
        executed = true;
      },
    });

    await cmd.execute({ options: {}, args: [], commandPath: ["test"] });
    expect(executed).toBe(true);
  });

  test("passes options to execute", () => {
    let receivedOptions: unknown;
    const cmd = defineCommand({
      name: "test",
      description: "A test command",
      options: {
        name: {
          type: "string",
          description: "Name option",
        },
      },
      execute: (ctx) => {
        receivedOptions = ctx.options;
      },
    });

    cmd.execute({ options: { name: "world" }, args: [], commandPath: ["test"] });
    expect(receivedOptions).toEqual({ name: "world" });
  });

  test("supports beforeExecute hook", async () => {
    const order: string[] = [];
    const cmd = defineCommand({
      name: "test",
      description: "A test command",
      beforeExecute: () => {
        order.push("before");
      },
      execute: () => {
        order.push("execute");
      },
    });

    await cmd.beforeExecute?.({ options: {}, args: [], commandPath: ["test"] });
    await cmd.execute({ options: {}, args: [], commandPath: ["test"] });
    expect(order).toEqual(["before", "execute"]);
  });

  test("supports afterExecute hook", async () => {
    const order: string[] = [];
    const cmd = defineCommand({
      name: "test",
      description: "A test command",
      execute: () => {
        order.push("execute");
      },
      afterExecute: () => {
        order.push("after");
      },
    });

    await cmd.execute({ options: {}, args: [], commandPath: ["test"] });
    await cmd.afterExecute?.({ options: {}, args: [], commandPath: ["test"] });
    expect(order).toEqual(["execute", "after"]);
  });

  test("supports hidden commands", () => {
    const cmd = defineCommand({
      name: "hidden",
      description: "A hidden command",
      hidden: true,
      execute: () => {},
    });

    expect(cmd.hidden).toBe(true);
  });
});

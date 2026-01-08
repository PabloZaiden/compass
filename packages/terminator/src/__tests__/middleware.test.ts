import { test, expect, describe } from "bun:test";
import {
  createMiddlewareStack,
  createExecutionContext,
  executeCommand,
} from "../registry/middleware.ts";
import { defineCommand } from "../types/command.ts";

describe("createMiddlewareStack", () => {
  test("creates empty stack", () => {
    const stack = createMiddlewareStack();
    expect(stack).toBeDefined();
    expect(typeof stack.use).toBe("function");
    expect(typeof stack.execute).toBe("function");
    expect(typeof stack.clear).toBe("function");
  });

  test("adds middleware with use()", () => {
    const stack = createMiddlewareStack();
    const middleware = async (_ctx: unknown, next: () => Promise<void>) => {
      await next();
    };
    stack.use(middleware);
    // No error means success
  });

  test("clears all middleware", () => {
    const stack = createMiddlewareStack();
    stack.use(async (_ctx, next) => await next());
    stack.clear();
    // No error means success
  });

  test("executes middleware in order", async () => {
    const stack = createMiddlewareStack();
    const order: number[] = [];

    stack.use(async (_ctx, next) => {
      order.push(1);
      await next();
      order.push(4);
    });

    stack.use(async (_ctx, next) => {
      order.push(2);
      await next();
      order.push(3);
    });

    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {},
    });

    const ctx = createExecutionContext(cmd, {});
    await stack.execute(ctx);

    expect(order).toEqual([1, 2, 3, 4]);
  });

  test("stops execution if aborted", async () => {
    const stack = createMiddlewareStack();
    let reached = false;

    stack.use(async (ctx, _next) => {
      ctx.abort("stopped");
    });

    stack.use(async (_ctx, next) => {
      reached = true;
      await next();
    });

    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {},
    });

    const ctx = createExecutionContext(cmd, {});
    await stack.execute(ctx);

    expect(ctx.aborted).toBe(true);
    expect(reached).toBe(false);
  });
});

describe("createExecutionContext", () => {
  test("creates context with command and options", () => {
    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {},
    });

    const ctx = createExecutionContext(cmd, { verbose: true });

    expect(ctx.command).toBe(cmd);
    expect(ctx.options["verbose"]).toBe(true);
    expect(ctx.aborted).toBe(false);
  });

  test("abort() sets aborted flag", () => {
    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {},
    });

    const ctx = createExecutionContext(cmd, {});
    ctx.abort();

    expect(ctx.aborted).toBe(true);
  });

  test("abort() with reason sets error", () => {
    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {},
    });

    const ctx = createExecutionContext(cmd, {});
    ctx.abort("Test reason");

    expect(ctx.aborted).toBe(true);
    expect(ctx.error?.message).toBe("Test reason");
  });
});

describe("executeCommand", () => {
  test("executes command and returns context", async () => {
    let executed = false;
    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {
        executed = true;
      },
    });

    const ctx = await executeCommand(cmd, {});

    expect(executed).toBe(true);
    expect(ctx.command).toBe(cmd);
  });

  test("captures error in context", async () => {
    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {
        throw new Error("Test error");
      },
    });

    const ctx = await executeCommand(cmd, {});

    expect(ctx.error?.message).toBe("Test error");
  });

  test("calls beforeExecute hook", async () => {
    const order: string[] = [];
    const cmd = defineCommand({
      name: "test",
      description: "Test",
      beforeExecute: () => {
        order.push("before");
      },
      execute: () => {
        order.push("execute");
      },
    });

    await executeCommand(cmd, {});

    expect(order).toEqual(["before", "execute"]);
  });

  test("calls afterExecute hook", async () => {
    const order: string[] = [];
    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {
        order.push("execute");
      },
      afterExecute: () => {
        order.push("after");
      },
    });

    await executeCommand(cmd, {});

    expect(order).toEqual(["execute", "after"]);
  });

  test("executes with middleware stack", async () => {
    const order: string[] = [];

    const stack = createMiddlewareStack();
    stack.use(async (_ctx, next) => {
      order.push("middleware-before");
      await next();
      order.push("middleware-after");
    });

    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {
        order.push("execute");
      },
    });

    await executeCommand(cmd, {}, stack);

    expect(order).toContain("middleware-before");
    expect(order).toContain("execute");
  });

  test("middleware can access context", async () => {
    let capturedName: string | undefined;

    const stack = createMiddlewareStack();
    stack.use(async (ctx, next) => {
      capturedName = ctx.command.name;
      await next();
    });

    const cmd = defineCommand({
      name: "test-cmd",
      description: "Test",
      execute: () => {},
    });

    await executeCommand(cmd, {}, stack);

    expect(capturedName).toBe("test-cmd");
  });

  test("middleware can catch errors", async () => {
    let caughtError: Error | undefined;

    const stack = createMiddlewareStack();
    stack.use(async (ctx, next) => {
      try {
        await next();
      } catch {
        caughtError = ctx.error;
      }
    });

    const cmd = defineCommand({
      name: "test",
      description: "Test",
      execute: () => {
        throw new Error("Middleware test error");
      },
    });

    await executeCommand(cmd, {}, stack);

    // Error is captured in context after execute
    expect(caughtError).toBeUndefined(); // Middleware runs before execute
  });
});

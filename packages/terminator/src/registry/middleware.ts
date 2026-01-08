import type { Command, OptionSchema, OptionValues } from "../types/command.ts";

/**
 * Execution context passed through middleware
 */
export interface ExecutionContext<T extends OptionSchema = OptionSchema> {
  command: Command<T>;
  options: OptionValues<T>;
  args: string[];
  commandPath: string[];
  aborted: boolean;
  error?: Error;
  abort(reason?: string): void;
}

/**
 * Middleware function
 */
export type Middleware<T extends OptionSchema = OptionSchema> = (
  ctx: ExecutionContext<T>,
  next: () => Promise<void>
) => Promise<void> | void;

/**
 * Middleware stack
 */
export interface MiddlewareStack<T extends OptionSchema = OptionSchema> {
  use(middleware: Middleware<T>): void;
  execute(ctx: ExecutionContext<T>): Promise<void>;
  clear(): void;
}

/**
 * Create execution context
 */
export function createExecutionContext<T extends OptionSchema>(
  command: Command<T>,
  options: OptionValues<T>,
  args: string[] = [],
  commandPath: string[] = []
): ExecutionContext<T> {
  const ctx: ExecutionContext<T> = {
    command,
    options,
    args,
    commandPath,
    aborted: false,
    abort(reason?: string) {
      ctx.aborted = true;
      if (reason) {
        ctx.error = new Error(reason);
      }
    },
  };
  return ctx;
}

/**
 * Create a middleware stack
 */
export function createMiddlewareStack<
  T extends OptionSchema = OptionSchema,
>(): MiddlewareStack<T> {
  const middlewares: Middleware<T>[] = [];

  return {
    use(middleware: Middleware<T>): void {
      middlewares.push(middleware);
    },

    async execute(ctx: ExecutionContext<T>): Promise<void> {
      let index = 0;

      const next = async (): Promise<void> => {
        if (ctx.aborted || index >= middlewares.length) {
          return;
        }

        const middleware = middlewares[index++];
        if (middleware) {
          await middleware(ctx, next);
        }
      };

      await next();
    },

    clear(): void {
      middlewares.length = 0;
    },
  };
}

/**
 * Execute a command with middleware
 */
export async function executeCommand<T extends OptionSchema>(
  command: Command<T>,
  options: OptionValues<T>,
  middlewareStack?: MiddlewareStack<T>
): Promise<ExecutionContext<T>> {
  const ctx = createExecutionContext(command, options);

  try {
    // Run middleware if provided
    if (middlewareStack) {
      await middlewareStack.execute(ctx);
      if (ctx.aborted) {
        return ctx;
      }
    }

    // Run beforeExecute hook
    if (command.beforeExecute) {
      await command.beforeExecute({
        options,
        args: ctx.args,
        commandPath: ctx.commandPath,
      });
    }

    // Execute command
    await command.execute({
      options,
      args: ctx.args,
      commandPath: ctx.commandPath,
    });

    // Run afterExecute hook
    if (command.afterExecute) {
      await command.afterExecute({
        options,
        args: ctx.args,
        commandPath: ctx.commandPath,
      });
    }
  } catch (error) {
    ctx.error = error instanceof Error ? error : new Error(String(error));
  }

  return ctx;
}

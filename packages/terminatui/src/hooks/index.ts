import { useState, useCallback } from "react";
import type { Command, OptionSchema, OptionValues } from "../types/command.ts";

/**
 * Hook for command execution
 */
export function useCommand<T extends OptionSchema>(command: Command<T>) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (options: OptionValues<T>) => {
      setIsExecuting(true);
      setError(null);

      try {
        await command.execute({
          options,
          args: [],
          commandPath: [command.name],
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsExecuting(false);
      }
    },
    [command]
  );

  return { execute, isExecuting, error };
}

/**
 * Hook for managing options state
 */
export function useOptions<T extends OptionSchema>(
  schema: T,
  initialValues?: Partial<OptionValues<T>>
) {
  const [values, setValues] = useState<OptionValues<T>>(() => {
    const defaults: Record<string, unknown> = {};
    for (const [key, def] of Object.entries(schema)) {
      defaults[key] = initialValues?.[key as keyof T] ?? def.default;
    }
    return defaults as OptionValues<T>;
  });

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: OptionValues<T>[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const reset = useCallback(() => {
    const defaults: Record<string, unknown> = {};
    for (const [key, def] of Object.entries(schema)) {
      defaults[key] = def.default;
    }
    setValues(defaults as OptionValues<T>);
  }, [schema]);

  return { values, setValue, setValues, reset };
}

/**
 * Hook for navigation between views
 */
export function useNavigation(views: string[], initialView?: string) {
  const [currentView, setCurrentView] = useState(initialView ?? views[0] ?? "");
  const [history, setHistory] = useState<string[]>([]);

  const navigate = useCallback((view: string) => {
    setHistory((prev) => [...prev, currentView]);
    setCurrentView(view);
  }, [currentView]);

  const goBack = useCallback(() => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setCurrentView(prev);
    }
  }, [history]);

  const canGoBack = history.length > 0;

  return { currentView, navigate, goBack, canGoBack };
}

/**
 * Hook for modal state
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}

/**
 * Hook for async operations
 */
export function useAsync<T>(asyncFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn]);

  return { data, isLoading, error, execute };
}

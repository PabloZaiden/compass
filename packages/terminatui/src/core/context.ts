import { Logger, createLogger, type LoggerConfig } from "./logger.ts";

/**
 * Application configuration stored in context.
 */
export interface AppConfig {
  /** Application name */
  name: string;
  /** Application version */
  version: string;
  /** Additional configuration values */
  [key: string]: unknown;
}

/**
 * AppContext is the central container for application-wide services and state.
 * It holds the logger, configuration, and a generic service registry.
 * 
 * Access the current context via `AppContext.current` or receive it
 * as a parameter in command execute methods.
 */
export class AppContext {
  private static _current: AppContext | null = null;
  private readonly services = new Map<string, unknown>();

  /** The application logger */
  public readonly logger: Logger;

  /** The application configuration */
  public readonly config: AppConfig;

  constructor(config: AppConfig, loggerConfig?: LoggerConfig) {
    this.config = config;
    this.logger = createLogger(loggerConfig);
  }

  /**
   * Get the current application context.
   * Throws if no context has been set.
   */
  static get current(): AppContext {
    if (!AppContext._current) {
      throw new Error(
        "AppContext.current accessed before initialization. " +
        "Ensure Application.run() has been called."
      );
    }
    return AppContext._current;
  }

  /**
   * Check if a current context exists.
   */
  static hasCurrent(): boolean {
    return AppContext._current !== null;
  }

  /**
   * Set the current application context.
   * Called internally by Application.
   */
  static setCurrent(context: AppContext): void {
    AppContext._current = context;
  }

  /**
   * Clear the current context.
   * Useful for testing.
   */
  static clearCurrent(): void {
    AppContext._current = null;
  }

  /**
   * Register a service in the context.
   * @param name Unique service identifier
   * @param service The service instance
   */
  setService<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Get a service from the context.
   * @param name Service identifier
   * @returns The service instance or undefined
   */
  getService<T>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  /**
   * Get a service, throwing if not found.
   * @param name Service identifier
   * @returns The service instance
   */
  requireService<T>(name: string): T {
    const service = this.getService<T>(name);
    if (service === undefined) {
      throw new Error(`Service '${name}' not found in AppContext`);
    }
    return service;
  }

  /**
   * Check if a service is registered.
   * @param name Service identifier
   */
  hasService(name: string): boolean {
    return this.services.has(name);
  }
}

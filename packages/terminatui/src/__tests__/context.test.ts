import { describe, test, expect, afterEach } from "bun:test";
import { AppContext, type AppConfig } from "../core/context.ts";

describe("AppContext", () => {
  afterEach(() => {
    AppContext.clearCurrent();
  });

  describe("constructor", () => {
    test("creates context with config", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      expect(ctx.config.name).toBe("test");
      expect(ctx.config.version).toBe("1.0.0");
    });

    test("creates context with logger", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      expect(ctx.logger).toBeDefined();
    });
  });

  describe("static current", () => {
    test("throws when no current context", () => {
      expect(() => AppContext.current).toThrow(
        "AppContext.current accessed before initialization"
      );
    });

    test("returns current context after setCurrent", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      AppContext.setCurrent(ctx);
      expect(AppContext.current).toBe(ctx);
    });

    test("hasCurrent returns false when no context", () => {
      expect(AppContext.hasCurrent()).toBe(false);
    });

    test("hasCurrent returns true after setCurrent", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      AppContext.setCurrent(ctx);
      expect(AppContext.hasCurrent()).toBe(true);
    });

    test("clearCurrent clears the context", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      AppContext.setCurrent(ctx);
      AppContext.clearCurrent();
      expect(AppContext.hasCurrent()).toBe(false);
    });
  });

  describe("services", () => {
    test("setService and getService work", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      const service = { value: 42 };
      ctx.setService("myService", service);
      expect(ctx.getService<typeof service>("myService")).toBe(service);
    });

    test("getService returns undefined for unknown service", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      expect(ctx.getService("unknown")).toBeUndefined();
    });

    test("requireService returns service", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      const service = { value: 42 };
      ctx.setService("myService", service);
      expect(ctx.requireService<typeof service>("myService")).toBe(service);
    });

    test("requireService throws for unknown service", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      expect(() => ctx.requireService("unknown")).toThrow(
        "Service 'unknown' not found"
      );
    });

    test("hasService returns correct value", () => {
      const config: AppConfig = { name: "test", version: "1.0.0" };
      const ctx = new AppContext(config);
      expect(ctx.hasService("myService")).toBe(false);
      ctx.setService("myService", {});
      expect(ctx.hasService("myService")).toBe(true);
    });
  });
});

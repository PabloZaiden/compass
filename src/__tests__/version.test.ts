import { describe, test, expect } from "bun:test";
import { formatVersion } from "@pablozaiden/terminatui";
import { CompassApp } from "../app";
import pkg from "../../package.json";

describe("version", () => {
    describe("formatVersion (from terminatui)", () => {
        test("formats version correctly with commit hash", () => {
            const result = formatVersion("1.0.0", "abc1234567890");
            expect(result).toBe("1.0.0 - abc1234");
        });

        test("shows (dev) when commit hash is empty", () => {
            const result = formatVersion("1.0.0", "");
            expect(result).toBe("1.0.0 - (dev)");
        });

        test("shows (dev) when commit hash is undefined", () => {
            const result = formatVersion("1.0.0");
            expect(result).toBe("1.0.0 - (dev)");
        });
    });

    describe("CompassApp", () => {
        test("CompassApp has correct name", () => {
            const app = new CompassApp();
            expect(app.name).toBe("compass");
        });

        test("CompassApp has version from package.json", () => {
            const app = new CompassApp();
            expect(app.version).toBe(pkg.version);
        });

        test("CompassApp has commitHash from package.json config", () => {
            const app = new CompassApp();
            expect(app.commitHash).toBe(pkg.config?.commitHash);
        });

        test("CompassApp has run, check, and generate commands", () => {
            const app = new CompassApp();
            const registry = app.registry;
            expect(registry.has("run")).toBe(true);
            expect(registry.has("check")).toBe(true);
            expect(registry.has("generate")).toBe(true);
        });

        test("CompassApp has built-in version command", () => {
            const app = new CompassApp();
            expect(app.registry.has("version")).toBe(true);
        });

        test("CompassApp has built-in help command", () => {
            const app = new CompassApp();
            expect(app.registry.has("help")).toBe(true);
        });
    });
});

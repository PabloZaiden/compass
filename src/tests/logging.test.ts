import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LogLevel, logger, setDetailedLogs } from "../logging";

// Create a temporary directory for testing
const TEST_CONFIG_DIR = join(tmpdir(), ".compass-test-" + Date.now());
const TEST_CONFIG_FILE = join(TEST_CONFIG_DIR, "logging-config.json");

describe("logging config", () => {
    beforeEach(() => {
        // Create test directory
        if (!existsSync(TEST_CONFIG_DIR)) {
            mkdirSync(TEST_CONFIG_DIR, { recursive: true });
        }
    });

    afterEach(() => {
        // Clean up test directory
        if (existsSync(TEST_CONFIG_DIR)) {
            rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
        }
    });

    describe("LogLevel enum", () => {
        test("LogLevel has expected values", () => {
            expect(LogLevel.Silly).toBe(0);
            expect(LogLevel.Trace).toBe(1);
            expect(LogLevel.Debug).toBe(2);
            expect(LogLevel.Info).toBe(3);
            expect(LogLevel.Warn).toBe(4);
            expect(LogLevel.Error).toBe(5);
            expect(LogLevel.Fatal).toBe(6);
        });

        test("LogLevel enum can be converted to string", () => {
            expect(LogLevel[LogLevel.Info]).toBe("Info");
            expect(LogLevel[LogLevel.Debug]).toBe("Debug");
            expect(LogLevel[LogLevel.Warn]).toBe("Warn");
        });

        test("logger settings can be updated with LogLevel", () => {
            const originalLevel = logger.settings.minLevel;
            
            logger.settings.minLevel = LogLevel.Debug;
            expect(logger.settings.minLevel).toBe(LogLevel.Debug);
            
            logger.settings.minLevel = LogLevel.Error;
            expect(logger.settings.minLevel).toBe(LogLevel.Error);
            
            // Restore original level
            logger.settings.minLevel = originalLevel;
        });
    });

    describe("setDetailedLogs", () => {
        test("setDetailedLogs can be called without error", () => {
            expect(() => setDetailedLogs(true)).not.toThrow();
            expect(() => setDetailedLogs(false)).not.toThrow();
        });
    });

    describe("config file format", () => {
        test("logging config should be valid JSON", () => {
            const config = {
                logLevel: LogLevel.Info,
                detailedLogs: false,
            };
            
            const json = JSON.stringify(config, null, 2);
            const parsed = JSON.parse(json);
            
            expect(parsed.logLevel).toBe(LogLevel.Info);
            expect(parsed.detailedLogs).toBe(false);
        });

        test("config file can be written and read", () => {
            const config = {
                logLevel: LogLevel.Debug,
                detailedLogs: true,
            };
            
            writeFileSync(TEST_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
            
            expect(existsSync(TEST_CONFIG_FILE)).toBe(true);
            
            const content = readFileSync(TEST_CONFIG_FILE, "utf-8");
            const parsed = JSON.parse(content);
            
            expect(parsed.logLevel).toBe(LogLevel.Debug);
            expect(parsed.detailedLogs).toBe(true);
        });
    });
});

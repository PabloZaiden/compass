import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { setDetailedLogs, setTuiLoggingEnabled, logger } from "../logging";
import { parseCliArgs } from "../cli/parser";
import { runOptionsSchema, checkOptionsSchema, getBooleanOption } from "../options";

describe("detailed-logs", () => {
    // Capture stderr output
    let stderrOutput: string[] = [];
    const originalStderrWrite = process.stderr.write.bind(process.stderr);

    beforeEach(() => {
        stderrOutput = [];
        process.stderr.write = ((chunk: string) => {
            stderrOutput.push(chunk);
            return true;
        }) as typeof process.stderr.write;
        // Ensure TUI logging is disabled for these tests
        setTuiLoggingEnabled(false);
    });

    afterEach(() => {
        process.stderr.write = originalStderrWrite;
        setDetailedLogs(false); // Reset to default
    });

    describe("CLI parsing", () => {
        test("run command parses --detailed-logs flag", () => {
            const result = parseCliArgs(["run", "--repo", "/path", "--fixture", "./f.json", "--agent", "copilot", "--detailed-logs"]);
            expect((result.options as Record<string, unknown>)["detailed-logs"]).toBe(true);
        });

        test("run command parses --no-detailed-logs flag", () => {
            const result = parseCliArgs(["run", "--repo", "/path", "--fixture", "./f.json", "--agent", "copilot", "--no-detailed-logs"]);
            expect((result.options as Record<string, unknown>)["detailed-logs"]).toBe(false);
        });

        test("run command defaults detailed-logs to undefined (schema default is false)", () => {
            const result = parseCliArgs(["run", "--repo", "/path", "--fixture", "./f.json", "--agent", "copilot"]);
            expect((result.options as Record<string, unknown>)["detailed-logs"]).toBeUndefined();
        });

        test("check command parses --detailed-logs flag", () => {
            const result = parseCliArgs(["check", "--detailed-logs"]);
            expect((result.options as Record<string, unknown>)["detailed-logs"]).toBe(true);
        });

        test("check command parses --no-detailed-logs flag", () => {
            const result = parseCliArgs(["check", "--no-detailed-logs"]);
            expect((result.options as Record<string, unknown>)["detailed-logs"]).toBe(false);
        });
    });

    describe("schema defaults", () => {
        test("run options schema has detailed-logs with default false", () => {
            expect(runOptionsSchema["detailed-logs"]).toBeDefined();
            expect(runOptionsSchema["detailed-logs"].type).toBe("boolean");
            expect(runOptionsSchema["detailed-logs"].default).toBe(false);
        });

        test("check options schema has detailed-logs with default false", () => {
            expect(checkOptionsSchema["detailed-logs"]).toBeDefined();
            expect(checkOptionsSchema["detailed-logs"].type).toBe("boolean");
            expect(checkOptionsSchema["detailed-logs"].default).toBe(false);
        });

        test("getBooleanOption returns schema default when not specified", () => {
            const options = {};
            const result = getBooleanOption(options, runOptionsSchema, "detailed-logs");
            expect(result).toBe(false);
        });

        test("getBooleanOption returns true when flag is set", () => {
            const options = { "detailed-logs": true };
            const result = getBooleanOption(options, runOptionsSchema, "detailed-logs");
            expect(result).toBe(true);
        });
    });

    describe("logging output format", () => {
        test("simple format (default) outputs message without metadata", () => {
            setDetailedLogs(false);
            logger.info("test message");

            expect(stderrOutput.length).toBe(1);
            expect(stderrOutput[0]).toBe("test message\n");
        });

        test("detailed format includes timestamp and level", () => {
            setDetailedLogs(true);
            logger.info("test message");

            expect(stderrOutput.length).toBe(1);
            // Detailed format includes timestamp and INFO level
            expect(stderrOutput[0]).toContain("INFO");
            expect(stderrOutput[0]).toContain("test message");
            // Check for date pattern (YYYY-MM-DD)
            expect(stderrOutput[0]).toMatch(/\d{4}-\d{2}-\d{2}/);
        });

        test("simple format works for error logs", () => {
            setDetailedLogs(false);
            logger.error("error message");

            expect(stderrOutput.length).toBe(1);
            expect(stderrOutput[0]).toBe("error message\n");
        });

        test("detailed format works for error logs", () => {
            setDetailedLogs(true);
            logger.error("error message");

            expect(stderrOutput.length).toBe(1);
            expect(stderrOutput[0]).toContain("ERROR");
            expect(stderrOutput[0]).toContain("error message");
        });
    });
});

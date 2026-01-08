import { describe, test, expect } from "bun:test";
import { buildCliCommand } from "../tui/utils/buildCliCommand.ts";
import type { OptionSchema } from "../types/command.ts";

describe("buildCliCommand", () => {
    test("builds command with no options", () => {
        const result = buildCliCommand("myapp", ["run"], {}, {});
        expect(result).toBe("myapp run");
    });

    test("includes string options", () => {
        const schema: OptionSchema = {
            name: { type: "string", description: "Name" },
        };
        const values = { name: "John" };
        
        const result = buildCliCommand("myapp", ["greet"], schema, values);
        expect(result).toBe("myapp greet --name John");
    });

    test("quotes string values with spaces", () => {
        const schema: OptionSchema = {
            name: { type: "string", description: "Name" },
        };
        const values = { name: "John Doe" };
        
        const result = buildCliCommand("myapp", ["greet"], schema, values);
        expect(result).toBe("myapp greet --name \"John Doe\"");
    });

    test("excludes empty string values", () => {
        const schema: OptionSchema = {
            name: { type: "string", description: "Name" },
        };
        const values = { name: "" };
        
        const result = buildCliCommand("myapp", ["greet"], schema, values);
        expect(result).toBe("myapp greet");
    });

    test("includes boolean flags only when true", () => {
        const schema: OptionSchema = {
            verbose: { type: "boolean", description: "Verbose" },
            quiet: { type: "boolean", description: "Quiet" },
        };
        const values = { verbose: true, quiet: false };
        
        const result = buildCliCommand("myapp", ["run"], schema, values);
        expect(result).toBe("myapp run --verbose");
    });

    test("includes number values", () => {
        const schema: OptionSchema = {
            count: { type: "number", description: "Count" },
        };
        const values = { count: 42 };
        
        const result = buildCliCommand("myapp", ["process"], schema, values);
        expect(result).toBe("myapp process --count 42");
    });

    test("excludes undefined and null values", () => {
        const schema: OptionSchema = {
            name: { type: "string", description: "Name" },
            count: { type: "number", description: "Count" },
        };
        const values = { name: undefined, count: null };
        
        const result = buildCliCommand("myapp", ["run"], schema, values);
        expect(result).toBe("myapp run");
    });

    test("handles array values", () => {
        const schema: OptionSchema = {
            files: { type: "array", description: "Files" },
        };
        const values = { files: ["a.txt", "b.txt"] };
        
        const result = buildCliCommand("myapp", ["process"], schema, values);
        expect(result).toBe("myapp process --files a.txt --files b.txt");
    });

    test("handles nested command path", () => {
        const schema: OptionSchema = {
            force: { type: "boolean", description: "Force" },
        };
        const values = { force: true };
        
        const result = buildCliCommand("myapp", ["db", "migrate"], schema, values);
        expect(result).toBe("myapp db migrate --force");
    });

    test("converts camelCase to kebab-case", () => {
        const schema: OptionSchema = {
            outputDir: { type: "string", description: "Output directory" },
            maxRetries: { type: "number", description: "Max retries" },
        };
        const values = { outputDir: "/tmp", maxRetries: 3 };
        
        const result = buildCliCommand("myapp", ["build"], schema, values);
        expect(result).toContain("--output-dir /tmp");
        expect(result).toContain("--max-retries 3");
    });

    test("skips values that match defaults", () => {
        const schema: OptionSchema = {
            verbose: { type: "boolean", description: "Verbose", default: false },
            count: { type: "number", description: "Count", default: 10 },
        };
        const values = { verbose: false, count: 10 };
        
        const result = buildCliCommand("myapp", ["run"], schema, values);
        expect(result).toBe("myapp run");
    });

    test("uses --no-flag for false when default is true", () => {
        const schema: OptionSchema = {
            color: { type: "boolean", description: "Color output", default: true },
        };
        const values = { color: false };
        
        const result = buildCliCommand("myapp", ["run"], schema, values);
        expect(result).toBe("myapp run --no-color");
    });
});

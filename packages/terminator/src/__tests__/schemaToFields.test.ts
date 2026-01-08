import { describe, test, expect } from "bun:test";
import { schemaToFieldConfigs, getFieldDisplayValue } from "../tui/utils/schemaToFields.ts";
import type { OptionSchema } from "../types/command.ts";

describe("schemaToFieldConfigs", () => {
    test("converts string type to text field", () => {
        const schema: OptionSchema = {
            name: {
                type: "string",
                description: "User name",
            },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields).toHaveLength(1);
        expect(fields[0]?.key).toBe("name");
        expect(fields[0]?.type).toBe("text");
        expect(fields[0]?.label).toBe("Name");
    });

    test("converts string with enum to enum field", () => {
        const schema: OptionSchema = {
            color: {
                type: "string",
                description: "Color choice",
                enum: ["red", "green", "blue"],
            },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields[0]?.type).toBe("enum");
        expect(fields[0]?.options).toHaveLength(3);
        expect(fields[0]?.options?.[0]?.name).toBe("red");
    });

    test("converts boolean type", () => {
        const schema: OptionSchema = {
            verbose: {
                type: "boolean",
                description: "Verbose output",
            },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields[0]?.type).toBe("boolean");
    });

    test("converts number type", () => {
        const schema: OptionSchema = {
            count: {
                type: "number",
                description: "Count",
            },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields[0]?.type).toBe("number");
    });

    test("converts array type to text", () => {
        const schema: OptionSchema = {
            files: {
                type: "array",
                description: "Files to process",
            },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields[0]?.type).toBe("text");
    });

    test("uses label from schema if provided", () => {
        const schema: OptionSchema = {
            repoPath: {
                type: "string",
                description: "Repository path",
                label: "Repository",
            },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields[0]?.label).toBe("Repository");
    });

    test("sorts by order", () => {
        const schema: OptionSchema = {
            third: { type: "string", description: "Third", order: 3 },
            first: { type: "string", description: "First", order: 1 },
            second: { type: "string", description: "Second", order: 2 },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields[0]?.key).toBe("first");
        expect(fields[1]?.key).toBe("second");
        expect(fields[2]?.key).toBe("third");
    });

    test("excludes tuiHidden fields", () => {
        const schema: OptionSchema = {
            visible: { type: "string", description: "Visible" },
            hidden: { type: "string", description: "Hidden", tuiHidden: true },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields).toHaveLength(1);
        expect(fields[0]?.key).toBe("visible");
    });

    test("includes placeholder from schema", () => {
        const schema: OptionSchema = {
            path: {
                type: "string",
                description: "Path",
                placeholder: "Enter path here",
            },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields[0]?.placeholder).toBe("Enter path here");
    });

    test("includes group from schema", () => {
        const schema: OptionSchema = {
            name: {
                type: "string",
                description: "Name",
                group: "Basic",
            },
        };
        
        const fields = schemaToFieldConfigs(schema);
        expect(fields[0]?.group).toBe("Basic");
    });
});

describe("getFieldDisplayValue", () => {
    test("displays boolean as True/False", () => {
        const field = { key: "enabled", label: "Enabled", type: "boolean" as const };
        expect(getFieldDisplayValue(true, field)).toBe("True");
        expect(getFieldDisplayValue(false, field)).toBe("False");
    });

    test("displays enum option name", () => {
        const field = {
            key: "color",
            label: "Color",
            type: "enum" as const,
            options: [
                { name: "Red", value: "red" },
                { name: "Green", value: "green" },
            ],
        };
        expect(getFieldDisplayValue("red", field)).toBe("Red");
        expect(getFieldDisplayValue("green", field)).toBe("Green");
    });

    test("displays (empty) for empty strings", () => {
        const field = { key: "name", label: "Name", type: "text" as const };
        expect(getFieldDisplayValue("", field)).toBe("(empty)");
        expect(getFieldDisplayValue(null, field)).toBe("(empty)");
        expect(getFieldDisplayValue(undefined, field)).toBe("(empty)");
    });

    test("truncates long values", () => {
        const field = { key: "desc", label: "Description", type: "text" as const };
        const longValue = "a".repeat(100);
        const result = getFieldDisplayValue(longValue, field);
        expect(result.length).toBe(60);
        expect(result.endsWith("...")).toBe(true);
    });

    test("displays short values as-is", () => {
        const field = { key: "name", label: "Name", type: "text" as const };
        expect(getFieldDisplayValue("hello", field)).toBe("hello");
    });
});

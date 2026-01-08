import { test, expect, describe } from "bun:test";
import { colors, supportsColors } from "../cli/output/colors.ts";

describe("colors", () => {
  describe("basic colors", () => {
    test("red wraps text", () => {
      const result = colors.red("test");
      expect(result).toContain("test");
    });

    test("green wraps text", () => {
      const result = colors.green("test");
      expect(result).toContain("test");
    });

    test("blue wraps text", () => {
      const result = colors.blue("test");
      expect(result).toContain("test");
    });

    test("yellow wraps text", () => {
      const result = colors.yellow("test");
      expect(result).toContain("test");
    });

    test("cyan wraps text", () => {
      const result = colors.cyan("test");
      expect(result).toContain("test");
    });

    test("gray wraps text", () => {
      const result = colors.gray("test");
      expect(result).toContain("test");
    });
  });

  describe("styles", () => {
    test("bold wraps text", () => {
      const result = colors.bold("test");
      expect(result).toContain("test");
    });

    test("dim wraps text", () => {
      const result = colors.dim("test");
      expect(result).toContain("test");
    });

    test("italic wraps text", () => {
      const result = colors.italic("test");
      expect(result).toContain("test");
    });

    test("underline wraps text", () => {
      const result = colors.underline("test");
      expect(result).toContain("test");
    });

    test("strikethrough wraps text", () => {
      const result = colors.strikethrough("test");
      expect(result).toContain("test");
    });
  });

  describe("semantic colors", () => {
    test("success includes checkmark and message", () => {
      const result = colors.success("done");
      expect(result).toContain("done");
      expect(result).toContain("✓");
    });

    test("error includes message", () => {
      const result = colors.error("failed");
      expect(result).toContain("failed");
    });

    test("warning includes message", () => {
      const result = colors.warning("caution");
      expect(result).toContain("caution");
    });

    test("info includes message", () => {
      const result = colors.info("note");
      expect(result).toContain("note");
    });
  });

  describe("chaining", () => {
    test("can combine bold and red", () => {
      const result = colors.bold(colors.red("test"));
      expect(result).toContain("test");
    });

    test("can combine dim and italic", () => {
      const result = colors.dim(colors.italic("test"));
      expect(result).toContain("test");
    });
  });

  describe("edge cases", () => {
    test("handles empty string", () => {
      const result = colors.red("");
      expect(typeof result).toBe("string");
    });

    test("handles string with newlines", () => {
      const result = colors.blue("line1\nline2");
      expect(result).toContain("line1");
      expect(result).toContain("line2");
    });

    test("handles string with special characters", () => {
      const result = colors.green("test © ® ™");
      expect(result).toContain("©");
    });
  });
});

describe("supportsColors", () => {
  test("is a function", () => {
    expect(typeof supportsColors).toBe("function");
  });

  test("returns a boolean", () => {
    const result = supportsColors();
    expect(typeof result).toBe("boolean");
  });
});

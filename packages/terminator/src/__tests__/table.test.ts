import { test, expect, describe } from "bun:test";
import { table, keyValueList, bulletList, numberedList } from "../cli/output/table.ts";

describe("table", () => {
  test("creates table with data and columns", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const result = table(data, { columns: ["name", "age"] });

    expect(result).toContain("name");
    expect(result).toContain("Alice");
    expect(result).toContain("Bob");
  });

  test("handles empty data", () => {
    const result = table([]);
    expect(result).toBe("");
  });

  test("handles single row", () => {
    const data = [{ col: "value" }];
    const result = table(data);
    expect(result).toContain("value");
  });

  test("handles multiple columns", () => {
    const data = [{ a: "1", b: "2", c: "3" }];
    const result = table(data);
    expect(result).toContain("1");
    expect(result).toContain("2");
    expect(result).toContain("3");
  });

  test("handles custom column config", () => {
    const data = [{ value: 123 }];
    const result = table(data, {
      columns: [{ key: "value", header: "Amount" }],
    });
    expect(result).toContain("Amount");
  });

  test("handles custom formatter", () => {
    const data = [{ price: 100 }];
    const result = table(data, {
      columns: [
        {
          key: "price",
          formatter: (v) => `$${v}`,
        },
      ],
    });
    expect(result).toContain("$100");
  });

  test("hides headers when showHeaders is false", () => {
    const data = [{ name: "Test" }];
    const result = table(data, { showHeaders: false });
    expect(result).not.toContain("---");
  });

  test("handles undefined values", () => {
    const data = [{ a: undefined }];
    const result = table(data);
    expect(typeof result).toBe("string");
  });
});

describe("keyValueList", () => {
  test("formats key-value pairs", () => {
    const data = { name: "Test", version: "1.0" };
    const result = keyValueList(data);
    expect(result).toContain("name");
    expect(result).toContain("Test");
    expect(result).toContain("version");
    expect(result).toContain("1.0");
  });

  test("handles empty object", () => {
    const result = keyValueList({});
    expect(result).toBe("");
  });

  test("handles custom separator", () => {
    const data = { key: "value" };
    const result = keyValueList(data, { separator: " =" });
    expect(result).toContain("=");
  });
});

describe("bulletList", () => {
  test("formats bullet list", () => {
    const items = ["one", "two", "three"];
    const result = bulletList(items);
    expect(result).toContain("•");
    expect(result).toContain("one");
    expect(result).toContain("two");
    expect(result).toContain("three");
  });

  test("handles empty array", () => {
    const result = bulletList([]);
    expect(result).toBe("");
  });

  test("handles custom bullet", () => {
    const items = ["item"];
    const result = bulletList(items, { bullet: "-" });
    expect(result).toContain("-");
  });

  test("handles indent", () => {
    const items = ["item"];
    const result = bulletList(items, { indent: 2 });
    expect(result.startsWith("  ")).toBe(true);
  });
});

describe("numberedList", () => {
  test("formats numbered list", () => {
    const items = ["first", "second"];
    const result = numberedList(items);
    expect(result).toContain("1.");
    expect(result).toContain("2.");
    expect(result).toContain("first");
    expect(result).toContain("second");
  });

  test("handles empty array", () => {
    const result = numberedList([]);
    expect(result).toBe("");
  });

  test("handles custom start number", () => {
    const items = ["item"];
    const result = numberedList(items, { start: 5 });
    expect(result).toContain("5.");
  });

  test("handles indent", () => {
    const items = ["item"];
    const result = numberedList(items, { indent: 2 });
    expect(result.startsWith("  ")).toBe(true);
  });
});

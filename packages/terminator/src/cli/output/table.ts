/**
 * Column configuration for tables
 */
export interface ColumnConfig {
  key: string;
  header?: string;
  width?: number;
  align?: "left" | "right" | "center";
  formatter?: (value: unknown) => string;
}

export interface TableOptions {
  columns?: (string | ColumnConfig)[];
  showHeaders?: boolean;
  border?: boolean;
}

/**
 * Create a formatted table string
 */
export function table<T extends Record<string, unknown>>(
  data: T[],
  options: TableOptions = {}
): string {
  if (data.length === 0) return "";

  const { showHeaders = true } = options;

  // Determine columns
  const columns: ColumnConfig[] = options.columns
    ? options.columns.map((col) =>
        typeof col === "string" ? { key: col, header: col } : col
      )
    : Object.keys(data[0] ?? {}).map((key) => ({ key, header: key }));

  // Calculate column widths
  const widths = columns.map((col) => {
    const headerWidth = (col.header ?? col.key).length;
    const maxDataWidth = Math.max(
      ...data.map((row) => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value) : String(value ?? "");
        return formatted.length;
      })
    );
    return col.width ?? Math.max(headerWidth, maxDataWidth);
  });

  // Format a row
  const formatRow = (values: string[]): string => {
    return values
      .map((val, i) => {
        const width = widths[i] ?? 10;
        const col = columns[i];
        const align = col?.align ?? "left";

        if (align === "right") {
          return val.padStart(width);
        } else if (align === "center") {
          const leftPad = Math.floor((width - val.length) / 2);
          return val.padStart(leftPad + val.length).padEnd(width);
        }
        return val.padEnd(width);
      })
      .join("  ");
  };

  const rows: string[] = [];

  // Add header
  if (showHeaders) {
    const headers = columns.map((col) => col.header ?? col.key);
    rows.push(formatRow(headers));
    rows.push(widths.map((w) => "-".repeat(w)).join("  "));
  }

  // Add data rows
  for (const row of data) {
    const values = columns.map((col) => {
      const value = row[col.key];
      return col.formatter ? col.formatter(value) : String(value ?? "");
    });
    rows.push(formatRow(values));
  }

  return rows.join("\n");
}

/**
 * Create a key-value list
 */
export function keyValueList(
  data: Record<string, unknown>,
  options: { separator?: string } = {}
): string {
  const { separator = ":" } = options;

  const entries = Object.entries(data);
  if (entries.length === 0) return "";

  const maxKeyLength = Math.max(...entries.map(([key]) => key.length));

  return entries
    .map(([key, value]) => `${key.padEnd(maxKeyLength)}${separator} ${value}`)
    .join("\n");
}

/**
 * Create a bullet list
 */
export function bulletList(
  items: string[],
  options: { bullet?: string; indent?: number } = {}
): string {
  const { bullet = "•", indent = 0 } = options;

  if (items.length === 0) return "";

  const prefix = " ".repeat(indent);
  return items.map((item) => `${prefix}${bullet} ${item}`).join("\n");
}

/**
 * Create a numbered list
 */
export function numberedList(
  items: string[],
  options: { start?: number; indent?: number } = {}
): string {
  const { start = 1, indent = 0 } = options;

  if (items.length === 0) return "";

  const prefix = " ".repeat(indent);
  const maxNum = start + items.length - 1;
  const numWidth = String(maxNum).length;

  return items
    .map((item, i) => `${prefix}${String(start + i).padStart(numWidth)}. ${item}`)
    .join("\n");
}

import { Theme } from "../theme.ts";

/**
 * JSON syntax highlighting types and colors
 */
type JsonTokenType = "key" | "string" | "number" | "boolean" | "null" | "punctuation";
type JsonToken = { type: JsonTokenType; value: string };
type JsonLineTokens = JsonToken[];

const TOKEN_COLORS: Record<JsonTokenType, string> = {
    key: "#61afef",      // blue
    string: "#98c379",   // green
    number: "#d19a66",   // orange
    boolean: "#c678dd",  // purple
    null: "#c678dd",     // purple
    punctuation: Theme.label,
};

function tokenizeJson(value: unknown, indent = 0): JsonLineTokens[] {
    const pad = "  ".repeat(indent);
    const padToken = (): JsonToken => ({ type: "punctuation", value: pad });

    if (value === null) {
        return [[padToken(), { type: "null", value: "null" }]];
    }
    if (typeof value === "boolean") {
        return [[padToken(), { type: "boolean", value: String(value) }]];
    }
    if (typeof value === "number") {
        return [[padToken(), { type: "number", value: String(value) }]];
    }
    if (typeof value === "string") {
        return [[padToken(), { type: "string", value: JSON.stringify(value) }]];
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return [[padToken(), { type: "punctuation", value: "[]" }]];
        }
        const lines: JsonLineTokens[] = [[padToken(), { type: "punctuation", value: "[" }]];
        value.forEach((item, idx) => {
            const itemLines = tokenizeJson(item, indent + 1);
            const isLast = idx === value.length - 1;
            itemLines.forEach((line, lineIdx) => {
                if (lineIdx === itemLines.length - 1 && !isLast) {
                    lines.push([...line, { type: "punctuation", value: "," }]);
                } else {
                    lines.push(line);
                }
            });
        });
        lines.push([padToken(), { type: "punctuation", value: "]" }]);
        return lines;
    }
    if (typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0) {
            return [[padToken(), { type: "punctuation", value: "{}" }]];
        }
        const lines: JsonLineTokens[] = [[padToken(), { type: "punctuation", value: "{" }]];
        const innerPad = "  ".repeat(indent + 1);
        
        entries.forEach(([key, val], idx) => {
            const valLines = tokenizeJson(val, indent + 1);
            const isLast = idx === entries.length - 1;
            
            // First value line - prepend key
            const firstValLine = valLines[0] ?? [];
            // Remove the padding from value's first line (we'll add our own with the key)
            const valTokens = firstValLine.filter(t => t.value !== "  ".repeat(indent + 1));
            
            const keyLine: JsonLineTokens = [
                { type: "punctuation", value: innerPad },
                { type: "key", value: `"${key}"` },
                { type: "punctuation", value: ": " },
                ...valTokens,
            ];
            
            if (valLines.length === 1) {
                // Single line value
                if (!isLast) keyLine.push({ type: "punctuation", value: "," });
                lines.push(keyLine);
            } else {
                // Multi-line value
                lines.push(keyLine);
                valLines.slice(1, -1).forEach(line => lines.push(line));
                const lastLine = valLines[valLines.length - 1] ?? [];
                if (!isLast) {
                    lines.push([...lastLine, { type: "punctuation", value: "," }]);
                } else {
                    lines.push(lastLine);
                }
            }
        });
        lines.push([padToken(), { type: "punctuation", value: "}" }]);
        return lines;
    }
    return [];
}

export interface JsonHighlightProps {
    /** The value to render as syntax-highlighted JSON */
    value: unknown;
}

/**
 * Render JSON with syntax highlighting.
 * 
 * Tokenizes the JSON value and renders each token with appropriate colors:
 * - Keys: blue
 * - Strings: green
 * - Numbers: orange
 * - Booleans/null: purple
 * - Punctuation: theme label color
 */
export function JsonHighlight({ value }: JsonHighlightProps) {
    const lines = tokenizeJson(value);
    return (
        <box flexDirection="column">
            {lines.map((tokens, lineIdx) => (
                <text key={`json-${lineIdx}`}>
                    {tokens.map((token, tokenIdx) => (
                        <span key={tokenIdx} fg={TOKEN_COLORS[token.type]}>{token.value}</span>
                    ))}
                </text>
            ))}
        </box>
    );
}

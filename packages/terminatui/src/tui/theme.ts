/**
 * Default TUI theme colors.
 */
export const Theme = {
    background: "#0b0c10",
    border: "#2c2f36",
    borderFocused: "#5da9e9",
    borderSelected: "#61afef",
    label: "#c0cad6",
    value: "#98c379",
    actionButton: "#a0e8af",
    header: "#a8b3c1",
    statusText: "#d6dde6",
    overlay: "#0e1117",
    overlayTitle: "#e5c07b",
    error: "#f78888",
    success: "#98c379",
    warning: "#f5c542",
} as const;

export type ThemeColors = typeof Theme;

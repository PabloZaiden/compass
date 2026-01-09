// ANSI escape codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const ITALIC = "\x1b[3m";
const UNDERLINE = "\x1b[4m";
const STRIKETHROUGH = "\x1b[9m";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";
const GRAY = "\x1b[90m";

const BG_RED = "\x1b[41m";
const BG_GREEN = "\x1b[42m";
const BG_YELLOW = "\x1b[43m";
const BG_BLUE = "\x1b[44m";

/**
 * Check if terminal supports colors
 */
export function supportsColors(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env["NO_COLOR"]) return false;
  if (process.env["FORCE_COLOR"]) return true;
  if (process.stdout?.isTTY) return true;
  return false;
}

function wrap(code: string, text: string): string {
  if (!supportsColors()) return text;
  return `${code}${text}${RESET}`;
}

/**
 * Color utilities for terminal output
 */
export const colors = {
  // Basic colors
  red: (text: string) => wrap(RED, text),
  green: (text: string) => wrap(GREEN, text),
  yellow: (text: string) => wrap(YELLOW, text),
  blue: (text: string) => wrap(BLUE, text),
  magenta: (text: string) => wrap(MAGENTA, text),
  cyan: (text: string) => wrap(CYAN, text),
  white: (text: string) => wrap(WHITE, text),
  gray: (text: string) => wrap(GRAY, text),

  // Styles
  bold: (text: string) => wrap(BOLD, text),
  dim: (text: string) => wrap(DIM, text),
  italic: (text: string) => wrap(ITALIC, text),
  underline: (text: string) => wrap(UNDERLINE, text),
  strikethrough: (text: string) => wrap(STRIKETHROUGH, text),

  // Background colors
  bgRed: (text: string) => wrap(BG_RED, text),
  bgGreen: (text: string) => wrap(BG_GREEN, text),
  bgYellow: (text: string) => wrap(BG_YELLOW, text),
  bgBlue: (text: string) => wrap(BG_BLUE, text),

  // Semantic colors
  success: (text: string) => wrap(GREEN, `✓ ${text}`),
  error: (text: string) => wrap(RED, `✗ ${text}`),
  warning: (text: string) => wrap(YELLOW, `⚠ ${text}`),
  info: (text: string) => wrap(BLUE, `ℹ ${text}`),

  // Reset
  reset: RESET,
};

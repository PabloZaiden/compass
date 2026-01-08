// Types
export { defineCommand, defineTuiCommand } from "./types/command.ts";
export type {
  Command,
  TuiCommand,
  OptionDef,
  OptionSchema,
  OptionValues,
  CommandContext,
  CommandExecutor,
} from "./types/command.ts";

// CLI Parser
export {
  parseCliArgs,
  extractCommandChain,
  schemaToParseArgsOptions,
  parseOptionValues,
  validateOptions,
} from "./cli/parser.ts";
export type { ParseResult, ParseError } from "./cli/parser.ts";

// Registry
export { createCommandRegistry } from "./registry/commandRegistry.ts";
export type { CommandRegistry } from "./registry/commandRegistry.ts";

// Middleware
export {
  createMiddlewareStack,
  executeCommand,
  createExecutionContext,
} from "./registry/middleware.ts";
export type {
  Middleware,
  MiddlewareStack,
  ExecutionContext,
} from "./registry/middleware.ts";

// Built-in Commands
export { createVersionCommand } from "./commands/version.ts";
export { createHelpCommand } from "./commands/help.ts";

// CLI Output
export { colors, supportsColors } from "./cli/output/colors.ts";
export { table, keyValueList, bulletList, numberedList } from "./cli/output/table.ts";

// Help Generation
export {
  generateHelp,
  formatCommands,
  formatOptions,
  formatUsage,
  formatExamples,
  getCommandSummary,
} from "./cli/help.ts";

// TUI
export { createApp } from "./tui/app.ts";
export type { AppConfig, AppState } from "./tui/app.ts";

// Components
export { Box, Text, Input, Select, Button, Modal, Spinner } from "./components/index.ts";

// Hooks
export { useCommand, useOptions, useNavigation, useModal, useAsync } from "./hooks/index.ts";

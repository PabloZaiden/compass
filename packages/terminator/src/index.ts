// Core - New OOP Architecture
export {
  Application,
  AppContext,
  Command,
  CommandRegistry,
  ConfigValidationError,
  AbortError,
  Logger,
  createLogger,
  LogLevel,
  generateCommandHelp,
  generateAppHelp,
} from "./core/index.ts";
export type {
  ApplicationConfig,
  ApplicationHooks,
  GlobalOptions,
  AppConfig,
  AnyCommand,
  CommandExample,
  CommandResult,
  CommandExecutionContext,
  ResolveResult,
  LoggerConfig,
  LogEvent,
  HelpOptions,
} from "./core/index.ts";

// Execution Mode
export { ExecutionMode } from "./types/execution.ts";

// Built-in Commands (new)
export { HelpCommand, VersionCommand, SettingsCommand, formatVersion } from "./builtins/index.ts";
export type { VersionConfig } from "./builtins/index.ts";

// TUI Framework (new)
export {
  TuiApp,
  TuiApplication,
  Theme,
  KeyboardProvider,
  KeyboardPriority,
  useKeyboardHandler,
  useClipboard,
  useSpinner,
  useConfigState,
  useCommandExecutor,
  useLogStream,
  LogLevel as TuiLogLevel,
  FieldRow,
  ActionButton,
  Header,
  StatusBar,
  LogsPanel,
  ResultsPanel,
  ConfigForm,
  EditorModal,
  CliModal,
  CommandSelector,
  JsonHighlight,
  schemaToFieldConfigs,
  groupFieldConfigs,
  getFieldDisplayValue,
  buildCliCommand,
} from "./tui/index.ts";
export type {
  TuiApplicationConfig,
  ThemeColors,
  KeyboardEvent as TuiKeyboardEvent,
  KeyboardHandler,
  UseClipboardResult,
  UseSpinnerResult,
  UseConfigStateOptions,
  UseConfigStateResult,
  UseCommandExecutorResult,
  LogEntry,
  LogEvent as TuiLogEvent,
  LogSource,
  UseLogStreamResult,
  FieldType,
  FieldOption,
  FieldConfig,
} from "./tui/index.ts";

// Types (legacy, for backwards compatibility)
export { defineCommand, defineTuiCommand } from "./types/command.ts";
export type {
  Command as LegacyCommand,
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

// Registry (legacy)
export { createCommandRegistry } from "./registry/commandRegistry.ts";
export type { CommandRegistry as LegacyCommandRegistry } from "./registry/commandRegistry.ts";

// Built-in Commands (legacy)
export { createHelpCommand } from "./commands/help.ts";

// CLI Output
export { colors, supportsColors } from "./cli/output/colors.ts";
export { table, keyValueList, bulletList, numberedList } from "./cli/output/table.ts";

// Help Generation (legacy)
export {
  generateHelp,
  formatCommands,
  formatOptions as formatOptionsLegacy,
  formatUsage as formatUsageLegacy,
  formatExamples as formatExamplesLegacy,
  getCommandSummary,
} from "./cli/help.ts";

// TUI
export { createApp } from "./tui/app.ts";
export type { AppConfig as TuiAppConfig, AppState } from "./tui/app.ts";

// Components
export { Box, Text, Input, Select, Button, Modal, Spinner } from "./components/index.ts";

// Hooks
export { useCommand, useOptions, useNavigation, useModal, useAsync } from "./hooks/index.ts";

// Main TUI components
export { TuiApp } from "./TuiApp.tsx";
export { TuiApplication, type TuiApplicationConfig, type CustomField } from "./TuiApplication.tsx";

// Theme
export { Theme, type ThemeColors } from "./theme.ts";

// Context
export {
    KeyboardProvider,
    useKeyboardContext,
    KeyboardPriority,
    type KeyboardEvent,
    type KeyboardHandler,
} from "./context/index.ts";

// Hooks
export {
    useKeyboardHandler,
    useClipboard,
    useSpinner,
    useConfigState,
    useCommandExecutor,
    useLogStream,
    LogLevel,
    type UseClipboardResult,
    type UseSpinnerResult,
    type UseConfigStateOptions,
    type UseConfigStateResult,
    type UseCommandExecutorResult,
    type LogEntry,
    type LogEvent,
    type LogSource,
    type UseLogStreamResult,
} from "./hooks/index.ts";

// Components
export {
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
    type FieldType,
    type FieldOption,
    type FieldConfig,
    type JsonHighlightProps,
} from "./components/index.ts";

// Utilities
export {
    schemaToFieldConfigs,
    groupFieldConfigs,
    getFieldDisplayValue,
    buildCliCommand,
} from "./utils/index.ts";

// Legacy export for backward compatibility
export * from "./app.ts";

/**
 * Execution mode determines how a command runs.
 * - Cli: Command-line mode with arguments, executes and exits
 * - Tui: Terminal UI mode with interactive rendering
 */
export enum ExecutionMode {
  /** Command-line mode: parse args, execute, exit */
  Cli = "cli",
  /** Terminal UI mode: interactive render loop */
  Tui = "tui",
}

/**
 * App configuration
 */
export interface AppConfig {
  name: string;
  version?: string;
  description?: string;
}

/**
 * App state
 */
export interface AppState {
  currentView: string;
  isLoading: boolean;
  error?: Error;
}

/**
 * Create a TUI application
 */
export function createApp(_config: AppConfig) {
  return {
    run: async () => {
      // Placeholder for TUI app runner
      console.log("TUI app started");
    },
  };
}

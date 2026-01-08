import { createLogger } from "@pablozaiden/terminator";

// Create a test logger with detailed logging enabled
const testLogger = createLogger({ detailed: true });

// Export for use in tests if needed
export { testLogger };

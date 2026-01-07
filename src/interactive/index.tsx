import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App";
import { setTuiLoggingEnabled, logger } from "../logging";
import { Theme } from "./utils";

export async function render(): Promise<void> {
    setTuiLoggingEnabled(true);

    const renderer = await createCliRenderer({
        useAlternateScreen: true,
        useConsole: false,
        exitOnCtrlC: true,
        backgroundColor: Theme.background,
        useMouse: true,
        enableMouseMovement: true,
        openConsoleOnError: false,
    });

    const handleExit = () => {
        renderer.destroy();
        process.exit(0);
    };

    const root = createRoot(renderer);
    root.render(<App onExit={handleExit} />);

    logger.info("OpenTUI React TUI initialized successfully");
    logger.debug("Logs panel should be visible at the bottom");
    logger.info("Compass TUI ready. Arrows move, Enter edits/runs, Esc to go back/exit.");

    renderer.start();
}

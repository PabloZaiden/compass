/** @jsxImportSource @opentui/react */
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App";
import { setTuiLoggingEnabled, logger } from "../utils";
import { THEME } from "./types";

export async function render(): Promise<void> {
    setTuiLoggingEnabled(true);

    const renderer = await createCliRenderer({
        useAlternateScreen: true,
        useConsole: false,
        exitOnCtrlC: true,
        backgroundColor: THEME.background,
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
    logger.info("Compass TUI ready. Arrows move, Enter edits/runs, Esc exits edit, Ctrl+F flags, q to quit.");

    renderer.start();
}

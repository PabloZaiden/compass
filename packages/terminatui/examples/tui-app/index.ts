#!/usr/bin/env bun
/**
 * Example TUI Application
 * 
 * Demonstrates how to use TuiApplication to build a CLI/TUI app
 * with minimal effort. Just run:
 * 
 *   bun examples/tui-app/index.ts
 * 
 * Or in CLI mode:
 * 
 *   bun examples/tui-app/index.ts greet --name "World" --loud
 */

import { TuiApplication } from "../../src/index.ts";
import { GreetCommand, MathCommand, StatusCommand } from "./commands/index.ts";

class ExampleApp extends TuiApplication {
    constructor() {
        super({
            name: "example",
            version: "1.0.0",
            commands: [
                new GreetCommand(),
                new MathCommand(),
                new StatusCommand(),
            ],
            enableTui: true,
        });
    }
}

// Run the app
await new ExampleApp().run(Bun.argv.slice(2));

#!/usr/bin/env bun
/**
 * Example TUI Application
 * 
 * Demonstrates how to use TuiApplication to build a CLI/TUI app
 * with minimal effort. Just run:
 * 
 *   bun examples/tui-app.ts
 * 
 * Or in CLI mode:
 * 
 *   bun examples/tui-app.ts greet --name "World" --loud
 */

import { 
    TuiApplication, 
    Command, 
    type AppContext, 
    type OptionSchema, 
    type OptionValues,
    type CommandResult 
} from "../src/index.ts";

// ============================================================================
// Greet Command - Simple command with text input
// ============================================================================

const greetOptions = {
    name: {
        type: "string",
        description: "Name to greet",
        required: true,
        label: "Name",
        order: 1,
        group: "Required",
        placeholder: "Enter name...",
    },
    loud: {
        type: "boolean",
        description: "Use uppercase",
        alias: "l",
        default: false,
        label: "Loud Mode",
        order: 2,
        group: "Options",
    },
    times: {
        type: "number",
        description: "Number of times to greet",
        default: 1,
        label: "Repeat Count",
        order: 3,
        group: "Options",
    },
} as const satisfies OptionSchema;

class GreetCommand extends Command<typeof greetOptions> {
    readonly name = "greet";
    readonly description = "Greet someone with a friendly message";
    readonly options = greetOptions;

    override readonly actionLabel = "Say Hello";

    override readonly examples = [
        { command: "greet --name World", description: "Simple greeting" },
        { command: "greet --name World --loud --times 3", description: "Loud greeting 3 times" },
    ];

    override async executeCli(ctx: AppContext, opts: OptionValues<typeof greetOptions>): Promise<void> {
        const result = this.createGreeting(opts);
        ctx.logger.info(result);
    }

    override async executeTui(_ctx: AppContext, opts: OptionValues<typeof greetOptions>): Promise<CommandResult> {
        const greeting = this.createGreeting(opts);
        return {
            success: true,
            data: { greeting, timestamp: new Date().toISOString() },
            message: greeting,
        };
    }

    override getClipboardContent(result: CommandResult): string | undefined {
        const data = result.data as { greeting?: string } | undefined;
        return data?.greeting;
    }

    private createGreeting(opts: OptionValues<typeof greetOptions>): string {
        const name = opts.name as string;
        const loud = opts.loud as boolean;
        const times = (opts.times as number) || 1;

        let message = `Hello, ${name}!`;
        if (loud) message = message.toUpperCase();

        return Array(times).fill(message).join("\n");
    }
}

// ============================================================================
// Math Command - Command with enum and number options
// ============================================================================

const mathOptions = {
    operation: {
        type: "string",
        description: "Math operation to perform",
        required: true,
        enum: ["add", "subtract", "multiply", "divide"] as const,
        label: "Operation",
        order: 1,
        group: "Required",
    },
    a: {
        type: "number",
        description: "First number",
        required: true,
        label: "First Number",
        order: 2,
        group: "Required",
    },
    b: {
        type: "number",
        description: "Second number",
        required: true,
        label: "Second Number",
        order: 3,
        group: "Required",
    },
    showSteps: {
        type: "boolean",
        description: "Show calculation steps",
        default: false,
        label: "Show Steps",
        order: 4,
        group: "Options",
    },
} as const satisfies OptionSchema;

class MathCommand extends Command<typeof mathOptions> {
    readonly name = "math";
    readonly description = "Perform basic math operations";
    readonly options = mathOptions;

    override readonly actionLabel = "Calculate";

    override async executeCli(ctx: AppContext, opts: OptionValues<typeof mathOptions>): Promise<void> {
        const result = this.calculate(opts);
        if (result.success) {
            const data = result.data as { result: number };
            ctx.logger.info(`Result: ${data.result}`);
        } else {
            ctx.logger.error(result.message || "Calculation failed");
        }
    }

    override async executeTui(_ctx: AppContext, opts: OptionValues<typeof mathOptions>): Promise<CommandResult> {
        return this.calculate(opts);
    }

    override renderResult(result: CommandResult): string {
        if (!result.success) return result.message || "Error";
        const data = result.data as { expression: string; result: number; steps?: string[] };
        let output = `${data.expression} = ${data.result}`;
        if (data.steps) {
            output += "\n\nSteps:\n" + data.steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n");
        }
        return output;
    }

    private calculate(opts: OptionValues<typeof mathOptions>): CommandResult {
        const op = opts.operation as string;
        const a = opts.a as number;
        const b = opts.b as number;
        const showSteps = opts.showSteps as boolean;

        let result: number;
        let expression: string;
        const steps: string[] = [];

        switch (op) {
            case "add":
                result = a + b;
                expression = `${a} + ${b}`;
                if (showSteps) steps.push(`Adding ${a} and ${b}`, `Result: ${result}`);
                break;
            case "subtract":
                result = a - b;
                expression = `${a} - ${b}`;
                if (showSteps) steps.push(`Subtracting ${b} from ${a}`, `Result: ${result}`);
                break;
            case "multiply":
                result = a * b;
                expression = `${a} × ${b}`;
                if (showSteps) steps.push(`Multiplying ${a} by ${b}`, `Result: ${result}`);
                break;
            case "divide":
                if (b === 0) {
                    return { success: false, message: "Cannot divide by zero" };
                }
                result = a / b;
                expression = `${a} ÷ ${b}`;
                if (showSteps) steps.push(`Dividing ${a} by ${b}`, `Result: ${result}`);
                break;
            default:
                return { success: false, message: `Unknown operation: ${op}` };
        }

        return {
            success: true,
            data: { expression, result, steps: showSteps ? steps : undefined },
            message: `${expression} = ${result}`,
        };
    }
}

// ============================================================================
// Status Command - Immediate execution, no required options
// ============================================================================

const statusOptions = {
    detailed: {
        type: "boolean",
        description: "Show detailed status",
        default: false,
        label: "Detailed",
        order: 1,
    },
} as const satisfies OptionSchema;

class StatusCommand extends Command<typeof statusOptions> {
    readonly name = "status";
    readonly description = "Show application status";
    readonly options = statusOptions;

    override readonly actionLabel = "Check Status";
    override readonly immediateExecution = true; // No required fields

    override async executeCli(ctx: AppContext, opts: OptionValues<typeof statusOptions>): Promise<void> {
        const result = await this.getStatus(opts);
        ctx.logger.info(result.message || "Status check complete");
    }

    override async executeTui(_ctx: AppContext, opts: OptionValues<typeof statusOptions>): Promise<CommandResult> {
        return this.getStatus(opts);
    }

    override renderResult(result: CommandResult): string {
        if (!result.success) return "❌ Status check failed";
        const data = result.data as { uptime: string; memory: string; platform: string; version: string };
        return [
            "✓ Application Status",
            "",
            `  Uptime:   ${data.uptime}`,
            `  Memory:   ${data.memory}`,
            `  Platform: ${data.platform}`,
            `  Node:     ${data.version}`,
        ].join("\n");
    }

    private async getStatus(opts: OptionValues<typeof statusOptions>): Promise<CommandResult> {
        const detailed = opts.detailed as boolean;
        
        // Simulate some async work
        await new Promise((resolve) => setTimeout(resolve, 500));

        const memMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const uptimeSec = Math.round(process.uptime());

        const data: Record<string, unknown> = {
            uptime: `${uptimeSec} seconds`,
            memory: `${memMB} MB`,
            platform: process.platform,
            version: Bun.version,
        };

        if (detailed) {
            Object.assign(data, {
                cwd: process.cwd(),
                pid: process.pid,
            });
        }

        return {
            success: true,
            data,
            message: "All systems operational",
        };
    }
}

// ============================================================================
// Application
// ============================================================================

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

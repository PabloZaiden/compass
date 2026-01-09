import { 
    Command, 
    type AppContext, 
    type OptionSchema, 
    type OptionValues,
    type CommandResult 
} from "../../../src/index.ts";

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

export class MathCommand extends Command<typeof mathOptions> {
    readonly name = "math";
    readonly description = "Perform basic math operations";
    readonly options = mathOptions;

    override readonly actionLabel = "Calculate";

    override async execute(ctx: AppContext, opts: OptionValues<typeof mathOptions>): Promise<CommandResult> {
        const result = this.calculate(opts);
        if (!result.success) {
            ctx.logger.error(result.message || "Calculation failed");
        }
        return result;
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

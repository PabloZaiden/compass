import { 
    Command, 
    type AppContext, 
    type OptionSchema, 
    type OptionValues,
    type CommandResult 
} from "../../../src/index.ts";

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

export class GreetCommand extends Command<typeof greetOptions> {
    readonly name = "greet";
    readonly description = "Greet someone with a friendly message";
    readonly options = greetOptions;

    override readonly actionLabel = "Say Hello";

    override readonly examples = [
        { command: "greet --name World", description: "Simple greeting" },
        { command: "greet --name World --loud --times 3", description: "Loud greeting 3 times" },
    ];

    override async execute(ctx: AppContext, opts: OptionValues<typeof greetOptions>): Promise<CommandResult> {
        const greeting = this.createGreeting(opts);
        ctx.logger.info(greeting);
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

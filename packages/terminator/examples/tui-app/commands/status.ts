import { 
    Command, 
    type AppContext, 
    type OptionSchema, 
    type OptionValues,
    type CommandResult 
} from "../../../src/index.ts";

const statusOptions = {
    detailed: {
        type: "boolean",
        description: "Show detailed status",
        default: false,
        label: "Detailed",
        order: 1,
    },
} as const satisfies OptionSchema;

export class StatusCommand extends Command<typeof statusOptions> {
    readonly name = "status";
    readonly description = "Show application status";
    readonly options = statusOptions;

    override readonly actionLabel = "Check Status";
    override readonly immediateExecution = true; // No required fields

    override async execute(ctx: AppContext, opts: OptionValues<typeof statusOptions>): Promise<CommandResult> {
        const result = await this.getStatus(opts);
        ctx.logger.info(result.message || "Status check complete");
        return result;
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

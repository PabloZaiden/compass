import type { ParsedCliOptions } from "../cli/parser";

export async function launchOpenTui(_options?: ParsedCliOptions): Promise<void> {
    // Options are passed for future use but not currently utilized by the TUI
    const { render } = await import("./index");
    await render();
}

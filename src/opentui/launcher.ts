export async function launchOpenTui(): Promise<void> {
    const { render } = await import("./index");
    await render();
}

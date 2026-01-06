export async function launchInteractiveTui(): Promise<void> {
    const { render } = await import("./index");
    await render();
}

// Global flag for binary mode detection
export let isCompiledBinary = false;

export async function launchOpenTui(isBinary = false): Promise<void> {
    isCompiledBinary = isBinary;
    const { render } = await import("./index");
    await render();
}

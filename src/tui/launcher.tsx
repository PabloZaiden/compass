import { render } from "ink";
import { App } from "./index";

export async function launchTuiInk(): Promise<void> {
    return new Promise((resolve) => {
        const { unmount } = render(
            <App
                onExit={() => {
                    unmount();
                    resolve();
                }}
            />
        );
    });
}

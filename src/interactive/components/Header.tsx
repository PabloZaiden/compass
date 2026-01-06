import { getVersion } from "../../version";
import { Theme } from "../utils";

export function Header() {
    return (
        <box flexShrink={0}>
            <text fg={Theme.header}>
                <strong>🧭 Compass v{getVersion()}</strong>
            </text>
        </box>
    );
}

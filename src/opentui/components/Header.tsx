import { Theme } from "../types";

export function Header() {
    return (
        <text fg={Theme.header}>
            <strong>🧭 Compass</strong>
        </text>
    );
}

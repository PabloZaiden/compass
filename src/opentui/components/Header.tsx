import { THEME } from "../types";

export function Header() {
    return (
        <text fg={THEME.header}>
            <strong>🧭 Compass</strong>
        </text>
    );
}

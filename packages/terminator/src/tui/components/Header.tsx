import { Theme } from "../theme.ts";

interface HeaderProps {
    /** Application name */
    name: string;
    /** Application version */
    version: string;
    /** Optional breadcrumb path (e.g., ["run", "config"]) */
    breadcrumb?: string[];
}

/**
 * Application header with name, version, and optional breadcrumb.
 */
export function Header({ name, version, breadcrumb }: HeaderProps) {
    const breadcrumbStr = breadcrumb?.length 
        ? ` › ${breadcrumb.join(" › ")}`
        : "";

    return (
        <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
            <text fg={Theme.header}>
                <strong>{name}</strong>
                {breadcrumbStr}
            </text>
            <text fg={Theme.label}>
                v{version}
            </text>
        </box>
    );
}

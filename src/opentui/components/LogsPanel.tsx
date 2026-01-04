import { stripANSI } from "bun";
import type { LogEntry } from "../utils";
import { Theme } from "../utils";
import { LogLevel } from "../../logging";

// Colors matching the imperative TUI
const LogColors: Record<LogLevel, string> = {
    [LogLevel.Silly]: "#8c8c8c",
    [LogLevel.Trace]: "#6dd6ff",
    [LogLevel.Debug]: "#7bdcb5",
    [LogLevel.Info]: "#d6dde6",
    [LogLevel.Warn]: "#f5c542",
    [LogLevel.Error]: "#f78888",
    [LogLevel.Fatal]: "#ff5c8d",
};

interface LogsPanelProps {
    logs: LogEntry[];
    visible: boolean;
    focused: boolean;
    expanded?: boolean;
}

export function LogsPanel({
    logs,
    visible,
    focused,
    expanded = false,
}: LogsPanelProps) {
    if (!visible) {
        return null;
    }

    const borderColor = focused ? Theme.borderFocused : Theme.border;
    
    const title = `Logs - ${logs.length}`;

    // When expanded, grow to fill. Otherwise fixed height.
    const boxProps = expanded
        ? { flexGrow: 1 }
        : { height: 10, flexShrink: 0 };

    return (
        <box
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title={title}
            padding={1}
            {...boxProps}
        >
            <scrollbox
                scrollY={true}
                flexGrow={1}
                stickyScroll={true}
                stickyStart="bottom"
                focused={focused}
            >
                <box flexDirection="column" gap={0}>
                    {logs.map((log, idx) => {
                        const color = LogColors[log.level] ?? Theme.statusText;
                        const sanitized = stripANSI(log.message).replaceAll("\n", " ").trim();
                        
                        return (
                            <text key={`${log.timestamp.getTime()}-${idx}`} fg={color}>
                                {sanitized}
                            </text>
                        );
                    })}
                    
                    {logs.length === 0 && (
                        <text fg={Theme.label}>No logs yet...</text>
                    )}
                </box>
            </scrollbox>
        </box>
    );
}

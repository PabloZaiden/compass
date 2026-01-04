import { stripANSI } from "bun";
import type { LogEntry } from "../types";
import { THEME, LOG_COLORS } from "../types";

interface LogsPanelProps {
    logs: LogEntry[];
    visible: boolean;
    focused: boolean;
    height?: number;
}


export function LogsPanel({
    logs,
    visible,
    focused,
    height = 10,
}: LogsPanelProps) {
    if (!visible) {
        return null;
    }

    const borderColor = focused ? THEME.borderFocused : THEME.border;
    
    const title = `Logs - ${logs.length}`;

    return (
        <box
            flexDirection="column"
            border={true}
            borderStyle="rounded"
            borderColor={borderColor}
            title={title}
            height={height}
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
                        const color = LOG_COLORS[log.level] ?? THEME.statusText;
                        const sanitized = stripANSI(log.message).replaceAll("\n", " ").trim();
                        
                        return (
                            <text key={`${log.timestamp.getTime()}-${idx}`} fg={color}>
                                {sanitized}
                            </text>
                        );
                    })}
                    
                    {logs.length === 0 && (
                        <text fg={THEME.label}>No logs yet...</text>
                    )}
                </box>
            </scrollbox>
        </box>
    );
}

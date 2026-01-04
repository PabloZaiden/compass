import React from "react";
import { Box, Text, useStdout } from "ink";
import type { LogLevel } from "../utils";
import { LogLevel as LogLevelEnum } from "../utils";

export interface LogMessage {
    timestamp: Date;
    level: LogLevel;
    message: string;
}

interface LogsPanelProps {
    visible: boolean;
    messages: LogMessage[];
    maxLines?: number;
    height?: number;
    scrollOffset?: number;
    isFocused?: boolean;
}

const logColors: Record<LogLevel, string> = {
    [LogLevelEnum.Silly]: "#8c8c8c",
    [LogLevelEnum.Trace]: "#6dd6ff",
    [LogLevelEnum.Debug]: "#7bdcb5",
    [LogLevelEnum.Info]: "#d6dde6",
    [LogLevelEnum.Warn]: "#f5c542",
    [LogLevelEnum.Error]: "#f78888",
    [LogLevelEnum.Fatal]: "#ff5c8d",
};

export const LogsPanel: React.FC<LogsPanelProps> = ({ visible, messages, height = 10, scrollOffset = 0, isFocused = false }) => {
    const { stdout } = useStdout();
    const terminalWidth = stdout?.columns || 80;
    // Account for border (2) and padding (2)
    const maxLineWidth = terminalWidth - 4;
    
    if (!visible) {
        return null;
    }

    // Calculate visual lines for each message (accounting for wrapping)
    const messagesWithHeight = messages.map(log => {
        const sanitized = sanitizeLogMessage(log.message.replace(/\n/g, " "));
        const visualLines = Math.ceil(sanitized.length / maxLineWidth) || 1;
        return { log, sanitized, visualLines };
    });
    
    // Calculate total visual lines
    const totalVisualLines = messagesWithHeight.reduce((sum, m) => sum + m.visualLines, 0);
    
    // Find which messages to display based on scroll offset (in visual lines)
    const contentHeight = height - 2; // -2 for header
    let visualLineCount = 0;
    let startIdx = 0;
    
    // Skip messages until we reach the scroll offset
    for (let i = messagesWithHeight.length - 1; i >= 0; i--) {
        const msg = messagesWithHeight[i];
        if (!msg) continue;
        if (visualLineCount >= scrollOffset) {
            startIdx = i;
            break;
        }
        visualLineCount += msg.visualLines;
    }
    
    // Collect messages until we fill the content height
    const displayMessages: typeof messagesWithHeight = [];
    visualLineCount = 0;
    for (let i = startIdx; i < messagesWithHeight.length && visualLineCount < contentHeight; i++) {
        const msg = messagesWithHeight[i];
        if (!msg) continue;
        displayMessages.push(msg);
        visualLineCount += msg.visualLines;
    }
    
    const canScrollUp = scrollOffset < totalVisualLines - contentHeight && totalVisualLines > contentHeight;
    const canScrollDown = scrollOffset > 0;

    return (
        <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={isFocused ? "yellow" : "gray"} paddingX={1} height={height}>
            <Text bold color="yellow">
                Logs {isFocused && "(↑↓ to scroll, "}y copy, x clear{isFocused && ")"}
                {canScrollUp && " ▲"}
                {canScrollDown && " ▼"} - {displayMessages.length}/{messages.length}
            </Text>
            <Box flexDirection="column" overflowY="hidden">
                {displayMessages.map(({ log, sanitized }) => {
                    const levelColor = logColors[log.level];
                    return (
                        <Text key={`${log.timestamp.getTime()}-${log.message}`} color={levelColor}>
                            {sanitized}
                        </Text>
                    );
                })}
            </Box>
        </Box>
    );
};

type Token = { key: string; value: string };

export function sanitizeLogMessage(input: string): string {
  let s = input;

  // Normalize newlines and remove carriage return (cursor return)
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "");

  // Remove backspace, vertical tab, form feed
  s = s.replace(/\u0008/g, "").replace(/[\u000B\u000C]/g, "");

  // Tabs to spaces (fixed width)
  s = s.replace(/\t/g, "    ");

  // 1) Preserve SGR sequences (colors/styles): ESC [ ... m
  const preserved: Token[] = [];
  s = s.replace(/\x1B\[[0-?]*[ -/]*m/g, (seq) => {
    const key = `__SGR_${preserved.length}__`;
    preserved.push({ key, value: seq });
    return key;
  });

  // 2) Remove OSC sequences (hyperlinks, titles, etc)
  // OSC: ESC ] ... BEL or ESC ] ... ESC \
  s = s.replace(/\x1B\][^\x07]*(\x07|\x1B\\)/g, "");

  // 3) Remove remaining CSI sequences (cursor moves, clears, etc)
  // This catches ESC [ ... <final>, but SGR already placeholdered
  s = s.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");

  // 4) Remove any remaining ESC sequences like ESC followed by a single char
  // (rare, but safe for TUI rendering)
  s = s.replace(/\x1B[@-Z\\-_]/g, "");

  // 5) Remove other C0 control chars (keep LF)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1A\x1C-\x1F\x7F]/g, "");

  // Also remove stray ESC if any survived
  s = s.replace(/\x1B/g, "");

  // Restore preserved SGR sequences
  for (const t of preserved) {
    s = s.replaceAll(t.key, t.value);
  }

  return s;
}

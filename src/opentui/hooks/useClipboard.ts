import { useCallback, useState } from "react";
import * as fs from "fs";

/**
 * Strip ANSI escape sequences from text
 */
function stripAnsiCodes(text: string): string {
    return text
        .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
        .replace(/\x1b\][^\x07]*\x07/g, '');
}

/**
 * Copy text to clipboard using OSC 52 escape sequence.
 * Write directly to /dev/tty to bypass any stdout interception.
 */
function copyWithOsc52(text: string): boolean {
    try {
        const cleanText = stripAnsiCodes(text);
        const base64 = Buffer.from(cleanText).toString("base64");
        // OSC 52 sequence: ESC ] 52 ; c ; <base64> BEL
        const osc52 = `\x1b]52;c;${base64}\x07`;
        
        // Try to write directly to the TTY to bypass OpenTUI's stdout capture
        try {
            const fd = fs.openSync('/dev/tty', 'w');
            fs.writeSync(fd, osc52);
            fs.closeSync(fd);
        } catch {
            // Fallback to stdout if /dev/tty is not available
            process.stdout.write(osc52);
        }
        
        return true;
    } catch {
        return false;
    }
}

export interface UseClipboardResult {
    copy: (text: string) => boolean;
    lastAction: string;
    setLastAction: (action: string) => void;
}

export function useClipboard(): UseClipboardResult {
    const [lastAction, setLastAction] = useState("");
    
    const copy = useCallback((text: string): boolean => {
        return copyWithOsc52(text);
    }, []);

    return { copy, lastAction, setLastAction };
}

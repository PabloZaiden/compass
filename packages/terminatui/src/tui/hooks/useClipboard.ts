import { useCallback, useState } from "react";
import * as fs from "fs";

/**
 * Copy text to clipboard using OSC 52 escape sequence.
 * Write directly to /dev/tty to bypass any stdout interception.
 */
function copyWithOsc52(text: string): boolean {
    try {
        // Strip ANSI codes if Bun is available, otherwise use as-is
        const cleanText = typeof Bun !== "undefined" 
            ? Bun.stripANSI(text) 
            : text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
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
    /** Copy text to clipboard */
    copy: (text: string) => boolean;
    /** Last action message for status display */
    lastAction: string;
    /** Set the last action message */
    setLastAction: (action: string) => void;
    /** Copy and set a success message */
    copyWithMessage: (text: string, label: string) => void;
}

/**
 * Hook for clipboard operations using OSC 52.
 * Works in most modern terminal emulators.
 */
export function useClipboard(): UseClipboardResult {
    const [lastAction, setLastAction] = useState("");
    
    const copy = useCallback((text: string): boolean => {
        return copyWithOsc52(text);
    }, []);

    const copyWithMessage = useCallback((text: string, label: string) => {
        const success = copyWithOsc52(text);
        if (success) {
            setLastAction(`✓ ${label} copied to clipboard`);
            // Clear message after 2 seconds
            setTimeout(() => setLastAction(""), 2000);
        }
    }, []);

    return { copy, lastAction, setLastAction, copyWithMessage };
}

import { useState, useEffect, useMemo } from "react";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL = 80;

export interface UseSpinnerResult {
    /** Current frame index */
    frameIndex: number;
    /** Current spinner character */
    frame: string;
}

/**
 * Hook for animated spinner.
 * 
 * @param active - Whether the spinner is active
 * @returns Spinner state with current frame
 */
export function useSpinner(active: boolean): UseSpinnerResult {
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
        if (!active) {
            setFrameIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setFrameIndex((prev) => {
                // Reset to avoid overflow
                if (prev >= Number.MAX_SAFE_INTEGER / 2) {
                    return 0;
                }
                return prev + 1;
            });
        }, SPINNER_INTERVAL);

        return () => clearInterval(interval);
    }, [active]);

    const frame = useMemo(() => {
        return SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]!;
    }, [frameIndex]);

    return { frameIndex, frame };
}

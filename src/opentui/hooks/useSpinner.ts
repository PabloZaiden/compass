import { useState, useEffect } from "react";

export interface UseSpinnerResult {
    frame: string;
    frameIndex: number;
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL = 80;

export function useSpinner(active: boolean): UseSpinnerResult {
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
        if (!active) {
            setFrameIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
        }, SPINNER_INTERVAL);

        return () => clearInterval(interval);
    }, [active]);

    return {
        frame: SPINNER_FRAMES[frameIndex] ?? "⠋",
        frameIndex,
    };
}

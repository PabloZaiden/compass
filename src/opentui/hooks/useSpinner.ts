import { useState, useEffect } from "react";

export interface UseSpinnerResult {
    frameIndex: number;
}

const SPINNER_INTERVAL = 80;

export function useSpinner(active: boolean): UseSpinnerResult {
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
        if (!active) {
            setFrameIndex(0);
            return;
        }

        const interval = setInterval(() => {
            // to avoid overflow
            // reset to 0 after reaching a high number
            if (frameIndex >= Number.MAX_SAFE_INTEGER) {
                setFrameIndex(0);
                return;
            }
            
            setFrameIndex((prev) => (prev + 1));
        }, SPINNER_INTERVAL);

        return () => clearInterval(interval);
    }, [active]);

    return { frameIndex };
}

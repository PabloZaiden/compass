import {
    createContext,
    useContext,
    useCallback,
    useRef,
    type ReactNode,
} from "react";
import { useKeyboard } from "@opentui/react";
import type { KeyEvent } from "@opentui/core";

/**
 * Priority levels for keyboard event handlers.
 * Higher priority handlers are called first.
 */
export enum KeyboardPriority {
    /** Modal/overlay handlers - highest priority, intercept first */
    Modal = 100,
    /** Focused section handlers - handle section-specific keys */
    Focused = 50,
    /** Global handlers - app-wide shortcuts, lowest priority */
    Global = 0,
}

/**
 * Extended keyboard event with custom stop propagation.
 * Use `stopPropagation()` to prevent lower-priority handlers from receiving the event.
 * Use `key.preventDefault()` only when you want to also block OpenTUI primitives.
 */
export interface KeyboardEvent {
    /** The underlying OpenTUI KeyEvent */
    key: KeyEvent;
    /** Stop propagation to lower-priority handlers in our system */
    stopPropagation: () => void;
    /** Whether propagation was stopped */
    stopped: boolean;
}

export type KeyboardHandler = (event: KeyboardEvent) => void;

interface RegisteredHandler {
    id: string;
    handler: KeyboardHandler;
    priority: KeyboardPriority;
}

interface KeyboardContextValue {
    register: (id: string, handler: KeyboardHandler, priority: KeyboardPriority) => void;
    unregister: (id: string) => void;
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

interface KeyboardProviderProps {
    children: ReactNode;
}

/**
 * Provider that coordinates all keyboard handlers via a single useKeyboard call.
 * Handlers are invoked in descending priority order (highest first).
 * Propagation stops when a handler calls `stopPropagation()`.
 */
export function KeyboardProvider({ children }: KeyboardProviderProps) {
    const handlersRef = useRef<RegisteredHandler[]>([]);

    const register = useCallback(
        (id: string, handler: KeyboardHandler, priority: KeyboardPriority) => {
            // Remove existing handler with same id (if any)
            handlersRef.current = handlersRef.current.filter((h) => h.id !== id);
            // Add new handler
            handlersRef.current.push({ id, handler, priority });
            // Sort by priority descending (highest first)
            handlersRef.current.sort((a, b) => b.priority - a.priority);
        },
        []
    );

    const unregister = useCallback((id: string) => {
        handlersRef.current = handlersRef.current.filter((h) => h.id !== id);
    }, []);

    // Single useKeyboard call that dispatches to all registered handlers
    useKeyboard((key: KeyEvent) => {
        // Create our wrapper event with custom stop propagation
        const event: KeyboardEvent = {
            key,
            stopped: false,
            stopPropagation() {
                this.stopped = true;
            },
        };

        for (const { handler } of handlersRef.current) {
            // Stop if our propagation was stopped or if preventDefault was called
            if (event.stopped || key.defaultPrevented) {
                break;
            }
            handler(event);
        }
    });

    return (
        <KeyboardContext.Provider value={{ register, unregister }}>
            {children}
        </KeyboardContext.Provider>
    );
}

/**
 * Access the keyboard context for handler registration.
 * @throws Error if used outside of KeyboardProvider
 */
export function useKeyboardContext(): KeyboardContextValue {
    const context = useContext(KeyboardContext);
    if (!context) {
        throw new Error("useKeyboardContext must be used within a KeyboardProvider");
    }
    return context;
}

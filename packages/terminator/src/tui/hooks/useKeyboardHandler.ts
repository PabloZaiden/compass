import { useEffect, useId, useRef } from "react";
import {
    useKeyboardContext,
    KeyboardPriority,
    type KeyboardHandler,
    type KeyboardEvent,
} from "../context/KeyboardContext.tsx";

interface UseKeyboardHandlerOptions {
    /**
     * Whether the handler is currently enabled.
     * When false, the handler is unregistered.
     * Useful for conditionally handling keys only when focused.
     * @default true
     */
    enabled?: boolean;

    /**
     * When true, automatically calls stopPropagation() after the handler runs,
     * blocking keys from reaching lower-priority handlers.
     * Does NOT block OpenTUI primitives (input/select) from receiving keys.
     * Use this for modal dialogs that should capture keyboard focus.
     * @default false
     */
    modal?: boolean;
}

/**
 * Register a keyboard handler with the KeyboardProvider.
 *
 * @param handler - Callback invoked on keyboard events.
 *   - Call `event.stopPropagation()` to stop our handlers from receiving the event.
 *   - Call `event.key.preventDefault()` to also block OpenTUI primitives.
 * @param priority - Handler priority level. Higher priorities are called first.
 * @param options - Optional configuration (e.g., enabled flag, modal behavior).
 *
 * @example
 * ```tsx
 * // Modal handler - blocks lower-priority handlers but lets OpenTUI primitives work
 * useKeyboardHandler(
 *     (event) => {
 *         if (event.key.name === "escape") {
 *             onClose();
 *         }
 *         // Other keys pass through to <input>/<select> but not to ConfigForm
 *     },
 *     KeyboardPriority.Modal,
 *     { enabled: isVisible, modal: true }
 * );
 * ```
 */
export function useKeyboardHandler(
    handler: KeyboardHandler,
    priority: KeyboardPriority,
    options: UseKeyboardHandlerOptions = {}
): void {
    const { enabled = true, modal = false } = options;
    const { register, unregister } = useKeyboardContext();
    const id = useId();
    
    // Keep handler ref stable to avoid re-registrations on every render
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    // Keep modal ref stable
    const modalRef = useRef(modal);
    modalRef.current = modal;

    useEffect(() => {
        if (!enabled) {
            unregister(id);
            return;
        }

        // Register with a stable wrapper that calls the current handler
        register(id, (event: KeyboardEvent) => {
            handlerRef.current(event);
            // For modals, always stop propagation to our handlers (but not OpenTUI primitives)
            if (modalRef.current) {
                event.stopPropagation();
            }
        }, priority);

        return () => {
            unregister(id);
        };
    }, [id, priority, enabled, register, unregister]);
}

export { KeyboardPriority };
export type { KeyboardEvent };

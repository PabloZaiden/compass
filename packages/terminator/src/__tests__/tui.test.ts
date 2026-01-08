import { describe, test, expect } from "bun:test";
import {
    KeyboardPriority,
} from "../tui/index.ts";

describe("TUI", () => {
    describe("KeyboardPriority", () => {
        test("Modal has highest priority", () => {
            expect(KeyboardPriority.Modal).toBe(100);
        });

        test("Focused has medium priority", () => {
            expect(KeyboardPriority.Focused).toBe(50);
        });

        test("Global has lowest priority", () => {
            expect(KeyboardPriority.Global).toBe(0);
        });

        test("priorities are correctly ordered", () => {
            expect(KeyboardPriority.Modal).toBeGreaterThan(KeyboardPriority.Focused);
            expect(KeyboardPriority.Focused).toBeGreaterThan(KeyboardPriority.Global);
        });
    });
});


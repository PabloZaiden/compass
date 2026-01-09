import { useState, useCallback, useRef } from "react";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { OptionSchema, OptionValues } from "../../types/command.ts";

export interface UseConfigStateOptions<T extends OptionSchema> {
    /** Path to persist config (e.g., ~/.myapp/config.json) */
    persistPath?: string;
    /** Whether to auto-save on changes */
    autoSave?: boolean;
    /** Callback when a value changes */
    onChange?: (key: keyof OptionValues<T>, value: unknown, values: OptionValues<T>) => void;
}

export interface UseConfigStateResult<T extends OptionSchema> {
    /** Current config values */
    values: OptionValues<T>;
    /** Update a single value */
    updateValue: <K extends keyof OptionValues<T>>(key: K, value: OptionValues<T>[K]) => void;
    /** Reset all values to defaults */
    resetToDefaults: () => void;
    /** Save current values to disk (if persistPath is set) */
    save: () => void;
    /** Whether the config has been modified from defaults */
    isDirty: boolean;
}

/**
 * Extract default values from an option schema.
 */
function getDefaultsFromSchema<T extends OptionSchema>(schema: T): OptionValues<T> {
    const defaults: Record<string, unknown> = {};
    
    for (const [key, def] of Object.entries(schema)) {
        if (def.default !== undefined) {
            defaults[key] = def.default;
        } else {
            // Provide type-appropriate defaults
            switch (def.type) {
                case "string":
                    defaults[key] = def.enum?.[0] ?? "";
                    break;
                case "number":
                    defaults[key] = def.min ?? 0;
                    break;
                case "boolean":
                    defaults[key] = false;
                    break;
                case "array":
                    defaults[key] = [];
                    break;
            }
        }
    }
    
    return defaults as OptionValues<T>;
}

/**
 * Load config from disk.
 */
function loadFromDisk<T extends OptionSchema>(
    path: string,
    schema: T
): OptionValues<T> | null {
    try {
        if (existsSync(path)) {
            const content = readFileSync(path, "utf-8");
            const saved = JSON.parse(content) as Partial<OptionValues<T>>;
            const defaults = getDefaultsFromSchema(schema);
            return { ...defaults, ...saved };
        }
    } catch {
        // Ignore errors, return null to use defaults
    }
    return null;
}

/**
 * Save config to disk.
 */
function saveToDisk<T extends OptionSchema>(
    path: string,
    values: OptionValues<T>
): boolean {
    try {
        const dir = dirname(path);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(path, JSON.stringify(values, null, 2), "utf-8");
        return true;
    } catch {
        return false;
    }
}

/**
 * Hook for managing config state with optional persistence.
 * 
 * @param schema - Option schema defining the config structure
 * @param options - Configuration options
 * @returns Config state and update functions
 * 
 * @example
 * ```tsx
 * const { values, updateValue } = useConfigState(myOptions, {
 *     persistPath: join(homedir(), ".myapp/config.json"),
 *     autoSave: true,
 * });
 * ```
 */
export function useConfigState<T extends OptionSchema>(
    schema: T,
    options: UseConfigStateOptions<T> = {}
): UseConfigStateResult<T> {
    const { persistPath, autoSave = true, onChange } = options;
    const schemaRef = useRef(schema);
    
    // Initialize state
    const [values, setValues] = useState<OptionValues<T>>(() => {
        if (persistPath) {
            const loaded = loadFromDisk(persistPath, schema);
            if (loaded) return loaded;
        }
        return getDefaultsFromSchema(schema);
    });
    
    const [isDirty, setIsDirty] = useState(false);

    // Update a single value
    const updateValue = useCallback(<K extends keyof OptionValues<T>>(
        key: K,
        value: OptionValues<T>[K]
    ) => {
        setValues((prev) => {
            const updated = { ...prev, [key]: value };
            
            // Call onChange callback
            onChange?.(key, value, updated);
            
            // Auto-save if enabled
            if (autoSave && persistPath) {
                saveToDisk(persistPath, updated);
            }
            
            return updated;
        });
        setIsDirty(true);
    }, [autoSave, persistPath, onChange]);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        const defaults = getDefaultsFromSchema(schemaRef.current);
        setValues(defaults);
        setIsDirty(false);
        
        if (autoSave && persistPath) {
            saveToDisk(persistPath, defaults);
        }
    }, [autoSave, persistPath]);

    // Manual save
    const save = useCallback(() => {
        if (persistPath) {
            saveToDisk(persistPath, values);
        }
    }, [persistPath, values]);

    return { values, updateValue, resetToDefaults, save, isDirty };
}

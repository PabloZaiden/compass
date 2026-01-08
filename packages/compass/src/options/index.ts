// Option schema system
export {
    ArgumentError,
    type OptionDef,
    type StringOptionDef,
    type BooleanOptionDef,
    type OptionSchema,
    type ParsedOptions,
    type OptionDescription,
    toParseArgsOptions,
    toOptionDescriptions,
    getStringOption,
    getRequiredStringOption,
    getBooleanOption,
    parseEnumOption,
} from "./schema";

// Run options
export { runOptionsSchema, type RunOptions } from "./run";

// Check options
export { checkOptionsSchema, type CheckOptions } from "./check";

// Generate options
export { generateOptionsSchema, type GenerateOptions } from "./generate";

// Note: Logging options (--log-level, --detailed-logs) are handled
// automatically by the terminator framework at the application level.

// Mode system exports
export {
    type ExecutionMode,
    type OptionsSchema,
    type OptionDescription,
    modeRegistry,
    registerMode,
    getRegisteredModes,
    getMode,
    resolveMode,
} from "./mode";

// Import all modes to trigger self-registration
// Each mode calls registerMode() when imported
import "../run/mode";
import "../check/mode";
import "../interactive/mode";
import "../version/mode";

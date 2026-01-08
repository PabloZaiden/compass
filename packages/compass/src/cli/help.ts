import {
    modeRegistry,
    getMode,
    type ExecutionMode,
} from "../modes";
import { getVersion } from "../version";

/**
 * Formats the usage line for a mode.
 */
function formatUsage(commandPath: string[], mode: ExecutionMode | null): string {
    const parts = ["compass", ...commandPath];

    if (mode?.submodes && Object.keys(mode.submodes).length > 0) {
        parts.push("[command]");
    }

    if (mode?.options && Object.keys(mode.options).length > 0) {
        parts.push("[options]");
    }

    return parts.join(" ");
}

/**
 * Formats the commands section showing available submodes.
 */
function formatCommands(mode: ExecutionMode | null, isRoot: boolean): string {
    const submodes = isRoot ? modeRegistry : mode?.submodes;
    
    if (!submodes || Object.keys(submodes).length === 0) {
        return "";
    }

    const lines: string[] = ["COMMANDS:"];

    // Find the longest mode name for padding (including implicit help)
    const modeNames = Object.keys(submodes).filter((name) => name !== "help");
    const allNames = [...modeNames, "help"];
    const maxLength = Math.max(...allNames.map((name) => name.length));

    for (const [name, subMode] of Object.entries(submodes)) {
        if (name === "help") continue; // Skip explicit help, we'll add implicit one
        const padding = " ".repeat(maxLength - name.length + 4);
        lines.push(`    ${name}${padding}${subMode.description}`);
    }

    // Add implicit help subcommand
    const helpPadding = " ".repeat(maxLength - 4 + 4);
    lines.push(`    help${helpPadding}Show help for this command`);

    return lines.join("\n");
}

/**
 * Formats the options section for a mode.
 */
function formatOptions(mode: ExecutionMode): string {
    if (!mode.options || Object.keys(mode.options).length === 0) {
        return "";
    }

    const lines: string[] = ["OPTIONS:"];
    const descriptions = mode.optionDescriptions || {};

    for (const [name, schema] of Object.entries(mode.options)) {
        const desc = descriptions[name];
        const type = (schema as { type: string }).type;

        // Format the flag name
        let flagFormat: string;
        if (type === "boolean") {
            flagFormat = `--${name} / --no-${name}`;
        } else {
            const placeholder = desc?.placeholder || "value";
            flagFormat = `--${name} <${placeholder}>`;
        }

        // Build the description lines
        const descLines: string[] = [];

        if (desc) {
            descLines.push(desc.description);

            // Add valid values if present
            if (desc.validValues) {
                const validValuesStr =
                    typeof desc.validValues === "function" ? desc.validValues() : desc.validValues;
                descLines.push(`Valid: ${validValuesStr}`);
            }

            // Add default if present
            if (desc.default) {
                descLines.push(`Default: ${desc.default}`);
            }
        }

        // Format the option block
        lines.push(`    ${flagFormat}`);
        for (const line of descLines) {
            lines.push(`        ${line}`);
        }
        lines.push(""); // Empty line between options
    }

    return lines.join("\n").trimEnd();
}

/**
 * Formats the examples section.
 */
function formatExamples(mode: ExecutionMode): string {
    if (!mode.examples || mode.examples.length === 0) {
        return "";
    }

    const lines: string[] = ["EXAMPLES:"];
    for (const example of mode.examples) {
        lines.push(`    ${example}`);
    }

    return lines.join("\n");
}

/**
 * Generates and prints help for a given command path.
 * @param commandPath - The command path (e.g., ["run"] or ["check"])
 */
export function printHelp(commandPath: string[] = []): void {
    // Strip trailing "help" if present
    const pathWithoutHelp = 
        commandPath.length > 0 && commandPath[commandPath.length - 1] === "help"
            ? commandPath.slice(0, -1)
            : commandPath;
    
    const isRoot = pathWithoutHelp.length === 0;
    const mode = isRoot ? null : resolveModePath(pathWithoutHelp);
    
    const sections: string[] = [];

    // Title
    sections.push(`Compass v${getVersion()}\n`);
    
    // Description
    if (mode) {
        sections.push(mode.description + "\n");
    }

    // Usage
    sections.push(`USAGE:\n    ${formatUsage(pathWithoutHelp, mode)}\n`);

    // Commands
    const commandsSection = formatCommands(mode, isRoot);
    if (commandsSection) {
        sections.push(commandsSection + "\n");
    }

    // Options
    if (mode) {
        const optionsSection = formatOptions(mode);
        if (optionsSection) {
            sections.push(optionsSection + "\n");
        }

        // Examples
        const examplesSection = formatExamples(mode);
        if (examplesSection) {
            sections.push(examplesSection + "\n");
        }
    } else {
        // Root examples
        const rootExamples = [
            "EXAMPLES:",
            "    compass                                    # Launch interactive TUI",
            "    compass run --repo ./my-repo --fixture ./prompts.json --agent opencode",
            "    compass check                              # Check all agent dependencies",
            "    compass help                               # Show this help",
        ];
        sections.push(rootExamples.join("\n") + "\n");
    }

    console.log(sections.join("\n"));
}

/**
 * Resolves a command path to a mode, traversing submodes.
 */
function resolveModePath(commandPath: string[]): ExecutionMode | null {
    if (commandPath.length === 0) {
        return null;
    }

    const rootMode = getMode(commandPath[0]!);
    if (!rootMode) {
        return null;
    }

    let currentMode = rootMode;
    for (let i = 1; i < commandPath.length; i++) {
        const submodeName = commandPath[i]!;
        if (!currentMode.submodes || !currentMode.submodes[submodeName]) {
            return null;
        }
        currentMode = currentMode.submodes[submodeName]!;
    }

    return currentMode;
}

/**
 * Prints help for a specific command path (convenience wrapper).
 */
export function printCommandHelp(commandPath: string[]): void {
    printHelp(commandPath);
}

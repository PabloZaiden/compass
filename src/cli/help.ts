import { AgentTypes } from "../agents/factory";
import { OutputMode, values } from "../models";
import { LogLevel } from "../logging";

export function printHelp(): void {
    const agentTypes = values(AgentTypes).join(", ");
    const outputModes = values(OutputMode).join(", ");
    const logLevels = values(LogLevel).join(", ");

    const helpText = `
Compass

USAGE:
    compass [command] [options]

COMMANDS:
    interactive     Launch the interactive TUI (default if no command specified)
    run             Run the evaluation with the specified configuration
    help            Show this help message

OPTIONS (for 'run' command):
    --repo <path>           Path to the repository to evaluate (required)
                            Env: COMPASS_REPO

    --fixture <path>        Path to the fixture JSON file (required)
                            Env: COMPASS_FIXTURE

    --agent <type>          Agent type to use (required)
                            Valid types: ${agentTypes}
                            Env: COMPASS_AGENT

    --iterations <n>        Number of iterations per prompt (default: 1)
                            Env: COMPASS_ITERATIONS

    --output-mode <mode>    Output format (default: Aggregated)
                            Valid modes: ${outputModes}
                            Env: COMPASS_OUTPUT_MODE

    --log-level <level>     Logging verbosity (default: Info)
                            Valid levels: ${logLevels}
                            Env: COMPASS_LOG_LEVEL

    --use-cache             Enable caching of agent responses
                            Env: COMPASS_USE_CACHE

    --stop-on-error         Stop execution on first error (default: true)
                            Env: COMPASS_STOP_ON_ERROR

    --allow-full-access     Allow full repository access (default: true)
                            Env: COMPASS_ALLOW_FULL_ACCESS

    --model <name>          Model to use for the agent
                            Env: COMPASS_MODEL

    --eval-model <name>     Model to use for evaluation
                            Env: COMPASS_EVAL_MODEL

EXAMPLES:
    compass                                    # Launch interactive TUI
    compass interactive                        # Same as above
    compass run --repo ./my-repo --fixture ./prompts.json --agent Copilot
    compass help                               # Show this help

ENVIRONMENT VARIABLES:
    All options can be set via environment variables with the COMPASS_ prefix.
    CLI arguments take precedence over environment variables.
`;

    console.log(helpText);
}

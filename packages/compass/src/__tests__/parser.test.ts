import { describe, test, expect } from "bun:test";
import { parseCliArgs, extractCommandChain, resolveCommandPath } from "../cli/parser";
import {
    ArgumentError,
    getRequiredStringOption,
    parseEnumOption,
    type OptionSchema,
} from "../options";

describe("extractCommandChain", () => {
    test("extracts single command from args", () => {
        const result = extractCommandChain(["run"]);
        expect(result.commandPath).toEqual(["run"]);
        expect(result.flagArgs).toEqual([]);
    });

    test("extracts command with flags", () => {
        const result = extractCommandChain(["run", "--repo", "/path/to/repo"]);
        expect(result.commandPath).toEqual(["run"]);
        expect(result.flagArgs).toEqual(["--repo", "/path/to/repo"]);
    });

    test("extracts multi-level command chain", () => {
        const result = extractCommandChain(["config", "show", "--verbose"]);
        expect(result.commandPath).toEqual(["config", "show"]);
        expect(result.flagArgs).toEqual(["--verbose"]);
    });

    test("handles no command (empty args)", () => {
        const result = extractCommandChain([]);
        expect(result.commandPath).toEqual([]);
        expect(result.flagArgs).toEqual([]);
    });

    test("handles flags only (no command)", () => {
        const result = extractCommandChain(["--repo", "/path"]);
        expect(result.commandPath).toEqual([]);
        expect(result.flagArgs).toEqual(["--repo", "/path"]);
    });

    test("handles multiple flags with values", () => {
        const result = extractCommandChain([
            "run",
            "--repo",
            "/path/to/repo",
            "--fixture",
            "./fixture.json",
            "--agent",
            "copilot",
        ]);
        expect(result.commandPath).toEqual(["run"]);
        expect(result.flagArgs).toEqual([
            "--repo",
            "/path/to/repo",
            "--fixture",
            "./fixture.json",
            "--agent",
            "copilot",
        ]);
    });

    test("handles boolean flags", () => {
        const result = extractCommandChain(["run", "--use-cache", "--stop-on-error"]);
        expect(result.commandPath).toEqual(["run"]);
        expect(result.flagArgs).toEqual(["--use-cache", "--stop-on-error"]);
    });

    test("does not consume non-flag args as values for boolean flags", () => {
        // Boolean flags don't take values, so "extra" should remain in flagArgs
        // for parseArgs to handle (and potentially reject as unexpected positional)
        const result = extractCommandChain(["run", "--use-cache", "extra", "--agent", "codex"]);
        expect(result.commandPath).toEqual(["run"]);
        expect(result.flagArgs).toEqual(["--use-cache", "extra", "--agent", "codex"]);
    });

    test("handles negated boolean flags", () => {
        const result = extractCommandChain(["run", "--no-use-cache", "--no-stop-on-error"]);
        expect(result.commandPath).toEqual(["run"]);
        expect(result.flagArgs).toEqual(["--no-use-cache", "--no-stop-on-error"]);
    });
});

describe("resolveCommandPath", () => {
    test("resolves empty path to interactive (default)", () => {
        const result = resolveCommandPath([]);
        expect(result.command).toBe("interactive");
    });

    test("resolves 'run' command", () => {
        const result = resolveCommandPath(["run"]);
        expect(result.command).toBe("run");
    });

    test("resolves 'interactive' command", () => {
        const result = resolveCommandPath(["interactive"]);
        expect(result.command).toBe("interactive");
    });

    test("resolves 'help' command", () => {
        const result = resolveCommandPath(["help"]);
        expect(result.command).toBe("help");
    });

    test("resolves 'check' command", () => {
        const result = resolveCommandPath(["check"]);
        expect(result.command).toBe("check");
    });

    test("throws on unknown command", () => {
        expect(() => resolveCommandPath(["unknown"])).toThrow(
            /Unknown command: unknown/
        );
    });
});

describe("parseCliArgs", () => {
    describe("command parsing", () => {
        test("defaults to interactive when no command given", () => {
            const result = parseCliArgs([]);
            expect(result.command).toBe("interactive");
            expect(result.commandPath).toEqual([]);
        });

        test("parses 'run' command", () => {
            const result = parseCliArgs(["run"]);
            expect(result.command).toBe("run");
            expect(result.commandPath).toEqual(["run"]);
        });

        test("parses 'interactive' command", () => {
            const result = parseCliArgs(["interactive"]);
            expect(result.command).toBe("interactive");
            expect(result.commandPath).toEqual(["interactive"]);
        });

        test("parses 'help' command", () => {
            const result = parseCliArgs(["help"]);
            expect(result.command).toBe("help");
            expect(result.commandPath).toEqual(["help"]);
        });

        test("parses 'check' command", () => {
            const result = parseCliArgs(["check"]);
            expect(result.command).toBe("check");
            expect(result.commandPath).toEqual(["check"]);
        });

        test("throws on unknown command", () => {
            expect(() => parseCliArgs(["unknown"])).toThrow(/Unknown command: unknown/);
        });
    });

    describe("run command options", () => {
        test("parses --repo option", () => {
            const result = parseCliArgs(["run", "--repo", "/path/to/repo"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["repo"]).toBe("/path/to/repo");
            }
        });

        test("parses --fixture option", () => {
            const result = parseCliArgs(["run", "--fixture", "./fixture.json"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["fixture"]).toBe("./fixture.json");
            }
        });

        test("parses --agent option", () => {
            const result = parseCliArgs(["run", "--agent", "copilot"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["agent"]).toBe("copilot");
            }
        });

        test("parses --iterations option", () => {
            const result = parseCliArgs(["run", "--iterations", "5"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["iterations"]).toBe("5");
            }
        });

        test("parses --output-mode option", () => {
            const result = parseCliArgs(["run", "--output-mode", "Detailed"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["output-mode"]).toBe("Detailed");
            }
        });

        test("parses --log-level option", () => {
            const result = parseCliArgs(["run", "--log-level", "debug"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["log-level"]).toBe("debug");
            }
        });

        test("parses --use-cache boolean flag", () => {
            const result = parseCliArgs(["run", "--use-cache"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["use-cache"]).toBe(true);
            }
        });

        test("parses --no-use-cache negated flag", () => {
            const result = parseCliArgs(["run", "--no-use-cache"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["use-cache"]).toBe(false);
            }
        });

        test("parses --stop-on-error boolean flag", () => {
            const result = parseCliArgs(["run", "--stop-on-error"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["stop-on-error"]).toBe(true);
            }
        });

        test("parses --allow-full-access boolean flag", () => {
            const result = parseCliArgs(["run", "--allow-full-access"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["allow-full-access"]).toBe(true);
            }
        });

        test("parses --model option", () => {
            const result = parseCliArgs(["run", "--model", "gpt-5"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["model"]).toBe("gpt-5");
            }
        });

        test("parses --eval-model option", () => {
            const result = parseCliArgs(["run", "--eval-model", "gpt-5-eval"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["eval-model"]).toBe("gpt-5-eval");
            }
        });

        test("parses multiple options together", () => {
            const result = parseCliArgs([
                "run",
                "--repo",
                "/path",
                "--fixture",
                "./fix.json",
                "--agent",
                "codex",
                "--use-cache",
            ]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["repo"]).toBe("/path");
                expect(result.options["fixture"]).toBe("./fix.json");
                expect(result.options["agent"]).toBe("codex");
                expect(result.options["use-cache"]).toBe(true);
            }
        });
    });

    describe("check command options", () => {
        test("parses check with no options", () => {
            const result = parseCliArgs(["check"]);
            expect(result.command).toBe("check");
            if (result.command === "check") {
                expect(result.options["agent"]).toBeUndefined();
            }
        });

        test("parses check with --agent option", () => {
            const result = parseCliArgs(["check", "--agent", "copilot"]);
            expect(result.command).toBe("check");
            if (result.command === "check") {
                expect(result.options["agent"]).toBe("copilot");
            }
        });

        test("throws on invalid option for check command", () => {
            expect(() => parseCliArgs(["check", "--repo", "/path"])).toThrow();
        });
    });

    describe("help command", () => {
        test("parses help with no options", () => {
            const result = parseCliArgs(["help"]);
            expect(result.command).toBe("help");
            expect(result.commandPath).toEqual(["help"]);
        });

        test("ignores flags after help command (help returns early)", () => {
            // Help command returns early before parsing flags
            const result = parseCliArgs(["help", "--verbose"]);
            expect(result.command).toBe("help");
        });
    });

    describe("interactive command options", () => {
        test("parses interactive with no options", () => {
            const result = parseCliArgs(["interactive"]);
            expect(result.command).toBe("interactive");
            expect(result.commandPath).toEqual(["interactive"]);
        });

        test("throws on unknown option for interactive command", () => {
            expect(() => parseCliArgs(["interactive", "--repo", "/path"])).toThrow();
        });
    });

    describe("edge cases", () => {
        test("handles flag values that look like commands", () => {
            const result = parseCliArgs(["run", "--repo", "run"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["repo"]).toBe("run");
            }
        });

        test("handles paths with special characters", () => {
            const result = parseCliArgs(["run", "--repo", "/path/with spaces/and-dashes"]);
            expect(result.command).toBe("run");
            if (result.command === "run") {
                expect(result.options["repo"]).toBe("/path/with spaces/and-dashes");
            }
        });
    });

    describe("implicit help subcommand", () => {
        test("parses 'run help' as help command", () => {
            const result = parseCliArgs(["run", "help"]);
            expect(result.command).toBe("help");
            expect(result.commandPath).toEqual(["run", "help"]);
        });

        test("parses 'check help' as help command", () => {
            const result = parseCliArgs(["check", "help"]);
            expect(result.command).toBe("help");
            expect(result.commandPath).toEqual(["check", "help"]);
        });

        test("parses 'interactive help' as help command", () => {
            const result = parseCliArgs(["interactive", "help"]);
            expect(result.command).toBe("help");
            expect(result.commandPath).toEqual(["interactive", "help"]);
        });

        test("resolveCommandPath returns showHelp=true for implicit help", () => {
            const result = resolveCommandPath(["run", "help"]);
            expect(result.showHelp).toBe(true);
            expect(result.command).toBe("run");
        });

        test("resolveCommandPath returns showHelp=false for regular commands", () => {
            const result = resolveCommandPath(["run"]);
            expect(result.showHelp).toBe(false);
            expect(result.command).toBe("run");
        });
    });
});

describe("ArgumentError", () => {
    const testSchema = {
        name: {
            type: "string",
            description: "A name",
            required: true,
        },
        optional: {
            type: "string",
            description: "An optional value",
        },
    } satisfies OptionSchema;

    enum TestEnum {
        Foo = "Foo",
        Bar = "Bar",
    }

    test("is an instance of Error", () => {
        const error = new ArgumentError("test message");
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ArgumentError);
    });

    test("has correct name property", () => {
        const error = new ArgumentError("test message");
        expect(error.name).toBe("ArgumentError");
    });

    test("preserves error message", () => {
        const error = new ArgumentError("Missing required argument: --repo");
        expect(error.message).toBe("Missing required argument: --repo");
    });

    test("getRequiredStringOption throws ArgumentError when value is missing", () => {
        const options = { optional: "value" };
        expect(() => {
            getRequiredStringOption(options, testSchema, "name");
        }).toThrow(ArgumentError);
    });

    test("getRequiredStringOption throws with correct message", () => {
        const options = { optional: "value" };
        expect(() => {
            getRequiredStringOption(options, testSchema, "name");
        }).toThrow("Missing required argument: --name");
    });

    test("getRequiredStringOption returns value when present", () => {
        const options = { name: "test-value" };
        const result = getRequiredStringOption(options, testSchema, "name");
        expect(result).toBe("test-value");
    });

    test("parseEnumOption throws ArgumentError when value is missing and no default", () => {
        expect(() => {
            parseEnumOption(undefined, TestEnum, "type");
        }).toThrow(ArgumentError);
    });

    test("parseEnumOption throws with correct message", () => {
        expect(() => {
            parseEnumOption(undefined, TestEnum, "type");
        }).toThrow("Missing required argument: --type");
    });

    test("parseEnumOption returns default when value is missing but default provided", () => {
        const result = parseEnumOption(undefined, TestEnum, "type", TestEnum.Foo);
        expect(result).toBe(TestEnum.Foo);
    });

    test("parseEnumOption returns parsed value when present", () => {
        const result = parseEnumOption("bar", TestEnum, "type");
        expect(result).toBe(TestEnum.Bar);
    });
});

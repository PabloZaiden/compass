import { describe, test, expect } from "bun:test";
import { getVersion } from "../version";
import { parseCliArgs } from "../cli/parser";
import { modeRegistry } from "../modes";
import pkg from "../../package.json";

describe("version", () => {
    describe("getVersion", () => {
        test("returns a string that contains the version from package.json", () => {
            const version = getVersion();
            expect(version).toContain(pkg.version);
        });

        test("contains (dev) when commit hash is empty, otherwise short hash", () => {
            const version = getVersion();
            const commitHash = pkg.config?.commitHash;
            if (commitHash) {
                expect(version).toContain(commitHash.substring(0, 7));
            } else {
                expect(version).toContain("(dev)");
            }
        });

        test("returns a non-empty string", () => {
            const version = getVersion();
            expect(typeof version).toBe("string");
            expect(version.length).toBeGreaterThan(0);
        });
    });

    describe("version command", () => {
        test("version command is registered in mode registry", () => {
            expect(modeRegistry["version"]).toBeDefined();
        });

        test("version mode has correct name", () => {
            const versionMode = modeRegistry["version"];
            expect(versionMode).toBeDefined();
            expect(versionMode!.name).toBe("version");
        });

        test("version mode has a description", () => {
            const versionMode = modeRegistry["version"];
            expect(versionMode).toBeDefined();
            expect(versionMode!.description).toBeDefined();
            expect(versionMode!.description.length).toBeGreaterThan(0);
        });

        test("version mode has no required options", () => {
            const versionMode = modeRegistry["version"];
            expect(versionMode).toBeDefined();
            const options = versionMode!.options;
            expect(options).toBeDefined();
            expect(Object.keys(options!)).toHaveLength(0);
        });
    });

    describe("CLI parsing", () => {
        test("parses version command", () => {
            const result = parseCliArgs(["version"]);
            expect(result.command).toBe("version");
            expect(result.commandPath).toEqual(["version"]);
        });

        test("version help is parsed correctly", () => {
            const result = parseCliArgs(["version", "help"]);
            expect(result.command).toBe("help");
            expect(result.commandPath).toEqual(["version", "help"]);
        });
    });
});

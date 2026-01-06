import pkg from "../../package.json";

/**
 * Returns the application version from package.json.
 */
export function getVersion(): string {
    return pkg.version;
}

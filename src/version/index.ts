import pkg from "../../package.json";

/**
 * Returns the application version from package.json with short commit hash.
 */
export function getVersion(): string {
    const commitHash = pkg.config?.commitHash;
    const shortHash = commitHash ? commitHash.substring(0, 7) : "(dev)";
    return `${pkg.version} - ${shortHash}`;
}

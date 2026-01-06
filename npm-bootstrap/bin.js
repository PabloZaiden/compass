#!/usr/bin/env node

/**
 * Bootstrap script for @pablozaiden/compass
 *
 * This script downloads the appropriate platform-specific binary from GitHub releases
 * on first run, caches it locally, and then executes it with the provided arguments.
 *
 * Compatible with both Node.js and Bun runtimes.
 */

import { existsSync, mkdirSync, chmodSync, createWriteStream, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { get as httpsGet } from "node:https";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Get package version to match with GitHub release
const packageJson = require("./package.json");
const VERSION = packageJson.version;
const REPO_OWNER = "pablozaiden";
const REPO_NAME = "compass";

// Determine platform and architecture
function getPlatformInfo() {
  const platform = process.platform;
  const arch = process.arch;

  let targetOs;
  if (platform === "darwin") {
    targetOs = "darwin";
  } else if (platform === "linux") {
    targetOs = "linux";
  } else {
    throw new Error(`Unsupported platform: ${platform}. Only macOS and Linux are supported.`);
  }

  let targetArch;
  if (arch === "x64" || arch === "amd64") {
    targetArch = "x64";
  } else if (arch === "arm64" || arch === "aarch64") {
    targetArch = "arm64";
  } else {
    throw new Error(`Unsupported architecture: ${arch}. Only x64 and arm64 are supported.`);
  }

  return { targetOs, targetArch };
}

// Get the cache directory for storing the binary
function getCacheDir() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return join(__dirname, ".cache");
}

// Get the binary path
function getBinaryPath(targetOs, targetArch) {
  const cacheDir = getCacheDir();
  const binaryName = `compass-v${VERSION}-${targetOs}-${targetArch}`;
  return join(cacheDir, binaryName);
}

// Download a file using Node.js https module (works in both Node and Bun)
function downloadFile(url, destPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) {
      reject(new Error("Too many redirects"));
      return;
    }

    const cleanupAndReject = (err) => {
      try {
        if (existsSync(destPath)) {
          unlinkSync(destPath);
        }
      } catch {
        // Ignore cleanup errors
      }
      reject(err);
    };

    httpsGet(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, destPath, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });

      fileStream.on("error", cleanupAndReject);

      response.on("error", (err) => {
        fileStream.close();
        cleanupAndReject(err);
      });
    }).on("error", cleanupAndReject);
  });
}

// Download the binary from GitHub releases
async function downloadBinary(targetOs, targetArch) {
  const tag = `v${VERSION}`;
  const binaryName = `compass-${tag}-${targetOs}-${targetArch}`;
  const downloadUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}/${binaryName}`;

  const binaryPath = getBinaryPath(targetOs, targetArch);
  const cacheDir = getCacheDir();

  // Ensure cache directory exists
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  console.log(`Downloading compass ${tag} for ${targetOs}-${targetArch}...`);
  console.log(`From: ${downloadUrl}`);

  try {
    await downloadFile(downloadUrl, binaryPath);
    chmodSync(binaryPath, 0o755);
    console.log("Download complete!");
  } catch (error) {
    // Clean up partial download
    if (existsSync(binaryPath)) {
      unlinkSync(binaryPath);
    }
    throw new Error(`Failed to download binary: ${error.message}`);
  }
}

// Run the binary with the provided arguments
function runBinary(binaryPath, args) {
  const child = spawn(binaryPath, args, {
    stdio: "inherit",
    env: process.env,
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(`Failed to execute compass: ${error.message}`);
    process.exit(1);
  });
}

// Main function
async function main() {
  try {
    const { targetOs, targetArch } = getPlatformInfo();
    const binaryPath = getBinaryPath(targetOs, targetArch);

    // Download binary if not cached
    if (!existsSync(binaryPath)) {
      await downloadBinary(targetOs, targetArch);
    }

    // Run the binary with the arguments passed to this script
    const args = process.argv.slice(2);
    runBinary(binaryPath, args);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

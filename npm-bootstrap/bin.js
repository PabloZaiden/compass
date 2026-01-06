#!/usr/bin/env node

// bin.ts
import { existsSync, mkdirSync, chmodSync, createWriteStream, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { get as httpsGet } from "node:https";
import { createRequire } from "node:module";
var require2 = createRequire(import.meta.url);
var packageJson = require2("./package.json");
function getVersion() {
  const envTag = process.env["COMPASS_RELEASE_TAG"];
  if (envTag) {
    return envTag.startsWith("v") ? envTag.slice(1) : envTag;
  }
  return packageJson.version;
}
var REPO_OWNER = "pablozaiden";
var REPO_NAME = "compass";
function getPlatformInfo() {
  const platform = process.platform;
  const arch = process.arch;
  let targetOs;
  if (!(platform === "darwin" || platform === "linux")) {
    throw new Error(`Unsupported platform: ${platform}. Only macOS and Linux are supported.`);
  }
  targetOs = platform;
  let targetArch;
  if (!(arch === "x64" || arch === "arm64")) {
    throw new Error(`Unsupported architecture: ${arch}. Only x64 and arm64 are supported.`);
  }
  targetArch = arch;
  return { targetOs, targetArch };
}
function getCacheDir() {
  const __filename2 = fileURLToPath(import.meta.url);
  const __dirname2 = dirname(__filename2);
  return join(__dirname2, ".cache");
}
function getBinaryPath(targetOs, targetArch) {
  const cacheDir = getCacheDir();
  const binaryName = `compass-v${getVersion()}-${targetOs}-${targetArch}`;
  return join(cacheDir, binaryName);
}
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
      } catch {}
      reject(err);
    };
    httpsGet(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, destPath, redirectCount + 1).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        const error = new Error(`Failed to download: HTTP ${response.statusCode}`);
        error.statusCode = response.statusCode;
        reject(error);
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
        fileStream.destroy();
        cleanupAndReject(err);
      });
    }).on("error", cleanupAndReject);
  });
}
function isGhCliAvailable() {
  try {
    const result = spawnSync("gh", ["auth", "status"], {
      stdio: "pipe",
      encoding: "utf-8"
    });
    return result.status === 0;
  } catch {
    return false;
  }
}
function downloadWithGhCli(tag, assetName, destPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("gh", ["release", "download", tag, "--repo", `${REPO_OWNER}/${REPO_NAME}`, "--pattern", assetName, "--output", destPath], {
      stdio: "pipe"
    });
    let stderr = "";
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`gh cli failed: ${stderr || `exit code ${code}`}`));
      }
    });
    child.on("error", (error) => {
      reject(new Error(`Failed to run gh cli: ${error.message}`));
    });
  });
}
async function downloadBinary(targetOs, targetArch) {
  const tag = `v${getVersion()}`;
  const binaryName = `compass-${tag}-${targetOs}-${targetArch}`;
  const downloadUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}/${binaryName}`;
  const binaryPath = getBinaryPath(targetOs, targetArch);
  const cacheDir = getCacheDir();
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  console.log(`Downloading compass ${tag} for ${targetOs}-${targetArch}...`);
  console.log(`From: ${downloadUrl}`);
  try {
    await downloadFile(downloadUrl, binaryPath);
    chmodSync(binaryPath, 493);
    console.log("Download complete!");
  } catch (error) {
    if (existsSync(binaryPath)) {
      unlinkSync(binaryPath);
    }
    const statusCode = error.statusCode;
    if (statusCode === 404) {
      console.log("Direct download failed (404). Checking for GitHub CLI...");
      if (isGhCliAvailable()) {
        console.log("GitHub CLI found and authenticated. Attempting download via gh...");
        try {
          await downloadWithGhCli(tag, binaryName, binaryPath);
          chmodSync(binaryPath, 493);
          console.log("Download complete via GitHub CLI!");
          return;
        } catch (ghError) {
          if (existsSync(binaryPath)) {
            unlinkSync(binaryPath);
          }
          const ghMessage = ghError instanceof Error ? ghError.message : String(ghError);
          throw new Error(`Failed to download binary via GitHub CLI: ${ghMessage}`);
        }
      } else {
        throw new Error("Failed to download binary: HTTP 404. " + "This may be a private repository. Install and authenticate the GitHub CLI (gh) to download.");
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to download binary: ${message}`);
  }
}
function runBinary(binaryPath, args) {
  const child = spawn(binaryPath, args, {
    stdio: "inherit",
    env: process.env
  });
  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
  child.on("error", (error) => {
    console.error(`Failed to execute compass: ${error.message}`);
    process.exit(1);
  });
}
async function main() {
  try {
    const { targetOs, targetArch } = getPlatformInfo();
    const binaryPath = getBinaryPath(targetOs, targetArch);
    if (!existsSync(binaryPath)) {
      await downloadBinary(targetOs, targetArch);
    }
    const args = process.argv.slice(2);
    runBinary(binaryPath, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}
main();

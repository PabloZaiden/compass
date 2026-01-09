#!/usr/bin/env bun
const scriptDir = import.meta.dir;

// Ensure dependencies are installed, especially for install --global
await Bun.$`bun install`.cwd(scriptDir);

// Now import and run the main application logic
import './index.ts';
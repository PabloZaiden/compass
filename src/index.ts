#!/usr/bin/env bun

import { CompassApp } from "./app.ts";

const scriptDir = import.meta.dir;

// Ensure dependencies are installed, especially for install --global
await Bun.$`bun install`.cwd(scriptDir).quiet();

const app = new CompassApp();
await app.run(Bun.argv.slice(2));
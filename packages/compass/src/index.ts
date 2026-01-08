#!/usr/bin/env bun

// Import modes first to trigger self-registration
import "./modes";

import { runCli } from "./cli";

await runCli(Bun.argv.slice(2));
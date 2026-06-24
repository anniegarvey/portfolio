#!/usr/bin/env node
// timed-run.js — wraps a command and records timing + context to build-data/runs.ndjson.
// Usage: node scripts/timed-run.js <hook-name> <cmd> [args...]
//   hook-name: label for this invocation (e.g. "pre-commit", "pre-push", "tsc")
//   cmd args:  the command to run (inherits stdio, preserves TTY)
// Telemetry errors never block the hook — the child's exit code is always propagated.

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { getGitContext, appendBuildEntry } = require("./build-data-utils");

const ROOT = path.resolve(__dirname, "..");
const hookName = process.argv[2];
const command = process.argv.slice(3);

if (!hookName || command.length === 0) {
  process.stderr.write(
    "Usage: node scripts/timed-run.js <hook-name> <cmd> [args...]\n",
  );
  process.exit(1);
}

// Collect git context before running (staged list changes after lint-restage).
const startTs = new Date().toISOString();
const gitContext = getGitContext(ROOT);
const startMs = Date.now();

const result = spawnSync(command[0], command.slice(1), {
  stdio: "inherit",
  cwd: ROOT,
});

const durationMs = Date.now() - startMs;
const exitCode = result.status ?? (result.signal ? 1 : 0);

appendBuildEntry(
  {
    ts: startTs,
    hook: hookName,
    command: command.join(" "),
    durationMs,
    exitCode,
    git: gitContext,
    node: process.version,
  },
  ROOT,
);

process.exit(exitCode);

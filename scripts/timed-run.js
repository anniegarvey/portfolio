#!/usr/bin/env node
// timed-run.js — wraps a command and records timing + context to build-data/runs.ndjson.
// Usage: node scripts/timed-run.js <hook-name> <cmd> [args...]
//   hook-name: label for this invocation (e.g. "pre-commit", "pre-push")
//   cmd args:  the command to run (inherits stdio, preserves TTY)
// Telemetry errors never block the hook — the child's exit code is always propagated.

const { spawnSync, execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const hookName = process.argv[2];
const command = process.argv.slice(3);

if (!hookName || command.length === 0) {
  process.stderr.write(
    "Usage: node scripts/timed-run.js <hook-name> <cmd> [args...]\n",
  );
  process.exit(1);
}

// For worktrees, return the main repo path so all data lands in one place.
function getMainRepo() {
  try {
    const list = execSync("git worktree list", {
      encoding: "utf8",
      cwd: ROOT,
    }).trim();
    return list.split("\n")[0].split(/\s+/)[0];
  } catch {
    return ROOT;
  }
}

// Collect git context before running (staged list changes after lint-restage).
function getGitContext() {
  const ctx = {};
  try {
    ctx.branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      cwd: ROOT,
    }).trim();
  } catch {}
  try {
    ctx.commit = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      cwd: ROOT,
    }).trim();
  } catch {}
  ctx.worktree = path.basename(ROOT);
  if (hookName === "pre-commit") {
    try {
      const out = execSync("git diff --cached --name-only", {
        encoding: "utf8",
        cwd: ROOT,
      }).trim();
      ctx.stagedFiles = out ? out.split("\n").length : 0;
    } catch {}
  }
  return ctx;
}

const startTs = new Date().toISOString();
const gitContext = getGitContext();
const startMs = Date.now();

const result = spawnSync(command[0], command.slice(1), {
  stdio: "inherit",
  cwd: ROOT,
});

const durationMs = Date.now() - startMs;
const exitCode = result.status ?? (result.signal ? 1 : 0);

try {
  const mainRepo = getMainRepo();
  const dataDir = path.join(mainRepo, "build-data");
  fs.mkdirSync(dataDir, { recursive: true });
  const entry = {
    ts: startTs,
    hook: hookName,
    command: command.join(" "),
    durationMs,
    exitCode,
    git: gitContext,
    node: process.version,
  };
  fs.appendFileSync(
    path.join(dataDir, "runs.ndjson"),
    `${JSON.stringify(entry)}\n`,
  );
} catch {}

process.exit(exitCode);

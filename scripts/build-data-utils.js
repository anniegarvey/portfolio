// build-data-utils.js — shared helpers for writing build lifecycle entries.
// Used by timed-run.js (wraps whole commands) and smart-validate.js (inline
// timing for tasks that need custom logic, e.g. stryker timeout detection).

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function getMainRepo(cwd) {
  try {
    const list = execSync("git worktree list", {
      encoding: "utf8",
      cwd,
    }).trim();
    return list.split("\n")[0].split(/\s+/)[0];
  } catch {
    return cwd;
  }
}

function getGitContext(cwd) {
  const ctx = {};
  try {
    ctx.branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      cwd,
    }).trim();
  } catch {}
  try {
    ctx.commit = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      cwd,
    }).trim();
  } catch {}
  ctx.worktree = path.basename(cwd);
  try {
    const out = execSync("git diff --cached --name-only", {
      encoding: "utf8",
      cwd,
    }).trim();
    if (out) ctx.stagedFiles = out.split("\n").length;
  } catch {}
  return ctx;
}

function appendBuildEntry(entry, cwd) {
  try {
    const mainRepo = getMainRepo(cwd);
    const dataDir = path.join(mainRepo, "build-data");
    fs.mkdirSync(dataDir, { recursive: true });
    fs.appendFileSync(
      path.join(dataDir, "runs.ndjson"),
      `${JSON.stringify(entry)}\n`,
    );
  } catch {}
}

module.exports = { getMainRepo, getGitContext, appendBuildEntry };

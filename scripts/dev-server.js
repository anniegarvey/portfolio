#!/usr/bin/env node
// dev-server.js — makes sure this worktree's dev server answers before the
// pre-commit hook runs tsc and e2e.
//
// Why: Playwright otherwise starts `next dev` itself while tsc is running, and
// a fresh `next dev` wipes .next/dev/types under tsc (TS6053). Next can also
// exit on its first start to print an upgrade notice, which fails
// Playwright's webServer. Starting it here first, with retries, avoids both.
//
// Prints "reused" if a server already answered, or "started <pid>" if this
// script started one; the caller stops it afterwards by signalling that
// process group (`pnpm kill-server` needs `ss`, which cloud containers lack).
// Logs go to stderr so stdout stays that one line.

const { execFileSync, spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ATTEMPTS = 3;
const READY_TIMEOUT_MS = 90_000;

const port = execFileSync("node", [path.join(__dirname, "pick-port.js")], {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
const url = `http://localhost:${port}`;

async function answers() {
  try {
    await fetch(url, { signal: AbortSignal.timeout(5_000) });
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Starts `next dev` and resolves its pid once it answers, or null if it doesn't. */
async function start(attempt) {
  const log = path.join(os.tmpdir(), `next-dev-${port}-${attempt}.log`);
  const out = fs.openSync(log, "w");
  const child = spawn("pnpm", ["exec", "next", "dev"], {
    cwd: ROOT,
    env: { ...process.env, PORT: port },
    detached: true,
    stdio: ["ignore", out, out],
  });
  child.unref();
  let exited = false;
  child.on("exit", () => {
    exited = true;
  });

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await answers()) return child.pid;
    if (exited) {
      console.error(
        `dev-server: next dev exited on attempt ${attempt}, see ${log}`,
      );
      return null;
    }
    await sleep(1_000);
  }
  console.error(`dev-server: no answer on ${url} after attempt ${attempt}`);
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {}
  return null;
}

async function main() {
  if (await answers()) {
    process.stdout.write("reused\n");
    return;
  }
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const pid = await start(attempt);
    if (pid) {
      process.stdout.write(`started ${pid}\n`);
      return;
    }
  }
  console.error(`dev-server: gave up after ${ATTEMPTS} attempts`);
  process.exit(1);
}

main();

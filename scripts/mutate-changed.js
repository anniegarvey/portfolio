#!/usr/bin/env node
// mutate-changed.js — Stryker mutation testing for the source files a branch
// changes. CI runs it on pull requests; you can run it locally too.
//
// Usage: node scripts/mutate-changed.js [base-ref]   (default: origin/main)
//
// Mutates changed non-test src files outside src/app/ that have a co-located
// unit test, plus the source file of any changed co-located test. Results are
// cached in reports/stryker-incremental.json, so re-runs only test mutants
// whose code or tests changed. Scores are reported, not enforced: the script
// only fails if Stryker itself errors.

const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const base = process.argv[2] ?? "origin/main";

const changed = execSync(
  `git diff --name-only --diff-filter=d ${base}...HEAD`,
  {
    cwd: ROOT,
    encoding: "utf8",
  },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const files = new Set();
for (const file of changed) {
  if (
    !file.startsWith("src/") ||
    file.startsWith("src/app/") ||
    !/\.(ts|tsx)$/.test(file)
  ) {
    continue;
  }
  const source = file.replace(/\.test\.(ts|tsx)$/, ".$1");
  const test = source.replace(/\.(ts|tsx)$/, ".test.$1");
  if (
    fs.existsSync(path.join(ROOT, source)) &&
    fs.existsSync(path.join(ROOT, test))
  ) {
    files.add(source);
  }
}

function report(markdown) {
  console.log(`\n${markdown}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }
}

if (files.size === 0) {
  report("Mutation testing: no changed source files with unit tests.");
  process.exit(0);
}

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "stryker",
    "run",
    "stryker.smart.config.json",
    "--reporters",
    "clear-text,json",
    "--mutate",
    [...files].join(","),
  ],
  { stdio: "inherit", cwd: ROOT },
);
if (result.status !== 0) process.exit(result.status ?? 1);

// Mutation score = detected / (detected + undetected), as Stryker counts it.
const json = JSON.parse(
  fs.readFileSync(path.join(ROOT, "reports/mutation/mutation.json"), "utf8"),
);
// The report also carries files kept from the incremental cache, so only
// the files mutated in this run are listed.
const rows = [...files].map((file) => {
  const { mutants } = json.files[file];
  const count = (...statuses) =>
    mutants.filter((m) => statuses.includes(m.status)).length;
  const detected = count("Killed", "Timeout");
  const undetected = count("Survived", "NoCoverage");
  const score = (100 * detected) / (detected + undetected || 1);
  return `| ${file} | ${score.toFixed(1)}% | ${undetected} |`;
});
report(
  [
    "### Mutation testing",
    "",
    "Target is 80%. Check survivors in the job log for real gaps; tuning constants can be left.",
    "",
    "| File | Score | Missed |",
    "| --- | --- | --- |",
    ...rows,
  ].join("\n"),
);

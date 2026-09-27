#!/usr/bin/env node
// smart-validate.js — runs only the validations relevant to staged changes.
// Falls back to full suite for config/shared/unrecognised files.
//
// Mapping config: scripts/validate-map.json
// ─────────────────────────────────────────
// "areas": maps source glob patterns to the e2e directory to run when those
//   files change. For each staged source file, smart-validate also looks for
//   a co-located unit test (e.g. Foo.tsx → Foo.test.tsx) and runs it with
//   vitest. tsc always runs regardless of which area is matched.
//   Add a new entry here whenever a new feature area is introduced:
//     "src/**/my-feature/**": "e2e/my-feature"
//   Code shared between areas can list several dirs:
//     "src/components/Shared/**": ["e2e/my-feature", "e2e/other-feature"]
//
// "skip": files that need no validation at all — assets, docs, design files,
//   tooling scripts. Changes to these are silently ignored.
//
// Default behaviour for unrecognised files
// ─────────────────────────────────────────
// Files outside src/ and e2e/ (e.g. Playwright config) can be listed in
// "areas" too. Any staged file that doesn't match "areas" or "skip" triggers
// the full suite as a safe fallback — including config files, shared layouts, and
// anything else not explicitly listed. This means adding new source
// directories without updating "areas" will be slow but never silently skip
// tests. Fix it by adding the new path to "areas" (or "skip" if it needs no
// tests).
//
// Mutation testing is not run here: CI runs it on pull requests
// (scripts/mutate-changed.js).

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const map = JSON.parse(
  fs.readFileSync(path.join(__dirname, "validate-map.json"), "utf8"),
);

/** Convert a simple glob pattern (using * and **) to a RegExp. */
function matchGlob(pattern, file) {
  const re = new RegExp(
    "^" +
      pattern.replace(/\./g, "\\.").replace(/\*+\/|\*+/g, (m) => {
        if (m === "**/") return "(.+/)?";
        if (m === "**") return ".*";
        return "[^/]*";
      }) +
      "$",
  );
  return re.test(file);
}

function matchesAny(file, patterns) {
  return patterns.some((p) => matchGlob(p, file));
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

/**
 * Run biome on the given files (or all files if none specified), then
 * re-stage any of those files that were already staged. This ensures lint
 * auto-fixes are included in the commit rather than left unstaged.
 */
function lintAndRestage(files) {
  const codeFiles = files.filter(
    (f) => !matchesAny(f, map.skip) && /\.(ts|tsx|js|json|css)$/.test(f),
  );
  if (codeFiles.length === 0) return;
  run(
    `node scripts/timed-run.js biome pnpm exec biome check --error-on-warnings --fix ${codeFiles.join(" ")}`,
  );
  run(`git add ${codeFiles.join(" ")}`);
  const tsFiles = codeFiles.filter((f) => /\.(ts|tsx)$/.test(f));
  if (tsFiles.length > 0) {
    run(`node scripts/check-theme-tokens.mjs ${tsFiles.join(" ")}`);
  }
}

/**
 * Full-suite fallback: lint all files, restage touched staged files, then
 * run tsc + all tests + all e2e in parallel. Equivalent to `pnpm validate`
 * but with the restage step in between.
 */
function runFullValidate() {
  run(
    "node scripts/timed-run.js biome pnpm exec biome check --error-on-warnings --fix",
  );
  run("node scripts/check-theme-tokens.mjs");
  const stagedCodeFiles = staged.filter(
    (f) => !matchesAny(f, map.skip) && /\.(ts|tsx|js|json|css)$/.test(f),
  );
  if (stagedCodeFiles.length > 0) {
    run(`git add ${stagedCodeFiles.join(" ")}`);
  }
  run(
    `pnpm exec concurrently --kill-others-on-fail --names "tsc,test,e2e"` +
      ` "node scripts/timed-run.js tsc pnpm exec tsc --noEmit"` +
      ` "node scripts/timed-run.js vitest pnpm test"` +
      ` "node scripts/timed-run.js playwright pnpm exec playwright test"`,
  );
}

// --- Collect staged files ---

// Deletions are left out: there is nothing left to lint, and re-staging a
// deleted path with `git add` fails.
const staged = execSync("git diff --cached --name-only --diff-filter=d", {
  cwd: ROOT,
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

if (staged.length === 0) {
  console.log("No staged changes — skipping validation.");
  process.exit(0);
}

// --- Categorise each staged file ---

const e2eDirs = new Set();
const vitestFiles = [];
const unmatchedSrc = [];

/** An "areas" value is one e2e dir, or several for code shared between areas. */
function addAreas(dirs) {
  for (const dir of Array.isArray(dirs) ? dirs : [dirs]) e2eDirs.add(dir);
}

for (const file of staged) {
  // Files that never need validation (assets, docs, design files)
  if (matchesAny(file, map.skip)) continue;

  const isSrc = file.startsWith("src/");
  const isUnitTest = /\.test\.(ts|tsx)$/.test(file);

  if (isUnitTest) {
    // Changed unit test → run it directly, no e2e needed
    vitestFiles.push(file);
    continue;
  }

  if (file.startsWith("e2e/")) {
    // Changed e2e file → find its area
    let matched = false;
    for (const [pattern, dir] of Object.entries(map.areas)) {
      if (matchGlob(pattern, file)) {
        addAreas(dir);
        matched = true;
      }
    }
    if (!matched) {
      console.log(`Unrecognised e2e file (${file}) — running full validate.`);
      runFullValidate();
      process.exit(0);
    }
    continue;
  }

  if (isSrc) {
    // Source file → find co-located test and e2e area
    for (const ext of ["ts", "tsx"]) {
      const candidate = file.replace(/\.(ts|tsx)$/, `.test.${ext}`);
      if (
        fs.existsSync(path.join(ROOT, candidate)) &&
        !vitestFiles.includes(candidate)
      ) {
        vitestFiles.push(candidate);
      }
    }

    let matched = false;
    for (const [pattern, dir] of Object.entries(map.areas)) {
      if (matchGlob(pattern, file)) {
        addAreas(dir);
        matched = true;
      }
    }
    if (!matched) {
      unmatchedSrc.push(file);
    }
    continue;
  }

  // Anything else outside src/ and e2e/ runs the e2e dirs it's mapped to,
  // or the full suite if it isn't mapped (e.g. package.json, next.config.ts)
  let matched = false;
  for (const [pattern, dir] of Object.entries(map.areas)) {
    if (matchGlob(pattern, file)) {
      addAreas(dir);
      matched = true;
    }
  }
  if (matched) continue;
  console.log(`Unrecognised file (${file}) — running full validate.`);
  runFullValidate();
  process.exit(0);
}

if (unmatchedSrc.length > 0) {
  console.log(
    `Unrecognised source file(s): ${unmatchedSrc.join(", ")} — running full validate.`,
  );
  runFullValidate();
  process.exit(0);
}

// --- Nothing to validate (only skipped files staged) ---

const hasVitest = vitestFiles.length > 0;
const hasE2E = e2eDirs.size > 0;

if (!(hasVitest || hasE2E)) {
  console.log("Only non-code files staged — skipping validation.");
  process.exit(0);
}

// --- Scoped lint + restage ---

lintAndRestage(staged);

// --- Build parallel commands ---

const parallel = [
  { name: "tsc", cmd: "node scripts/timed-run.js tsc pnpm exec tsc --noEmit" },
];

if (hasVitest) {
  // Disable coverage for scoped runs — thresholds rely on cross-file
  // coverage from the full suite and produce false failures in isolation.
  // Coverage is enforced by the pre-push hook, which runs `pnpm test` (full
  // suite) before any push reaches the remote.
  parallel.push({
    name: "test",
    cmd: `node scripts/timed-run.js vitest pnpm exec vitest run --coverage.enabled=false ${vitestFiles.join(" ")}`,
  });
}

if (hasE2E) {
  parallel.push({
    name: "e2e",
    cmd: `node scripts/timed-run.js playwright pnpm exec playwright test ${[...e2eDirs].join(" ")}`,
  });
}

const names = parallel.map((p) => p.name).join(",");
const cmds = parallel.map((p) => `"${p.cmd}"`).join(" ");
run(`pnpm exec concurrently --kill-others-on-fail --names "${names}" ${cmds}`);

#!/usr/bin/env node
// smart-validate.js — runs only the validations relevant to staged changes.
// Falls back to full `pnpm validate` for config/shared/unrecognised files.

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
      pattern
        .replace(/\./g, "\\.")
        .replace(/\*+\/|\*+/g, (m) => {
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

// --- Collect staged files ---

const changed = execSync("git diff --cached --name-only", {
  cwd: ROOT,
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

if (changed.length === 0) {
  console.log("No staged changes — skipping validation.");
  process.exit(0);
}

// --- Categorise each changed file ---

const e2eDirs = new Set();
const vitestFiles = [];
const unmatchedSrc = [];

for (const file of changed) {
  // Files that never need validation (assets, docs, design files)
  if (matchesAny(file, map.skip)) continue;

  // Config/layout changes → run everything
  if (matchesAny(file, map.runAll)) {
    console.log(`Config/shared file changed (${file}) — running full validate.`);
    run("pnpm validate");
    process.exit(0);
  }

  const isSrc = file.startsWith("src/");
  const isUnitTest = /\.test\.(ts|tsx)$/.test(file);
  const isE2ESpec = file.startsWith("e2e/") && file.endsWith(".spec.ts");

  if (isUnitTest) {
    // Changed unit test → run it directly, no e2e needed
    vitestFiles.push(file);
    continue;
  }

  if (isE2ESpec || file.startsWith("e2e/")) {
    // Changed e2e file → find its area
    let matched = false;
    for (const [pattern, dir] of Object.entries(map.areas)) {
      if (matchGlob(pattern, file)) {
        e2eDirs.add(dir);
        matched = true;
      }
    }
    if (!matched) {
      console.log(`Unrecognised e2e file (${file}) — running full validate.`);
      run("pnpm validate");
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
        e2eDirs.add(dir);
        matched = true;
      }
    }
    if (!matched) {
      unmatchedSrc.push(file);
    }
    continue;
  }

  // Anything else outside src/ and e2e/ that isn't in skip/runAll
  // (e.g. types/, scripts/) — safe fallback
  console.log(`Unrecognised file (${file}) — running full validate.`);
  run("pnpm validate");
  process.exit(0);
}

if (unmatchedSrc.length > 0) {
  console.log(
    `Unrecognised source file(s): ${unmatchedSrc.join(", ")} — running full validate.`,
  );
  run("pnpm validate");
  process.exit(0);
}

// --- Nothing to validate (only skipped files changed) ---

const hasVitest = vitestFiles.length > 0;
const hasE2E = e2eDirs.size > 0;

if (!hasVitest && !hasE2E) {
  console.log("Only non-code files changed — skipping validation.");
  process.exit(0);
}

// --- Scoped lint (biome accepts file paths as positional arguments) ---

const lintTargets = changed
  .filter((f) => !matchesAny(f, map.skip) && /\.(ts|tsx|js|json|css)$/.test(f))
  .join(" ");

if (lintTargets) {
  run(`pnpm exec biome check --error-on-warnings --fix ${lintTargets}`);
}

// --- Build parallel commands ---

const parallel = [{ name: "tsc", cmd: "pnpm exec tsc --noEmit" }];

if (hasVitest) {
  parallel.push({
    name: "test",
    cmd: `pnpm exec vitest run ${vitestFiles.join(" ")}`,
  });
}

if (hasE2E) {
  parallel.push({
    name: "e2e",
    cmd: `pnpm exec playwright test ${[...e2eDirs].join(" ")}`,
  });
}

const names = parallel.map((p) => p.name).join(",");
const cmds = parallel.map((p) => `"${p.cmd}"`).join(" ");
run(
  `pnpm exec concurrently --kill-others-on-fail --names "${names}" ${cmds}`,
);

#!/usr/bin/env node
// check-theme-tokens.mjs — guards against theme-breaking colour tokens.
//
// Flags an *extreme-end* neutral token (grey 50–300 at the light end, or
// 700–950 at the dark end) used as a `border*` / `background*` value WITHOUT
// light-dark(). Such a value only looks right in one theme: a light-grey
// border becomes a bright hairline in dark mode, and a dark-grey surface
// vanishes in light mode. This was the single most common defect in the
// energy-planner a11y audit.
//
// Mid greys (400/500/600) are perceptually neutral and read acceptably in
// both themes, so they're allowed as deliberate theme-static values (e.g. the
// grey-500 input borders that clear 3:1 contrast in light and dark alike).
//
// Why a bespoke check: these styles live inside next-yak tagged templates, so
// Biome (and CSS linters) never see them as CSS. This is a line-level lint
// over the template source — good enough because the codebase formats each
// declaration on one line, and multi-line light-dark() calls carry the
// `border`/`background` keyword on the same line as `light-dark(`.
//
// Usage:
//   node scripts/check-theme-tokens.mjs                # scan all of src/
//   node scripts/check-theme-tokens.mjs a.tsx b.tsx    # scan given files
//
// Escape hatch: add `/* theme-static */` on the offending line to allow a
// deliberate single-theme value.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const EXTREME_GREY = /var\(--color-grey-(?:50|100|200|300|700|800|900|950)\)/;
// A border / background CSS declaration (property followed by a colon).
// `[a-z-]*` keeps this from matching camelCase JS like `backgroundColor:`.
const DECLARATION = /\b(?:border|background)[a-z-]*\s*:/;
const ALLOW_MARKER = "theme-static";

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(full)) yield full;
  }
}

const fileArgs = process.argv.slice(2).filter((f) => /\.(ts|tsx)$/.test(f));
const files = fileArgs.length ? fileArgs : [...walk("src")];

const violations = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // file was deleted/renamed in the staged set
  }
  text.split("\n").forEach((line, i) => {
    if (line.includes("light-dark") || line.includes(ALLOW_MARKER)) return;
    if (DECLARATION.test(line) && EXTREME_GREY.test(line)) {
      violations.push({ file, line: i + 1, text: line.trim() });
    }
  });
}

if (violations.length > 0) {
  console.error(
    "\n✖ theme-tokens: extreme-end grey used in border/background without light-dark()\n",
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}\n    ${v.text}`);
  }
  console.error(
    `\n${violations.length} issue(s). Wrap the value in light-dark(<light>, <dark>),` +
      ` use a mid grey (400–600) if it should read the same in both themes,` +
      ` or add /* theme-static */ if a single-theme value is genuinely intended.\n`,
  );
  process.exit(1);
}

console.log(
  `✓ theme-tokens: ${files.length} file(s) clean (no extreme-end fixed greys in border/background)`,
);

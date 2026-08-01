/**
 * Measures how smoothly the bonsai garden paints. A mature garden is tens of
 * thousands of SVG nodes, and the cost that users feel is raster, not script —
 * so this reports frame timing and colour steps, not end-to-end latency.
 *
 * Two scenarios, both on a garden seeded with mature trees:
 *   water — press a tree and watch the soil darken (the transition should not
 *           visibly step)
 *   nav   — hover the Projects menu, changing no bonsai state at all (an
 *           unrelated interaction should not be re-rastering the trees)
 *
 * `--compare` runs each scenario twice, once with MiniTreeContainer's
 * `will-change` overridden back to `auto`, which is the before/after for the
 * compositor-layer fix. Use it to check that fix has not regressed.
 *
 * Needs a server already running — a production build (`pnpm build` then
 * `PORT=x pnpm start`), since dev-mode overhead swamps the numbers. Port comes
 * from $PORT, else `.port`.
 *
 * Plain JS on purpose: the browser-side callbacks below are serialised into the
 * page, and tsx's esbuild transform injects a `__name` helper that is not
 * defined there.
 *
 * Usage:
 *   PORT=3000 pnpm measure-bonsai-paint
 *   PORT=3000 pnpm measure-bonsai-paint --compare
 *   PORT=3000 pnpm measure-bonsai-paint --species=pine,pine,pine --days=120
 */

import { existsSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const BONSAI_KEY = "bonsai-game-state-v2";
const DEFAULT_SPECIES = [
  "pine",
  "maple",
  "cherry-blossom",
  "juniper",
  "oak",
  "wisteria",
];
// Spread across the garden so the trees overlap roughly as they do in a real
// one — clustered trees raster differently from spread ones.
const POSITIONS = [
  { x: 18, y: 35 },
  { x: 50, y: 30 },
  { x: 82, y: 35 },
  { x: 25, y: 72 },
  { x: 55, y: 78 },
  { x: 85, y: 70 },
];
const IDLE_POINT = { x: 640, y: 860 };
const TREE_SELECTOR = '[aria-label*="Click to water"]';

// ─── Options ──────────────────────────────────────────────────────────────────

function arg(name) {
  return process.argv
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

function getPort() {
  if (process.env.PORT) return process.env.PORT;
  if (existsSync(".port")) return readFileSync(".port", "utf8").trim();
  throw new Error("No server port: set PORT, or start a server to write .port");
}

const OPTIONS = {
  compare: process.argv.includes("--compare"),
  days: Number(arg("days") ?? 70),
  species: (arg("species") ?? DEFAULT_SPECIES.join(",")).split(","),
};

function makeState(species, days) {
  return {
    inventory: {
      ownedBackgroundIds: [],
      ownedFertiliserIds: [],
      ownedPotIds: species.map(() => "simple-clay-small"),
      ownedSpeciesIds: [],
      ownedStandIds: [],
      ownedToolIds: ["watering-can"],
    },
    trees: species.map((speciesId, i) => ({
      acquiredAt: "2025-01-01",
      activeDaysCount: days,
      equippedPotId: "simple-clay-small",
      gardenPosition: POSITIONS[i % POSITIONS.length],
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      name: `Tree ${i + 1}`,
      prunedBranches: [],
      speciesId,
    })),
  };
}

// ─── Recording ────────────────────────────────────────────────────────────────

/**
 * Starts an rAF loop that timestamps every frame and samples the soil colour,
 * anchored to the real pointerdown so protocol latency is excluded.
 */
async function startRecording(page, durationMs) {
  await page.evaluate((ms) => {
    window.__bonsaiRec = {
      downAt: null,
      fills: [],
      frames: [],
      t0: performance.now(),
    };
    window.__bonsaiOnDown = () => {
      window.__bonsaiRec.downAt = performance.now() - window.__bonsaiRec.t0;
    };
    document.addEventListener("pointerdown", window.__bonsaiOnDown, true);

    const soil = Array.from(
      document.querySelectorAll('svg[aria-label*="bonsai tree"] ellipse'),
    ).find((e) =>
      ["#7a4f2a", "#c4a878"].includes(e.getAttribute("fill") ?? ""),
    );

    window.__bonsaiTick = () => {
      const rec = window.__bonsaiRec;
      const now = performance.now() - rec.t0;
      rec.frames.push(now);
      if (soil) rec.fills.push([now, getComputedStyle(soil).fill]);
      if (now < ms) requestAnimationFrame(window.__bonsaiTick);
    };
    requestAnimationFrame(window.__bonsaiTick);
  }, durationMs);
}

/**
 * Returns, for the window after the interaction started:
 *   jankyFrames      frame gaps over 25ms — dropped frames at 60Hz
 *   longestFrameMs   the worst single gap
 *   colourSteps      distinct soil colours the transition actually rendered
 *   biggestStepGapMs largest jump between two colours — what reads as a "step"
 */
async function stopRecording(page) {
  return page.evaluate(() => {
    const rec = window.__bonsaiRec;
    document.removeEventListener("pointerdown", window.__bonsaiOnDown, true);

    const start = rec.downAt ?? 0;
    const frames = rec.frames.filter((f) => f >= start);
    const gaps = frames.slice(1).map((f, i) => f - frames[i]);

    const steps = [];
    let last = "";
    for (const [t, fill] of rec.fills) {
      if (t < start || fill === last) continue;
      last = fill;
      steps.push(t - start);
    }
    const stepGaps = steps.slice(1).map((t, i) => t - steps[i]);

    return {
      biggestStepGapMs: stepGaps.length ? Math.max(...stepGaps) : null,
      colourSteps: steps.length,
      jankyFrames: gaps.filter((g) => g > 25).length,
      longestFrameMs: gaps.length ? Math.max(...gaps) : 0,
    };
  });
}

/**
 * Chrome's cumulative timers. The split matters: this bug looked like a React
 * problem and was entirely paint, so a regression here is worth seeing.
 */
async function readTimers(cdp) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  const byName = Object.fromEntries(metrics.map((m) => [m.name, m.value]));
  return {
    layout: byName.LayoutDuration,
    recalcStyle: byName.RecalcStyleDuration,
    script: byName.ScriptDuration,
    task: byName.TaskDuration,
  };
}

function timerSplit(before, after) {
  const ms = (key) => (after[key] - before[key]) * 1000;
  const task = ms("task");
  return {
    paintMs: Math.round(task - ms("script") - ms("layout") - ms("recalcStyle")),
    scriptMs: Math.round(ms("script")),
  };
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

async function measureWater(page, cdp) {
  const tree = await page.locator(TREE_SELECTOR).first().boundingBox();
  if (!tree) throw new Error("No tree found in the garden");
  await page.mouse.move(IDLE_POINT.x, IDLE_POINT.y);
  await page.waitForTimeout(300);

  const before = await readTimers(cdp);
  await startRecording(page, 500);
  await page.mouse.move(tree.x + tree.width / 2, tree.y + tree.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(550);
  await page.mouse.up();
  const after = await readTimers(cdp);

  return { ...(await stopRecording(page)), ...timerSplit(before, after) };
}

async function measureNav(page, cdp) {
  await page.mouse.move(IDLE_POINT.x, IDLE_POINT.y);
  await page.waitForTimeout(600);
  const trigger = page
    .locator('nav[aria-label="Main navigation"]')
    .locator("button", { hasText: "Projects" });
  const box = await trigger.boundingBox();
  if (!box) throw new Error("Projects nav trigger not visible");

  const before = await readTimers(cdp);
  await startRecording(page, 800);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 12,
  });
  await page.waitForTimeout(850);
  const after = await readTimers(cdp);

  return { ...(await stopRecording(page)), ...timerSplit(before, after) };
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function loadGarden(page, base, disableFix) {
  await page.mouse.move(IDLE_POINT.x, IDLE_POINT.y);
  await page.goto(`${base}/bonsai`, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ json, key }) => localStorage.setItem(key, json), {
    json: JSON.stringify(makeState(OPTIONS.species, OPTIONS.days)),
    key: BONSAI_KEY,
  });
  await page.reload({ waitUntil: "load" });
  await page.mouse.move(IDLE_POINT.x, IDLE_POINT.y);
  await page.getByTitle("Water trees").waitFor();
  await page.waitForTimeout(1200);
  await page.getByTitle("Water trees").click();

  if (disableFix) {
    await page.evaluate((selector) => {
      const style = document.createElement("style");
      style.textContent = `${selector} { will-change: auto !important; }`;
      document.head.append(style);
    }, TREE_SELECTOR);
  }
  await page.waitForTimeout(500);
}

function report(scenario, s) {
  const steps =
    scenario === "water"
      ? ` colour steps ${String(s.colourSteps).padStart(2)}` +
        ` biggest step gap ${String(Math.round(s.biggestStepGapMs ?? 0)).padStart(3)}ms`
      : "";
  console.log(
    `  ${scenario.padEnd(6)} janky frames ${String(s.jankyFrames).padStart(2)}` +
      ` longest ${String(Math.round(s.longestFrameMs)).padStart(3)}ms` +
      ` paint ${String(s.paintMs).padStart(4)}ms` +
      ` script ${String(s.scriptMs).padStart(3)}ms${steps}`,
  );
}

async function main() {
  const base = `http://localhost:${getPort()}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: "light",
    reducedMotion: "no-preference",
    viewport: { height: 900, width: 1280 },
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");

  console.log(
    `\n${OPTIONS.species.length} trees at day ${OPTIONS.days}: ${OPTIONS.species.join(", ")}`,
  );

  // Fix-disabled first so the "shipped" numbers are the last thing printed.
  const runs = OPTIONS.compare
    ? [
        { disableFix: true, label: "fix disabled" },
        { disableFix: false, label: "shipped" },
      ]
    : [{ disableFix: false, label: "shipped" }];

  for (const { disableFix, label } of runs) {
    await loadGarden(page, base, disableFix);
    const nodes = await page.evaluate(
      () => document.querySelectorAll("svg *").length,
    );
    console.log(`\n${label} — ${nodes} SVG nodes`);
    report("water", await measureWater(page, cdp));
    report("nav", await measureNav(page, cdp));
  }

  console.log("");
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

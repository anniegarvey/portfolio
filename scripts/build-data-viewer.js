#!/usr/bin/env node
// build-data-viewer.js — reads build-data/runs.ndjson and writes build-data/viewer.html.
// Outputs a file://wsl.localhost/... URL for opening directly in a browser.

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");

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

const mainRepo = getMainRepo();
const dataFile = path.join(mainRepo, "build-data", "runs.ndjson");

let runs = [];
if (fs.existsSync(dataFile)) {
  const lines = fs
    .readFileSync(dataFile, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);
  runs = lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

const dataJson = JSON.stringify(runs);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Build Lifecycle Metrics</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f1117;
    --surface: #1a1d27;
    --border: #2a2d3a;
    --text: #e2e8f0;
    --muted: #7c8490;
    --accent: #818cf8;
    --success: #4ade80;
    --fail: #f87171;
    --warn: #facc15;
    --pre-commit: #818cf8;
    --pre-push: #34d399;
    --post-checkout: #fb923c;
    --other: #94a3b8;
  }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
    font-size: 13px;
    line-height: 1.6;
    padding: 2rem;
    min-height: 100vh;
  }
  h1 { font-size: 1.4rem; font-weight: 600; color: var(--accent); margin-bottom: 0.25rem; }
  .subtitle { color: var(--muted); margin-bottom: 2rem; font-size: 0.85rem; }

  /* Stats row */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }
  .stat-label { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: 1.6rem; font-weight: 700; margin-top: 0.25rem; }
  .stat-value.good { color: var(--success); }
  .stat-value.bad { color: var(--fail); }
  .stat-value.neutral { color: var(--text); }

  /* Chart */
  .chart-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 2rem;
  }
  .chart-title { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
  .chart-wrap { overflow-x: auto; }
  svg text { font-family: inherit; }

  /* Legend */
  .legend { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--muted); }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* Filters */
  .filters { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center; }
  .filter-label { color: var(--muted); font-size: 0.75rem; margin-right: 0.25rem; }
  button {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
    border-radius: 20px;
    padding: 0.25rem 0.85rem;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.75rem;
    transition: border-color 0.1s, color 0.1s;
  }
  button:hover { border-color: var(--accent); color: var(--text); }
  button.active { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }

  /* Table */
  .table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: var(--bg);
    color: var(--muted);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.6rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
  th:hover { color: var(--text); }
  th .sort-indicator { margin-left: 0.25em; opacity: 0.4; }
  th.sorted .sort-indicator { opacity: 1; color: var(--accent); }
  td {
    padding: 0.55rem 1rem;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: color-mix(in srgb, white 2%, var(--surface)); }
  .tag {
    display: inline-block;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  .status-ok { color: var(--success); }
  .status-fail { color: var(--fail); }

  /* Duration bar */
  .dur-cell { display: flex; align-items: center; gap: 0.5rem; }
  .dur-bar-bg { flex: 1; height: 4px; background: var(--border); border-radius: 2px; min-width: 60px; max-width: 120px; }
  .dur-bar { height: 100%; border-radius: 2px; }

  .empty { color: var(--muted); text-align: center; padding: 3rem; font-size: 0.9rem; }
  .count { color: var(--muted); font-size: 0.75rem; margin-left: auto; }
</style>
</head>
<body>
<h1>Build Lifecycle Metrics</h1>
<p class="subtitle" id="subtitle">Loading…</p>

<div class="stats" id="stats"></div>

<div class="chart-section">
  <div class="chart-title">Duration over time</div>
  <div class="chart-wrap" id="chart"></div>
  <div class="legend" id="legend"></div>
</div>

<div class="filters">
  <span class="filter-label">Filter:</span>
  <div id="filter-btns"></div>
  <span class="count" id="row-count"></span>
</div>
<div class="table-wrap">
  <table id="runs-table">
    <thead>
      <tr>
        <th data-col="ts">Timestamp <span class="sort-indicator">↕</span></th>
        <th data-col="hook">Hook <span class="sort-indicator">↕</span></th>
        <th data-col="durationMs">Duration <span class="sort-indicator">↕</span></th>
        <th data-col="exitCode">Status <span class="sort-indicator">↕</span></th>
        <th data-col="git.branch">Branch <span class="sort-indicator">↕</span></th>
        <th data-col="git.stagedFiles">Staged <span class="sort-indicator">↕</span></th>
        <th data-col="git.commit">Commit <span class="sort-indicator">↕</span></th>
        <th data-col="git.worktree">Worktree <span class="sort-indicator">↕</span></th>
      </tr>
    </thead>
    <tbody id="runs-body"></tbody>
  </table>
</div>

<script>
const RUNS = ${dataJson};

const HOOK_COLORS = {
  'pre-commit':    '#818cf8',
  'pre-push':      '#34d399',
  'post-checkout': '#fb923c',
};
function hookColor(h) { return HOOK_COLORS[h] || '#94a3b8'; }

function fmt(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(1) + 's';
}
function fmtTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function get(obj, path) {
  return path.split('.').reduce((o,k) => (o ?? {})[k], obj);
}
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a,b)=>a-b);
  const m = Math.floor(s.length/2);
  return s.length % 2 ? s[m] : (s[m-1]+s[m])/2;
}
function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a,b)=>a-b);
  return s[Math.ceil(s.length * p / 100) - 1];
}

// ── State ──────────────────────────────────────────────────────────────────
let activeFilter = 'all';
let sortCol = 'ts';
let sortDir = -1; // -1 = desc

// ── Stats ──────────────────────────────────────────────────────────────────
function renderStats() {
  const el = document.getElementById('stats');
  if (!RUNS.length) { el.innerHTML = ''; return; }

  const durations = RUNS.map(r => r.durationMs).filter(x => x != null);
  const successRate = Math.round(RUNS.filter(r => r.exitCode === 0).length / RUNS.length * 100);

  const cards = [
    { label: 'Total runs',    value: RUNS.length,            cls: 'neutral' },
    { label: 'Success rate',  value: successRate + '%',      cls: successRate >= 90 ? 'good' : successRate >= 70 ? 'neutral' : 'bad' },
    { label: 'Median duration', value: fmt(median(durations)), cls: 'neutral' },
    { label: 'P95 duration',  value: fmt(pct(durations, 95)), cls: 'neutral' },
  ];

  // Per-hook medians
  const hooks = [...new Set(RUNS.map(r => r.hook))].sort();
  for (const h of hooks) {
    const d = RUNS.filter(r => r.hook === h).map(r => r.durationMs).filter(x => x != null);
    cards.push({ label: h + ' median', value: fmt(median(d)), cls: 'neutral', color: hookColor(h) });
  }

  el.innerHTML = cards.map(c => \`
    <div class="stat">
      <div class="stat-label">\${esc(c.label)}</div>
      <div class="stat-value \${c.cls}" style="\${c.color ? 'color:'+c.color : ''}">\${esc(String(c.value))}</div>
    </div>
  \`).join('');
}

// ── Chart ──────────────────────────────────────────────────────────────────
function renderChart() {
  const el = document.getElementById('chart');
  const lg = document.getElementById('legend');
  if (!RUNS.length) { el.innerHTML = '<p class="empty">No data yet</p>'; lg.innerHTML=''; return; }

  const sorted = [...RUNS].sort((a,b) => a.ts < b.ts ? -1 : 1);
  const hooks = [...new Set(sorted.map(r => r.hook))].sort();
  const maxMs = Math.max(...sorted.map(r => r.durationMs ?? 0), 1);
  const W = Math.max(600, sorted.length * 24 + 80);
  const H = 140;
  const padL = 52, padR = 16, padT = 12, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Y-axis ticks (up to 4 nice labels)
  function niceMax(v) {
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const norm = v / mag;
    const r = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return r * mag;
  }
  const yMax = niceMax(maxMs);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * yMax));

  function xPos(i) { return padL + (i / Math.max(sorted.length - 1, 1)) * innerW; }
  function yPos(ms) { return padT + innerH - (ms / yMax) * innerH; }

  let svg = \`<svg viewBox="0 0 \${W} \${H}" width="\${W}" height="\${H}" xmlns="http://www.w3.org/2000/svg">\`;

  // Grid lines + y-axis labels
  for (const t of yTicks) {
    const y = yPos(t);
    svg += \`<line x1="\${padL}" y1="\${y}" x2="\${W-padR}" y2="\${y}" stroke="#2a2d3a" stroke-width="1"/>\`;
    svg += \`<text x="\${padL-6}" y="\${y+4}" text-anchor="end" font-size="9" fill="#7c8490">\${fmt(t)}</text>\`;
  }

  // One polyline per hook type
  for (const h of hooks) {
    const pts = sorted
      .map((r, i) => r.hook === h ? \`\${xPos(i)},\${yPos(r.durationMs ?? 0)}\` : null)
      .filter(Boolean);
    if (pts.length < 2) {
      // single point: render a circle
      const r = sorted.find(x => x.hook === h);
      const i = sorted.indexOf(r);
      svg += \`<circle cx="\${xPos(i)}" cy="\${yPos(r.durationMs ?? 0)}" r="3" fill="\${hookColor(h)}" opacity="0.85"/>\`;
    } else {
      // Compute smooth polyline coords only for this hook
      const hPts = sorted
        .map((r, i) => r.hook === h ? { x: xPos(i), y: yPos(r.durationMs ?? 0), ok: r.exitCode === 0 } : null)
        .filter(Boolean);
      const coords = hPts.map(p => \`\${p.x},\${p.y}\`).join(' ');
      svg += \`<polyline points="\${coords}" fill="none" stroke="\${hookColor(h)}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>\`;
      for (const p of hPts) {
        svg += \`<circle cx="\${p.x}" cy="\${p.y}" r="2.5" fill="\${p.ok ? hookColor(h) : '#f87171'}"/>\`;
      }
    }
  }

  // X-axis: show first and last timestamp
  if (sorted.length) {
    const first = sorted[0], last = sorted[sorted.length-1];
    const y = H - 6;
    svg += \`<text x="\${xPos(0)}" y="\${y}" text-anchor="middle" font-size="9" fill="#7c8490">\${fmtTs(first.ts)}</text>\`;
    if (sorted.length > 1) {
      svg += \`<text x="\${xPos(sorted.length-1)}" y="\${y}" text-anchor="middle" font-size="9" fill="#7c8490">\${fmtTs(last.ts)}</text>\`;
    }
  }

  svg += '</svg>';
  el.innerHTML = svg;

  // Legend
  lg.innerHTML = hooks.map(h => \`
    <span class="legend-item">
      <span class="legend-dot" style="background:\${hookColor(h)}"></span>
      \${esc(h)}
    </span>
  \`).join('');
}

// ── Filters ────────────────────────────────────────────────────────────────
function renderFilters() {
  const hooks = [...new Set(RUNS.map(r => r.hook))].sort();
  const filters = ['all', ...hooks];
  const el = document.getElementById('filter-btns');
  el.innerHTML = filters.map(f => \`<button data-f="\${esc(f)}" class="\${f===activeFilter?'active':''}">\${esc(f)}</button>\`).join('');
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    activeFilter = b.dataset.f;
    renderFilters();
    renderTable();
  }));
}

// ── Table ──────────────────────────────────────────────────────────────────
function filteredRuns() {
  let r = RUNS;
  if (activeFilter !== 'all') r = r.filter(x => x.hook === activeFilter);
  return [...r].sort((a,b) => {
    let av = get(a, sortCol), bv = get(b, sortCol);
    if (av == null) av = sortDir > 0 ? Infinity : -Infinity;
    if (bv == null) bv = sortDir > 0 ? Infinity : -Infinity;
    if (typeof av === 'string') return av.localeCompare(bv) * sortDir;
    return (av - bv) * sortDir;
  });
}

function renderTable() {
  const rows = filteredRuns();
  document.getElementById('row-count').textContent = rows.length + ' run' + (rows.length===1?'':'s');

  const maxDur = Math.max(...rows.map(r => r.durationMs ?? 0), 1);
  const tbody = document.getElementById('runs-body');

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">No runs recorded yet. Commit or push something to start collecting data.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const pct = Math.round(((r.durationMs ?? 0) / maxDur) * 100);
    const barColor = (r.durationMs ?? 0) > maxDur * 0.8 ? '#f87171' : (r.durationMs ?? 0) > maxDur * 0.5 ? '#facc15' : hookColor(r.hook);
    const staged = r.git?.stagedFiles != null ? r.git.stagedFiles : '—';
    return \`<tr>
      <td title="\${esc(r.ts)}">\${esc(fmtTs(r.ts))}</td>
      <td><span class="tag" style="background:color-mix(in srgb, \${hookColor(r.hook)} 15%, transparent);color:\${hookColor(r.hook)}">\${esc(r.hook)}</span></td>
      <td>
        <div class="dur-cell">
          <span>\${esc(fmt(r.durationMs))}</span>
          <div class="dur-bar-bg"><div class="dur-bar" style="width:\${pct}%;background:\${barColor}"></div></div>
        </div>
      </td>
      <td class="\${r.exitCode === 0 ? 'status-ok' : 'status-fail'}">\${r.exitCode === 0 ? '✓ pass' : '✗ fail (' + esc(String(r.exitCode)) + ')'}</td>
      <td>\${esc(r.git?.branch ?? '—')}</td>
      <td>\${esc(String(staged))}</td>
      <td>\${esc(r.git?.commit ?? '—')}</td>
      <td>\${esc(r.git?.worktree ?? '—')}</td>
    </tr>\`;
  }).join('');
}

// ── Sort headers ───────────────────────────────────────────────────────────
document.querySelectorAll('th[data-col]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (sortCol === col) { sortDir *= -1; }
    else { sortCol = col; sortDir = col === 'ts' ? -1 : 1; }
    document.querySelectorAll('th[data-col]').forEach(h => h.classList.remove('sorted'));
    th.classList.add('sorted');
    th.querySelector('.sort-indicator').textContent = sortDir > 0 ? '↑' : '↓';
    renderTable();
  });
});

// ── Subtitle ───────────────────────────────────────────────────────────────
function renderSubtitle() {
  const sub = document.getElementById('subtitle');
  if (!RUNS.length) {
    sub.textContent = 'No data yet — run a pre-commit or pre-push hook to start collecting.';
    return;
  }
  const latest = [...RUNS].sort((a,b) => a.ts < b.ts ? 1 : -1)[0];
  sub.textContent = RUNS.length + ' run' + (RUNS.length===1?'':'s') + '  ·  last: ' + fmtTs(latest.ts);
}

// ── Init ───────────────────────────────────────────────────────────────────
renderSubtitle();
renderStats();
renderChart();
renderFilters();
renderTable();

// Default sort: newest first
document.querySelector('th[data-col="ts"]').classList.add('sorted');
document.querySelector('th[data-col="ts"] .sort-indicator').textContent = '↓';
</script>
</body>
</html>`;

const outDir = path.join(mainRepo, "build-data");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "viewer.html");
fs.writeFileSync(outPath, html);

// WSL-compatible file URL
const wslPath = outPath.replace(
  /^\/home\//,
  "file://wsl.localhost/Ubuntu/home/",
);
console.log(`\nViewer written to: ${wslPath}\n`);

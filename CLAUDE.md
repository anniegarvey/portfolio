# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server (auto-selects an available port, written to .port)
pnpm kill-server    # stop ONLY this worktree's dev server (reads .port). NEVER use `pkill -f next` — it kills every worktree's server
pnpm build        # production build
pnpm test         # unit tests (vitest, single run)
pnpm lint         # biome check (errors on warnings)
pnpm lint:theme   # flag extreme-end fixed greys in border/background that need light-dark() (next-yak templates Biome can't see)
pnpm format       # biome format --write
pnpm validate     # full suite: lint --fix + lint:theme + tsc + vitest + playwright
pnpm validate:smart  # smart suite: only runs checks relevant to staged files (used by pre-commit)

# Run a single unit test file
pnpm vitest run src/hooks/useDayPlan.test.ts

# E2E tests
pnpm playwright test              # headless
pnpm playwright test --ui         # interactive UI mode
pnpm playwright show-report       # view last report

# Mutation tests (run after unit test changes)
pnpm stryker run --mutate "src/path/to/file.ts"  # 80%+ kill rate expected
```

**Hooks**: pre-commit runs `validate:smart`; pre-push runs `pnpm test`.

WSL browser fix for E2E debugging: `npx @dbalabka/chrome-wsl`

## Architecture

**Next.js 16 app** (`src/app/`) with React 19, TypeScript, [next-yak](https://github.com/DigitecGalaxus/next-yak) for CSS-in-JS that works in Server Components, and React Compiler enabled.

### Route structure

| Route | Feature |
|---|---|
| `/` | Portfolio home (hero, projects, about) |
| `/energy-planner` | Energy Planner app |
| `/bonsai` | Bonsai Garden game |
| `/projects/energy-planner`, `/projects/bonsai`, etc. | Project showcase pages |

### Feature modules

Each feature lives under `src/lib/<feature>/`:

**`src/lib/energy-planner/`** — schema (Zod), storage (IndexedDB via idb-keyval), context (React), utils  
**`src/lib/bonsai/`** — schema, storage, context, growth engine, shop/inventory/pruning modules, SVG tree generator  
**`src/lib/points/`** — cross-cutting currency shared between Energy Planner and Bonsai; handles localStorage persistence, particle animations, and sound

Feature-specific React hooks live in `src/hooks/` (all Energy Planner domain logic). Feature-specific components live in `src/components/energy-planner/` and `src/components/bonsai/`.

### Data flow (Energy Planner)

`schema.ts` (Zod types) → `storage.ts` (idb-keyval IndexedDB) → `hooks/use*.ts` (state management) → `lib/energy-planner/context.tsx` (React context) → components

All state is client-side; no server-side data fetching in feature pages.

### Domain vocabulary

See `CONTEXT.md` for canonical terms (Activity, Planned instance, Projected instance, Day plan, Zone, etc.). Use these exact terms in code, issues, and tests — don't invent synonyms.

### Testing

- Unit tests co-located with source (`*.test.ts` / `*.test.tsx`), run with vitest + jsdom
- E2E tests in `e2e/` by feature area (`energy-planner/`, `bonsai/`, `navigation/`)
- IndexedDB is mocked via `fake-indexeddb`; `src/lib/energy-planner/__mocks__/storage.ts` for unit tests
- Coverage thresholds enforced per-file; see `vitest.config.ts`
- Flaky tests tracked in `e2e/FLAKY_TESTS.md`
- `scripts/validate-map.json` maps source globs to e2e directories for smart validation

---

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgement on trivial tasks.

## 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at the repo root + `docs/adr/`. See `docs/agents/domain.md`.

# Portfolio Project Memory

## Precommit hook runs `pnpm validate`
Runs: `tsc --noEmit && pnpm lint --fix && pnpm test && pnpm playwright test`

## Linting (Biome)
- `--error-on-warnings` is set, so warnings are treated as errors
- Rule `useComponentExportOnlyModules`: components and non-components (hooks, context, utils) must be in **separate files**
  - Add `// biome-ignore lint/style/useComponentExportOnlyModules: <reason>` for exceptions (e.g. Next.js metadata exports, test helpers)
- Rule applies to test files too — unexported helper components need biome-ignore

## Coverage (Vitest, perFile: true)
- Thresholds per file: lines 87%, statements 85.5%, branches 70%, functions 77.77%
- `// v8 ignore next` comments can exclude unreachable lines (e.g. `createContext` no-op defaults)
- Every new source file needs an accompanying test file
- New user-facing behaviour must also be covered by an e2e Playwright test in `/e2e`

## Dark Mode
- Uses CSS `light-dark()` function with `color-scheme: dark light` on `:root`
- Theme overrides: `html[data-theme="dark"] { color-scheme: dark }` / `html[data-theme="light"] { color-scheme: light }`
- FOUC prevention: inline `<script>` in `<head>` reads localStorage and sets `data-theme` before paint
- `ThemeProvider` at `src/components/ThemeProvider/` — context, provider, hook in separate files

## Flaky Tests
- Known flaky tests are logged in `e2e/FLAKY_TESTS.md` with symptom, suspected root cause, and failure count
- Use the `/log-flaky-test` skill whenever a Playwright test fails intermittently — even if it passes on retry

## Testing Patterns
- Clear `localStorage` and `document.documentElement.removeAttribute("data-theme")` in `beforeEach` when testing theme-related components
- Navigation tests use `renderWithTheme()` helper that wraps with `ThemeProvider`

## Tech Stack
- Next.js (App Router), TypeScript, next-yak (CSS-in-JS, styled-components syntax)
- Radix UI primitives, Lucide React icons
- Vitest + Testing Library for unit tests, Playwright for e2e
- Biome for linting/formatting, pnpm as package manager

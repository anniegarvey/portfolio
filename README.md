# Portfolio

This is a [Next.js](https://nextjs.org) app, using [Next Yak](https://github.com/DigitecGalaxus/next-yak) for styled components supporting Server components.

## Getting Started

Use `nvm` to pick up the correct node version.

Install dependencies:
```bash
pnpm i
```

Run dev server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Use https://github.com/dbalabka/chrome-wsl `npx @dbalabka/chrome-wsl` to fix Antigravity browser debugging connection

## Testing

Unit tests:
```bash
pnpm test
```

E2E tests (Playwright):
```bash
# Run all tests headlessly
pnpm playwright test

# View last test report
pnpm playwright show-report
```

Useful flags: `--ui`, `--debug`, `--headed`, `--update-snapshots`

Mutation tests (Stryker, moved out of agent instructions for now because it kept crashing Antigravity):
- CI runs mutation tests on every pull request for the changed source files, caching results between pushes. Scores appear in the job summary; aim for at least 80% of mutants killed. Run the same check locally with `pnpm mutate`.

## Hosting

[Render](https://dashboard.render.com/web/srv-d60d317gi27c73c7ohm0/events)

[Deployed site](https://portfolio-g818.onrender.com/energy-planner)


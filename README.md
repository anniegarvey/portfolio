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
npx playwright test

# View last test report
npx playwright show-report
```

Useful flags: `--ui`, `--debug`, `--headed`

Mutation tests (Stryker, moved out of agent instructions for now because it kept crashing Antigravity):
- After any source code or unit test changes, check unit test quality using mutation tests `pnpm stryker run`, passing the changed file paths in the `--mutate` option, eg `--mutate "src/**/*.js", "a.js"`. At least 80% of mutants should be killed.

## Hosting

[Render](https://dashboard.render.com/web/srv-d60d317gi27c73c7ohm0/events)

[Deployed site](https://portfolio-g818.onrender.com/energy-planner)


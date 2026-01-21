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

# Run in headed mode (visible browser)
npx playwright test --headed

# Run with UI mode for debugging
npx playwright test --ui

# View last test report
npx playwright show-report
```

Possible hosting options: https://supabase.com/pricing, https://render.com/pricing or https://railway.com/pricing

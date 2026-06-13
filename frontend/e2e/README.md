# End-to-End Tests (Playwright)

This directory contains Playwright-based end-to-end tests that validate full user workflows across the frontend and backend.

Requirements
- Node >= 18
- Install Playwright browsers: `npx playwright install`
- Ensure frontend dev server runs on `http://localhost:8080` (Playwright can start Vite automatically)
- Ensure backend runs on `http://localhost:5000` or set `VITE_BACKEND_URL` in `.env.test`

Quickstart
1. Install dependencies:

```bash
npm install
npx playwright install
```

2. Run tests (headless):

```bash
npm run test:e2e
```

3. Run tests in headed mode:

```bash
npm run test:e2e:headed
```

4. View HTML report after a run:

```bash
npm run test:e2e:report
```

Structure
- `e2e/pages/` - Page objects
- `e2e/fixtures/` - Test data and fixtures
- `e2e/utils/` - Helpers (file generation, SSE parsing)
- `e2e/tests/` - Test suites

Notes
- Configure `.env.test` for test environment variables. Copy `.env.test` to `.env.test.local` to override locally (this file is gitignored).
- Global setup connects to the test database and can seed test data.

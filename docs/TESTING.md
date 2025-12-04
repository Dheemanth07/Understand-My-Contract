# Testing Overview
This document outlines the testing strategy for the "Understand My Contract" application, which includes unit, integration, and end-to-end (E2E) tests to ensure code quality, functionality, and reliability.

## Test Types

### Unit Tests
Unit tests focus on individual components and functions in isolation. We use Jest and React Testing Library for the frontend, and Jest with Supertest for the backend.

- **Location**: 
  - Frontend: `src/__tests__/`
  - Backend: `backend/__tests__/`
- **Coverage**: We enforce a **70% minimum** threshold for branches, functions, lines, and statements.
- **Commands**:
  - `npm test`: Run all unit tests for the respective (frontend/backend) project.
  - `npm run test:watch`: Run tests in watch mode.
  - `npm run test:coverage`: Generate a coverage report.

### End-to-End (E2E) Tests
E2E tests simulate full user workflows from start to finish. We use Playwright to run tests across multiple browsers.

- **Location**: `e2e/tests/`
- **Browsers**: Chromium, Firefox, WebKit.
- **Commands**:
  - `npm run test:e2e`: Run all E2E tests headlessly.
  - `npm run test:e2e:ui`: Run E2E tests with the Playwright UI.
  - `npm run test:e2e:headed`: Run E2E tests in headed mode.

## Coverage Requirements
The 70% coverage threshold is automatically enforced in our CI/CD pipeline, as configured in `jest.config.js` and `backend/jest.config.js`. If a pull request causes coverage to drop below this limit, the build will fail.

To view the coverage report locally, run `npm run test:coverage` in either the root or `backend/` directory and open the `coverage/lcov-report/index.html` file in your browser.

## Running Tests Locally
1. **Environment Setup**: Ensure you have a `.env` file in the root directory and `backend/` directory. Use the `.env.example` files as a template.
2. **Install Dependencies**: Run `npm install` in both the root and `backend/` directories.
3. **Run Unit Tests**:
   - `npm test` (for frontend)
   - `cd backend && npm test` (for backend)
4. **Run E2E Tests**:
   - You may need a local instance of MongoDB running.
   - Run `npm run test:e2e` from the root directory.

## CI/CD Testing
All tests are automatically executed on every push and pull request to `main` and `develop` branches via GitHub Actions (`.github/workflows/ci.yml`). The pipeline includes jobs for:
- Linting and type-checking
- Unit testing (frontend and backend)
- E2E testing (on a matrix of browsers)
- Build validation

Test results, logs, and artifacts (like Playwright traces) are uploaded for inspection on failed runs.

## Writing Tests
When adding new features, please include corresponding tests.
- **Unit Tests**: Follow existing patterns in files like `src/__tests__/lib/utils.test.ts` or `backend/__tests__/helpers/summarizeSection.test.js`.
- **E2E Tests**: Use established patterns from `e2e/tests/auth.spec.ts`.

## Test Utilities
We have several test helpers and mocks available to streamline test creation:
- **Frontend**: `src/__tests__/utils/` (e.g., `testHelpers.tsx`, `supabaseMock.ts`)
- **Backend**: `backend/testUtils/` (e.g., `testHelpers.js`, `mocks.js`)
- **E2E**: `e2e/utils/` and `e2e/fixtures/` (e.g., API helpers, authentication fixtures)

Refer to these directories for utilities that can simplify your test setup.

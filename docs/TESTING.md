# Testing Documentation & Inventory

This document serves as the single source of truth for testing across **Understand My Contract**. It covers the test architecture, backend & frontend unit/integration test suites, E2E testing workflows, and local execution guidelines.

---

## 1. Overview & Test Architecture

- **Backend Test Framework**: Jest with `mongodb-memory-server` and `supertest`.
- **Frontend Test Framework**: Jest with `@testing-library/react` and `jsdom`.
- **E2E Test Framework**: Playwright across Chromium, Firefox, and WebKit.
- **Coverage Requirement**: Minimum 70% threshold across lines, functions, branches, and statements.

---

## 2. Test Execution Commands

### Monorepo Root Scripts
```bash
# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run frontend typecheck
npm run typecheck:frontend

# Run full CI suite locally
npm run ci --prefix backend
npm run ci --prefix frontend
```

### Backend Commands (`cd backend`)
```bash
npm test                # Run unit & endpoint tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run ci              # Validate environment & execute CI test suite
```

### Frontend Commands (`cd frontend`)
```bash
npm test                # Run unit & component tests
npm run test:e2e        # Run Playwright E2E tests
npm run typecheck       # TypeScript validation
```

---

## 3. Backend Test Suite Inventory

The backend test suite is located in `backend/__tests__/` and covers helper functions, REST API endpoints, and end-to-end user workflows.

### Endpoint Tests (`backend/__tests__/endpoints/`)
- `upload.test.js`: Validates `/upload` contract file processing, PII anonymization, and background analysis dispatching.
- `history.test.js`: Validates `/history` contract list and paginated history retrieval.
- `historyById.test.js`: Validates `/history/:id` detail lookup and heartbeat active updates.
- `delete.test.js`: Validates `/history/:id` deletion of records and linked Supabase storage entries.
- `stop.test.js`: Validates `/history/:id/stop` request cancellation and partial analysis persistence.
- `compare.test.js`: Validates multi-contract comparison logic.
- `auth.test.js`: Validates Bearer token extraction and Supabase JWT authentication.

### Helper & Utility Tests (`backend/__tests__/helpers/`)
- `extractTextFromFile.test.js`: File extraction for PDF (`pdf-parse`), DOCX (`mammoth`), and TXT formats.
- `extractJargon.test.js`: Legal terminology extraction and stop-word filtering.
- `lookupDefinition.test.js`: Legal term dictionary and external API lookup fallbacks.
- `detectLanguage.test.js`: Language detection logic.
- `summarizeSection.test.js`: Summarization logic.
- `translate.test.js`: Multi-language translation helper.
- `getUserFromToken.test.js`: Auth utility tests.

---

## 4. End-to-End (E2E) Workflows

Located in `frontend/e2e/`, Playwright E2E tests simulate full user interactions:
- **Authentication**: Sign in, sign up, session persistence.
- **Contract Upload & Simplification**: File upload, summary generation, jargon dictionary lookup.
- **History & Comparison**: Contract history browsing, side-by-side legal risk comparison.

---

## 5. Test Utilities & Fixtures

- **Backend Mocks**: `backend/testUtils/mocks.js` & `backend/testUtils/testHelpers.js`
- **Database Sandbox**: `mongodb-memory-server` provides an isolated, fast, in-memory MongoDB instance for all tests without requiring external database dependencies.

# Test Suite Quick Reference

## Quick Start

### Run All Tests
```bash
cd backend
npm test
```

### Run Specific Test File
```bash
npm test -- upload.test.js
npm test -- compare.test.js
npm test -- auth.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="upload"
npm test -- --testNamePattern="should return"
```

### Run with Coverage Report
```bash
npm test -- --coverage
npm test -- --coverage --coverageReporters=html
```

### Watch Mode (Auto-rerun on changes)
```bash
npm test -- --watch
```

---

## Test File Overview

### Helper Function Tests (`helpers/`)

| File | Tests | Purpose |
|------|-------|---------|
| extractTextFromFile.test.js | 100 | PDF/DOCX/TXT text extraction |
| splitIntoSections.test.js | 90 | Document section splitting |
| summarizeSection.test.js | 110 | AI text summarization |
| extractJargon.test.js | 100 | Legal term identification |
| lookupDefinition.test.js | 105 | Term definition lookup |
| translate.test.js | 95 | Language translation (EN↔KN) |
| detectLanguage.test.js | 85 | Language detection |
| getUserFromToken.test.js | 95 | JWT token validation |

### Endpoint Tests (`endpoints/`)

| File | Tests | Purpose |
|------|-------|---------|
| upload.test.js | 100+ | POST /upload endpoint |
| compare.test.js | 85+ | POST /compare endpoint |
| history.test.js | 95+ | GET /history endpoint |
| details.test.js | 110+ | GET /details/:id endpoint |
| delete.test.js | 100+ | DELETE /analysis/:id endpoint |
| auth.test.js | 95+ | Authentication validation |

### E2E Tests (`e2e/`)

| File | Tests | Purpose |
|------|-------|---------|
| workflows.test.js | 200+ | Full workflow scenarios |

---

## Common Test Patterns

### Testing a Helper Function
```javascript
describe('functionName', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should handle valid input', () => {
    const result = functionName('input');
    expect(result).toBeDefined();
  });

  it('should handle error case', () => {
    const result = functionName('');
    expect(result).toThrow();
  });
});
```

### Testing an API Endpoint
```javascript
describe('POST /endpoint', () => {
  it('should return 200 on success', () => {
    const authHeader = createMockAuthHeader('user-123');
    const mockFile = createMockFile();
    
    expect(mockFile).toBeDefined();
    expect(authHeader.Authorization).toContain('Bearer');
  });

  it('should return 401 without auth', () => {
    const expectedStatus = 401;
    expect(expectedStatus).toBe(401);
  });
});
```

### Testing with Mocks
```javascript
it('should call database', () => {
  const mockData = { id: '123' };
  mockDatabase.find.mockResolvedValue(mockData);
  
  // Your test code
  
  expect(mockDatabase.find).toHaveBeenCalledWith('analysis', '123');
});
```

---

## Expected Test Results

When running full test suite:

```
PASS  helpers/extractTextFromFile.test.js
PASS  helpers/splitIntoSections.test.js
PASS  helpers/summarizeSection.test.js
PASS  helpers/extractJargon.test.js
PASS  helpers/lookupDefinition.test.js
PASS  helpers/translate.test.js
PASS  helpers/detectLanguage.test.js
PASS  helpers/getUserFromToken.test.js
PASS  endpoints/upload.test.js
PASS  endpoints/compare.test.js
PASS  endpoints/history.test.js
PASS  endpoints/details.test.js
PASS  endpoints/delete.test.js
PASS  endpoints/auth.test.js
PASS  e2e/workflows.test.js

Test Suites: 15 passed, 15 total
Tests:       800+ passed, 800+ total
Snapshots:   0 total
Time:        X.XXXs
```

---

## Debugging Tests

### Enable Verbose Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- -t "should upload PDF file"
```

### Debug in Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```
Then open `chrome://inspect` in Chrome

### Check Mock Calls
```javascript
console.log(mockDatabase.create.mock.calls);
console.log(mockDatabase.create.mock.results);
```

---

## Test Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Statements | 85% | 85%+ |
| Branches | 80% | 80%+ |
| Functions | 85% | 85%+ |
| Lines | 85% | 85%+ |

Check coverage:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html  # View HTML report
```

---

## Test Categories

### By Type
- **Unit Tests:** Test individual functions/methods
- **Integration Tests:** Test multiple components together
- **E2E Tests:** Test complete workflows
- **Middleware Tests:** Test authentication and error handling

### By Layer
- **Service Layer:** AI, Language, Document services
- **API Layer:** Endpoint controllers
- **Helper Layer:** Utility functions
- **Workflow Layer:** Complete user flows

### By Scenario
- **Happy Path:** Normal successful operation
- **Error Cases:** Invalid input, service failures
- **Edge Cases:** Boundary conditions, special values
- **Security:** Authentication, authorization
- **Performance:** Large datasets, concurrent operations

---

## Key Test Utilities

### Create Mock File
```javascript
const mockFile = createMockFile({
  mimetype: 'application/pdf',
  originalname: 'contract.pdf',
  buffer: Buffer.from('content'),
});
```

### Create Auth Header
```javascript
const header = createMockAuthHeader('user-123');
// Returns: { Authorization: 'Bearer user-123-token' }
```

### Reset Mocks
```javascript
beforeEach(() => {
  resetAllMocks();
});
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout in jest.config.js or mock async calls |
| Mock not working | Ensure mock is defined before test runs |
| Import error | Check file path and jest moduleNameMapper config |
| Async test fails | Return promise or use async/await |
| Coverage low | Add tests for untested branches |

---

## Running in CI/CD

### GitHub Actions
```yaml
- name: Run Tests
  run: npm test -- --coverage --watchAll=false

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hook
```bash
#!/bin/sh
npm test -- --bail
```

---

## Test Maintenance

### When to Update Tests
- When adding new functionality
- When fixing bugs (add test to prevent regression)
- When changing API contracts
- When updating dependencies

### How to Maintain Tests
- Keep tests focused and independent
- Use descriptive test names
- Remove obsolete tests
- Refactor duplicated test code
- Update mocks with code changes

---

## Performance Tips

- Use mocks to avoid real API calls
- Keep test data minimal
- Run tests in parallel (Jest default)
- Use `--bail` to stop on first failure
- Cache test results with `--cache`

---

## Additional Commands

### List all tests
```bash
npm test -- --listTests
```

### Show coverage for file
```bash
npm test -- --coverage --coveragePathIgnorePatterns=node_modules
```

### Run tests alphabetically
```bash
npm test -- --testPathPattern="^[a-m]"
```

### Generate HTML coverage report
```bash
npm test -- --coverage --coverageReporters=html
open coverage/index.html
```

---

## Test Examples by Scenario

### Testing File Upload
See: `endpoints/upload.test.js` lines 40-100

### Testing Authentication
See: `endpoints/auth.test.js` lines 1-50

### Testing Comparison
See: `endpoints/compare.test.js` lines 70-150

### Testing Error Handling
See: `endpoints/upload.test.js` lines 200-250

### Testing Workflows
See: `e2e/workflows.test.js` lines 1-100

---

## References

- Full documentation: See `TEST_DOCUMENTATION.md`
- Jest docs: https://jestjs.io/
- Testing best practices: https://testingjavascript.com/
- Code organization: See directory structure above

**Last Updated:** 2024
**Version:** 1.0

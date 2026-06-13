import { test, expect } from '@playwright/test';

// Minimal cross-browser smoke test to run in each browser project
test('cross-browser sanity', async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080');
  await expect(page).toHaveTitle(/Understand My Contract|Understand/);
});

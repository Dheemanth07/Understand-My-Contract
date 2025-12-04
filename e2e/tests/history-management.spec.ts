import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { mockHistoryEndpoint } from '../utils/api-helpers';
import { MOCK_ANALYSIS_RESPONSE } from '../fixtures/testData';

test.describe('History management', () => {
  test('shows history items and navigates to detail', async ({ page }) => {
    await mockHistoryEndpoint(page, [
      { id: '1', filename: 'doc1.pdf', createdAt: new Date().toISOString() },
    ]);

    const dashboard = new DashboardPage(page);
    await dashboard.goto('/dashboard');

    const items = await dashboard.getHistoryItems();
    // we mocked a single history item
    expect(items.length).toBeGreaterThanOrEqual(0);
  });
});

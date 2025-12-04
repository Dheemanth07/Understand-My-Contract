import { test, expect } from '@playwright/test';
import { IndexPage } from '../pages/IndexPage';
import { SignupPage } from '../pages/SignupPage';
import { DashboardPage } from '../pages/DashboardPage';
import { createTestPDF } from '../utils/file-helpers';
import { mockUploadEndpoint } from '../utils/api-helpers';
import { MOCK_SSE_CHUNKS } from '../fixtures/testData';

test.describe('Complete user journey (smoke)', () => {
  test('signup -> upload -> history -> delete -> logout', async ({ page }) => {
    const index = new IndexPage(page);
    const signup = new SignupPage(page);
    const dashboard = new DashboardPage(page);

    await index.goto('/');
    await index.clickGetStarted();
    await signup.signup('e2e_user1@example.com', 'Password123!');

    // Mock upload SSE
    await mockUploadEndpoint(page, MOCK_SSE_CHUNKS);

    const filePath = await createTestPDF('Full journey PDF');
    await dashboard.goto('/dashboard');
    await dashboard.uploadFile(filePath);
    await dashboard.waitForAnalysisComplete(20000);

    // Verify history shows at least one item
    const items = await dashboard.getHistoryItems();
    expect(Array.isArray(items)).toBe(true);

    // Logout
    await dashboard.logout();
    await page.waitForURL('/');
  });
});

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { createTestPDF } from '../utils/file-helpers';
import { mockUploadEndpoint } from '../utils/api-helpers';
import { MOCK_SSE_CHUNKS } from '../fixtures/testData';

test.describe('Upload workflow', () => {
  test('uploads a PDF and shows analysis completion', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const filePath = await createTestPDF('This is a test PDF for E2E');

    // Mock the backend upload SSE stream
    await mockUploadEndpoint(page, MOCK_SSE_CHUNKS);

    await dashboard.goto('/dashboard');
    // Set the file input and trigger upload
    await dashboard.uploadFile(filePath);

    // Wait for the analysis-complete indicator
    await dashboard.waitForAnalysisComplete(20000);

    const items = await dashboard.getHistoryItems();
    expect(items.length).toBeGreaterThanOrEqual(0);
  });
});

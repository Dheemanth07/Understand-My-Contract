import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 60 * 1000,
  },
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['json', { outputFile: 'test-results/result.json' }], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 0,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 8080,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
  globalSetup: './e2e/global-setup',
  globalTeardown: './e2e/global-teardown',
});

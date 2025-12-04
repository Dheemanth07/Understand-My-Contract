import { test as base } from '@playwright/test';

// This fixture provides helpers to mock external APIs from the browser context
export const test = base.extend<{
  mockHuggingFace: (response?: any) => Promise<void>;
  mockDictionaryAPI: (response?: any) => Promise<void>;
}>({
  mockHuggingFace: async ({ page }, use) => {
    async function mock(response = { summary_text: 'Mock summary' }) {
      await page.route('https://router.huggingface.co/**', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([response]) });
      });
    }

    await use(mock);
  },

  mockDictionaryAPI: async ({ page }, use) => {
    async function mock(response = { meanings: [{ definitions: [{ definition: 'Mock definition' }] }] }) {
      await page.route('https://api.dictionaryapi.dev/**', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([response]) });
      });
    }

    await use(mock);
  },
});

export { expect } from '@playwright/test';

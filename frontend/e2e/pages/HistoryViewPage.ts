import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HistoryViewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async getDocumentTitle() {
    return this.page.textContent('[data-testid="document-title"]');
  }

  async getSections() {
    return this.page.$$eval('[data-testid="section"]', (els) =>
      els.map((el) => ({
        original: el.querySelector('[data-testid="section-original"]')?.textContent || '',
        summary: el.querySelector('[data-testid="section-summary"]')?.textContent || '',
      }))
    );
  }

  async getGlossary() {
    return this.page.$$eval('[data-testid="glossary-item"]', (els) =>
      els.map((el) => ({ term: el.querySelector('.term')?.textContent || '', definition: el.querySelector('.def')?.textContent || '' }))
    );
  }
}

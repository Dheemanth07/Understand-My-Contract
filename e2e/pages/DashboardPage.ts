import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async uploadFile(filePath: string) {
    const input = await this.page.$('input[type=file]');
    if (!input) throw new Error('File input not found');
    await input.setInputFiles(filePath);
    await this.page.click('button[data-testid="upload-button"]');
  }

  async waitForAnalysisComplete(timeout = 60000) {
    await this.page.waitForSelector('[data-testid="analysis-complete"]', { timeout });
  }

  async getHistoryItems() {
    return this.page.$$eval('[data-testid="history-item"]', (els) => els.map((e) => (e.textContent || '').trim()));
  }

  async clickHistoryItem(text: string) {
    await this.page.click(`text=${text}`);
    await this.page.waitForLoadState('networkidle');
  }

  async deleteHistoryItem(text: string) {
    await this.page.click(`text=${text} >> button[data-testid="delete"]`);
    await this.page.click('button[data-testid="confirm-delete"]');
  }

  async logout() {
    await this.page.click('button[data-testid="logout"]');
  }
}

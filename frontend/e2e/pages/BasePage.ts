import { Page, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080';
  }

  async goto(path = '/') {
    await this.page.goto(`${this.baseURL}${path}`);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getPageTitle() {
    return this.page.title();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
  }

  async waitForToast(message: string) {
    await this.page.waitForSelector(`text=${message}`);
  }
}

import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SigninPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async signin(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  async getErrorMessage() {
    const el = await this.page.locator('.error, [data-testid="error"]');
    return el.textContent();
  }
}

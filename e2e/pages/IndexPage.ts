import { BasePage } from './BasePage';
import { Page } from '@playwright/test';

export class IndexPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async clickGetStarted() {
    await this.page.click('text=Get Started');
  }

  async clickSignIn() {
    await this.page.click('text=Sign in');
  }

  async isHeroVisible() {
    return this.page.isVisible('[data-testid="hero"]');
  }
}

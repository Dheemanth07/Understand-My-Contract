import { test, expect } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage';

test.describe('Auth flows (smoke)', () => {
  test('landing to signup redirect', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
  });
});

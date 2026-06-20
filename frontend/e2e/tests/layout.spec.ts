import { test } from '@playwright/test';

test('inspect computed layout styles on dashboard', async ({ page }) => {
  // Go to signin page
  await page.goto('http://localhost:8081/signin');

  // Fill credentials
  await page.fill('input[type="email"]', 'dheemanth1007@gmail.com');
  await page.fill('input[type="password"]', 'dheemanth123');

  // Submit and wait for redirect to dashboard
  await Promise.all([
    page.click('button:has-text("Sign In")'),
    page.waitForURL('**/dashboard'),
  ]);

  console.log('--- Successfully logged in and redirected to dashboard ---');

  // Wait for page to settle
  await page.waitForTimeout(2000);

  // Inspect computed styles of main layout components
  const styles = await page.evaluate(() => {
    const getStyles = (el: Element | null) => {
      if (!el) return null;
      const comp = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        width: comp.width,
        height: comp.height,
        maxWidth: comp.maxWidth,
        maxHeight: comp.maxHeight,
        padding: comp.padding,
        margin: comp.margin,
        display: comp.display,
        position: comp.position,
        overflow: comp.overflow,
        overflowY: comp.overflowY,
      };
    };

    return {
      html: getStyles(document.documentElement),
      body: getStyles(document.body),
      root: getStyles(document.getElementById('root')),
      dashboard: getStyles(document.querySelector('.h-screen.bg-slate-50') || document.querySelector('.flex.h-screen')),
      main: getStyles(document.querySelector('main')),
    };
  });

  console.log('COMPUTED STYLES OUTPUT:');
  console.log(JSON.stringify(styles, null, 2));
});

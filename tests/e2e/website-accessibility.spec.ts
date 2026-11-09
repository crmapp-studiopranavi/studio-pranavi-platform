import { test, expect } from '@playwright/test';

test.describe('Accessibility basics', () => {
  const pages = [
    '/',
    '/projects',
    '/expertise',
    '/studio/about',
    '/studio/process',
    '/catalogue',
    '/collections',
    '/contact',
    '/start-a-project',
  ];

  for (const path of pages) {
    test(`${path} has a level-1 heading`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const h1s = page.getByRole('heading', { level: 1 });
      const count = await h1s.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  }

  test('homepage has skip-to-content link', async ({ page }) => {
    await page.goto('/');
    const skip = page.getByRole('link', { name: /skip/i });
    await expect(skip).toBeAttached();
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Responsive layout', () => {
  test('homepage is usable at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('mobile nav menu works at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobileNav).toBeVisible();
    await mobileNav.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects/);
  });
});

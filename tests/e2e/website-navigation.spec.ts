import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('homepage loads with correct heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('essence of light');
  });

  test('site header contains all nav links', async ({ page }) => {
    await page.goto('/');
    // Desktop: nav links in Main navigation; Mobile: links in Mobile navigation (opened by hamburger)
    const desktopNav = page.getByRole('navigation', { name: 'Main navigation' });
    const isDesktop = (await desktopNav.count()) > 0;
    if (isDesktop) {
      await expect(desktopNav.getByRole('link', { name: 'Projects' })).toBeAttached();
      await expect(desktopNav.getByRole('link', { name: 'Expertise' })).toBeAttached();
      await expect(desktopNav.getByRole('link', { name: 'Studio' })).toBeAttached();
      await expect(desktopNav.getByRole('link', { name: 'Contact' })).toBeAttached();
    } else {
      // On mobile, open the hamburger and verify links exist in mobile nav
      await page.getByRole('button', { name: 'Open menu' }).click();
      const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
      await expect(mobileNav.getByRole('link', { name: 'Projects', exact: true })).toBeAttached();
      await expect(mobileNav.getByRole('link', { name: 'Expertise' })).toBeAttached();
      await expect(mobileNav.getByRole('link', { name: 'Contact' })).toBeAttached();
    }
  });

  test('Start a Project link goes to /start-a-project', async ({ page }) => {
    await page.goto('/');
    const links = page.getByRole('link', { name: 'Start a Project' });
    const href = await links.first().getAttribute('href');
    expect(href).toContain('/start-a-project');
  });

  test('skip to content link is present and accessible', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /skip to/i });
    await expect(skipLink).toBeAttached();
  });

  test('mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: 'Open menu' });
    await menuButton.click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).not.toBeVisible();
  });
});

test.describe('Direct-link navigation', () => {
  test('/projects loads correctly', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/expertise loads correctly', async ({ page }) => {
    await page.goto('/expertise');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/studio/about loads correctly', async ({ page }) => {
    await page.goto('/studio/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/studio/craftsmanship loads correctly', async ({ page }) => {
    await page.goto('/studio/craftsmanship');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/studio/materials loads correctly', async ({ page }) => {
    await page.goto('/studio/materials');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/studio/process loads correctly', async ({ page }) => {
    await page.goto('/studio/process');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/catalogue loads correctly', async ({ page }) => {
    await page.goto('/catalogue');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/collections loads correctly', async ({ page }) => {
    await page.goto('/collections');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/contact loads correctly', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('/start-a-project loads correctly', async ({ page }) => {
    await page.goto('/start-a-project');
    await expect(page).toHaveURL(/start-a-project/);
    // Form should be present
    await expect(page.getByRole('form').or(page.locator('form'))).toBeVisible();
  });
});

test.describe('Legacy redirects', () => {
  test('/portfolio redirects to /projects', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page).toHaveURL(/\/projects/);
  });

  test('/services redirects to /expertise', async ({ page }) => {
    await page.goto('/services');
    await expect(page).toHaveURL(/\/expertise/);
  });

  test('/about redirects to /studio/about', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL(/\/studio\/about/);
  });

  test('/get-a-quote redirects to /start-a-project', async ({ page }) => {
    await page.goto('/get-a-quote');
    await expect(page).toHaveURL(/\/start-a-project/);
  });

  test('/studio redirects to /studio/about', async ({ page }) => {
    await page.goto('/studio');
    await expect(page).toHaveURL(/\/studio\/about/);
  });
});

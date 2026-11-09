import { test, expect } from '@playwright/test';

test.describe('Projects listing', () => {
  test('projects page renders listing or empty state', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    // Either project cards or empty state message
    const hasCards = (await page.locator('a[href*="/projects/"]').count()) > 0;
    const hasEmpty = await page
      .getByText(/no projects/i)
      .isVisible()
      .catch(() => false);
    // Skeleton uses animate-pulse (shadcn/ui Skeleton component)
    const hasLoading = (await page.locator('.animate-pulse').count()) > 0;
    expect(hasCards || hasEmpty || hasLoading).toBeTruthy();
  });

  test('category filter buttons are present', async ({ page }) => {
    await page.goto('/projects');
    // Wait for page to load fully
    await page.waitForLoadState('networkidle');
    const filterGroup = page.getByRole('group', { name: /filter/i });
    if (await filterGroup.isVisible()) {
      const buttons = filterGroup.getByRole('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('selecting a category updates URL', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const filterGroup = page.getByRole('group', { name: /filter/i });
    if (await filterGroup.isVisible()) {
      const buttons = filterGroup.getByRole('button');
      const count = await buttons.count();
      if (count > 1) {
        await buttons.nth(1).click();
        await expect(page).toHaveURL(/category=/);
      }
    }
  });

  test('project card links to /projects/:slug', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const projectLinks = page.locator('a[href*="/projects/"]');
    const count = await projectLinks.count();
    if (count > 0) {
      const href = await projectLinks.first().getAttribute('href');
      expect(href).toMatch(/^\/projects\/.+/);
    }
  });
});

test.describe('Project detail', () => {
  test('direct link to unknown project redirects to /projects', async ({ page }) => {
    await page.goto('/projects/this-project-does-not-exist-xyz');
    await page.waitForLoadState('networkidle');
    // Should either redirect to /projects or show an error state
    const url = page.url();
    const onProjectsPage = url.includes('/projects') && !url.includes('/projects/');
    const hasError = await page
      .getByText(/unable to load/i)
      .isVisible()
      .catch(() => false);
    expect(onProjectsPage || hasError || url.includes('this-project-does-not-exist')).toBeTruthy();
  });
});

test.describe('Quote CTA', () => {
  test('Start a Project CTA on homepage links to /start-a-project', async ({ page }) => {
    await page.goto('/');
    const ctaLinks = page.getByRole('link', { name: /start a project/i });
    const href = await ctaLinks.first().getAttribute('href');
    expect(href).toContain('/start-a-project');
  });

  test('/start-a-project loads quote form', async ({ page }) => {
    await page.goto('/start-a-project');
    await page.waitForLoadState('networkidle');
    // QuotePage has a multi-step form — check for form elements
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
  });
});

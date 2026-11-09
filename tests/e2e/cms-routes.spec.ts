/**
 * CMS route smoke tests — verify that CMS pages exist in the router and redirect
 * unauthenticated users to /login (ProtectedRoute guard), confirming each route
 * is wired up correctly.
 */
import { test, expect } from '@playwright/test';

const CMS_ROUTES = [
  '/cms/pages',
  '/cms/media',
  '/cms/services',
  '/cms/projects',
  '/cms/collections',
  '/cms/catalogue',
  '/cms/testimonials',
  '/cms/navigation',
  '/cms/seo',
];

test.describe('CMS route guards (unauthenticated)', () => {
  for (const route of CMS_ROUTES) {
    test(`${route} redirects unauthenticated user to /login`, async ({ page }) => {
      await page.goto(route);
      // ProtectedRoute redirects to /login when no session
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });
  }
});

test.describe('CMS page sections route', () => {
  test('/cms/pages/:id/sections redirects unauthenticated to /login', async ({ page }) => {
    await page.goto('/cms/pages/00000000-0000-0000-0000-000000000001/sections');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

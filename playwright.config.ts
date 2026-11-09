import { defineConfig, devices } from '@playwright/test';

const WEBSITE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const CRM_URL = process.env.E2E_CRM_URL ?? 'http://localhost:5174';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: WEBSITE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/cms-routes.spec.ts'],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: ['**/cms-routes.spec.ts'],
    },
    {
      name: 'crm-chromium',
      use: { ...devices['Desktop Chrome'], baseURL: CRM_URL },
      testMatch: ['**/cms-routes.spec.ts'],
    },
    {
      name: 'crm-mobile',
      use: { ...devices['Pixel 5'], baseURL: CRM_URL },
      testMatch: ['**/cms-routes.spec.ts'],
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev:website',
        url: WEBSITE_URL,
        reuseExistingServer: true,
        timeout: 30000,
      },
});

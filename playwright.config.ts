import { defineConfig, devices } from '@playwright/test';

const config = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1 --port 3000',
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:3000',
    timeout: 120_000,
  },
});

export default config;

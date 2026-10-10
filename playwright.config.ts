import { defineConfig, devices } from '@playwright/test';

const requestedPort = process.env.PLAYWRIGHT_TEST_PORT ?? '3000';
const webServerPort = /^\d{1,5}$/.test(requestedPort) ? requestedPort : '3000';

const config = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: `http://127.0.0.1:${webServerPort}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm dev --hostname 127.0.0.1 --port ${webServerPort}`,
    reuseExistingServer: !process.env.CI,
    url: `http://127.0.0.1:${webServerPort}`,
    timeout: 120_000,
  },
});

export default config;

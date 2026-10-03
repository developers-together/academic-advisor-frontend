import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 10 * 1000 },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { channel: 'chrome' },
    },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: 'e2e/.auth/student.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3100 --host 127.0.0.1 --strictPort',
    url: 'http://127.0.0.1:3100',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_APP_ENABLE_API_MOCKING: 'false',
      VITE_APP_APP_MOCK_API_PORT: '8080',
    },
  },
});

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  testMatch: 'grouped-parity.spec.ts',
  outputDir: './test-results/grouped-parity',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5191',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || 'chrome',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run gallery:dev -- --host 127.0.0.1 --port 5191 --strictPort',
    url: 'http://127.0.0.1:5191/',
    reuseExistingServer: true,
    timeout: 30_000
  }
});

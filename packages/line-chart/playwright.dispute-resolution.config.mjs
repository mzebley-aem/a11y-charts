import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './browser-tests',
  testMatch: 'dispute-resolution.spec.ts',
  outputDir: '../../tmp/dispute-resolution/test-results',
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5195', browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || 'chrome', viewport: { width: 1440, height: 1000 } },
  webServer: { command: 'npm run gallery:dev -- --port 5195', url: 'http://127.0.0.1:5195/', reuseExistingServer: true },
});

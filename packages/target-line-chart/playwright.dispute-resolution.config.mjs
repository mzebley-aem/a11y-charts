import { defineConfig } from '@playwright/test';
import { docsServer } from './playwright.docs-server.mjs';
export default defineConfig({
  testDir: './browser-tests',
  testMatch: 'dispute-resolution.spec.ts',
  outputDir: '../../tmp/dispute-resolution/test-results',
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5195', browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || 'chrome', viewport: { width: 1440, height: 1000 } },
  webServer: docsServer(5195),
});

import { defineConfig } from '@playwright/test';
import { docsServer } from './playwright.docs-server.mjs';

export default defineConfig({
  testDir: './browser-tests',
  testMatch: 'theme-tokens.spec.ts',
  outputDir: './test-results/theme-tokens',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5192',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || 'chrome',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure'
  },
  webServer: docsServer(5192),
});

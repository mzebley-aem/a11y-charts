import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  outputDir: 'test-results/artifacts',
  testMatch: 'artifacts.spec.ts',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5190',
    browserName: 'chromium',
    ...(process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL } : {}),
    viewport: { width: 1000, height: 800 }
  },
  webServer: {
    command: 'node scripts/serve-packed-artifacts.mjs',
    url: 'http://127.0.0.1:5190/',
    reuseExistingServer: false
  }
});

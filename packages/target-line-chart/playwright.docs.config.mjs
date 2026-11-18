import { defineConfig } from '@playwright/test';
import { docsServer } from './playwright.docs-server.mjs';

// Browser tests for the built docs site (docs/dist): every page's live examples,
// the Examples pages and their settings panels, the report prototypes' shells,
// and an accessibility sweep. Build the docs first with `npm run docs:build`.
// Runs in any browser: set PLAYWRIGHT_BROWSER to chromium, firefox, or webkit.
const browserName = process.env.PLAYWRIGHT_BROWSER || 'chromium';

export default defineConfig({
  testDir: './browser-tests',
  testMatch: ['docs-examples.spec.ts', 'examples.spec.ts', 'docs-accessibility.spec.ts'],
  outputDir: `../../tmp/docs/test-results/${browserName}`,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5196',
    browserName,
    // Like the general suite: Playwright's own Chromium unless a channel is named.
    ...(browserName === 'chromium' && process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL } : {}),
    viewport: { width: 1280, height: 900 },
  },
  webServer: docsServer(5196),
});

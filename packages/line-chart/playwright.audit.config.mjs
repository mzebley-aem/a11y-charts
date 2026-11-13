import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  outputDir: `test-results/${process.env.PLAYWRIGHT_BROWSER || 'chromium'}`,
  // These specs need other servers and run through their own configs.
  testIgnore: ['artifacts.spec.ts', 'grouped-parity.spec.ts', 'theme-tokens.spec.ts', 'segmented.spec.ts', 'dispute-resolution.spec.ts', 'spp-apr.spec.ts'],
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5189',
    browserName: process.env.PLAYWRIGHT_BROWSER || 'chromium',
    ...((!process.env.PLAYWRIGHT_BROWSER || process.env.PLAYWRIGHT_BROWSER === 'chromium') && process.env.PLAYWRIGHT_CHROMIUM_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL }
      : {}),
    viewport: { width: 1000, height: 800 }
  },
  webServer: {
    command: 'vite --config vite.audit.config.mjs',
    url: 'http://127.0.0.1:5189/packages/line-chart/browser-tests/fixture.html',
    reuseExistingServer: !process.env.CI
  }
});

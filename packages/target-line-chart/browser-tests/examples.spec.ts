import { expect, test, type Page } from '@playwright/test';
import { builtPages } from './docs-pages.js';

// The docs Examples pages (formerly the chart gallery) and the report prototype
// shells, against the built docs site. Runs in Chromium, Firefox, and WebKit.

const widths = [320, 375, 390, 480, 640, 768, 1024, 1280, 1440];
const initialLinkNavigationKey = (page: Page) =>
  page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';

const pageErrors = new WeakMap<Page, string[]>();

/**
 * Waits for a page's network activity to finish before the test moves on. Starlight
 * loads its search UI after the page loads; leaving mid-load cancels that import,
 * which Firefox reports as a console error.
 */
const settled = (page: Page) => page.waitForLoadState('networkidle');

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`);
  });
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), 'No browser or console errors').toEqual([]);
});

const examplePages = { line: '/examples/target-line-charts/', bar: '/examples/bar-charts/' } as const;

for (const kind of ['line', 'bar'] as const) {
  test(`${kind} examples page renders five examples`, async ({ page }) => {
    await page.goto(examplePages[kind]);
    const examples = page.locator('.example-entry[data-example-id]');
    await expect(examples).toHaveCount(5);
    for (const example of await examples.all()) {
      await expect(example.locator(`a11y-${kind === 'line' ? 'target-line' : kind}-chart .a11y-${kind === 'line' ? 'target-line' : kind}-chart__title`)).toBeVisible();
      if (kind === 'line') await expect(example.locator('a11y-target-line-chart canvas').first()).toBeVisible();
      else await expect(example.locator('a11y-bar-chart .a11y-bar-chart__bar').first()).toBeVisible();
    }
  });

  test(`${kind} example settings affect only their example and reset cleanly`, async ({ page }) => {
    await page.goto(examplePages[kind]);
    const examples = page.locator('.example-entry[data-example-id]');
    const example = examples.first();
    const peer = examples.nth(1);
    const chartSelector = `a11y-${kind === 'line' ? 'target-line' : kind}-chart`;
    const startingView = await example.locator(chartSelector).evaluate((chart: any) => chart.config.dataView ?? 'dialog');
    const peerView = await peer.locator(chartSelector).evaluate((chart: any) => chart.config.dataView ?? 'dialog');
    const settings = example.locator('details.chart-example__settings');
    const code = settings.locator('[data-settings-code]');

    await settings.locator('summary').click();
    const nextView = startingView === 'dialog' ? 'inline' : 'dialog';
    await example.getByLabel('Data view').selectOption(nextView);
    await expect.poll(() => example.locator(chartSelector).evaluate((chart: any) => chart.config.dataView)).toBe(nextView);
    await expect(code).toContainText(`dataView: "${nextView}"`);
    await expect(peer.locator(chartSelector).evaluate((chart: any) => chart.config.dataView ?? 'dialog')).resolves.toBe(peerView);

    await example.getByRole('button', { name: 'Reset example', exact: true }).click();
    await expect.poll(() => example.locator(chartSelector).evaluate((chart: any) => chart.config.dataView ?? 'dialog')).toBe(startingView);
    await expect(settings.locator('[data-settings-status]')).toHaveText('Original example restored.');
  });
}

test('settings work by keyboard and chart data opens a labelled modal dialog', async ({ page }) => {
  await page.goto(examplePages.line);
  const example = page.locator('.example-entry[data-example-id]').first();
  const settings = example.locator('details.chart-example__settings');
  const summary = settings.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(settings).toHaveJSProperty('open', true);

  const dataView = example.getByRole('combobox', { name: 'Data view' });
  await expect(dataView).toBeVisible();
  const helpId = await dataView.getAttribute('aria-describedby');
  expect(helpId).toBeTruthy();
  await expect(example.locator(`#${helpId}`)).toBeVisible();

  const dataButton = example.locator('a11y-target-line-chart').getByRole('button', { name: 'View complete data', exact: true });
  await dataButton.focus();
  await page.keyboard.press('Enter');
  const dialog = example.locator('a11y-target-line-chart dialog');
  await expect(dialog).toHaveJSProperty('open', true);
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
  await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
  await expect(dialog.getByRole('heading', { name: 'Chart data' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveJSProperty('open', false);
  await expect(dataButton).toBeFocused();
});

test('example settings controls meet the 44px enhanced target size', async ({ page }) => {
  for (const route of Object.values(examplePages)) {
    await page.goto(route);
    await settled(page);
    for (const details of await page.locator('details.chart-example__settings').all()) {
      await details.evaluate((element: HTMLDetailsElement) => { element.open = true; });
    }
    const undersized = await page
      .locator('.chart-example__settings > summary, .example-setting select, .example-setting-control, .chart-example__reset')
      .evaluateAll(elements => elements
        .filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.height < 44;
        })
        .map(element => ({ text: element.textContent?.trim().slice(0, 50), height: element.getBoundingClientRect().height })));
    expect(undersized, `${route} settings targets under 44px`).toEqual([]);
  }
});

const reflowRoutes = [
  '/examples/target-line-charts/',
  '/examples/bar-charts/',
  '/examples/grouped-bar-charts/',
  '/examples/segmented-bar-charts/',
  '/examples/theme-comparison/',
  '/reports/report-demo/',
];

test('examples and report prototypes reflow across the requested viewport widths', async ({ page }) => {
  test.setTimeout(120_000);
  for (const route of reflowRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await settled(page);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 850 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${route} horizontal overflow at ${width}px`).toBe(false);
    }
  }
});

test('report prototype states its status, uses landmarks, and reflows', async ({ page }) => {
  await page.goto('/reports/report-demo/');
  await expect(page.getByRole('banner', { name: 'Prototype notice' })).toContainText('not an official ADAPT website');
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('group', { name: /Breadcrumb preview/ })).toBeVisible();
  const skipLink = page.getByRole('link', { name: 'Skip to report content' });
  await expect(skipLink).toHaveJSProperty('tabIndex', 0);
  await page.keyboard.press(initialLinkNavigationKey(page));
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#report-content')).toBeFocused();
});

// WCAG 1.4.10 and 1.4.12 together: 320px wide, 200% text, and the maximum text
// spacing. Covers the docs site and its live charts, with settings panels open.
// Content inside a scrolling region, such as the target line chart's plot, is allowed.
const TEXT_SPACING = '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }';

test('docs pages reflow at 320px with enlarged text and spacing', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 320, height: 900 });
  const failures: string[] = [];
  for (const route of builtPages(['reports'])) {
    await page.goto(route);
    await settled(page);
    await page.evaluate(() => document.querySelectorAll('details.chart-example__settings').forEach(details => { (details as HTMLDetailsElement).open = true; }));
    await page.addStyleTag({ content: TEXT_SPACING });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const overflowing = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const clipped = (element: Element) => {
        for (let node: Element | null = element; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath.startsWith('inset(50%')) return true;
          if (node !== element && style.overflowX !== 'visible' && node.getBoundingClientRect().right <= viewport + 0.5) return true;
        }
        return false;
      };
      return [...document.querySelectorAll('body *')]
        .filter(element => element.getBoundingClientRect().width > 0)
        .filter(element => element.getBoundingClientRect().right > viewport + 0.5 && !clipped(element))
        .filter((element, _, all) => ![...element.children].some(child => all.includes(child)))
        .slice(0, 3)
        .map(element => `${element.tagName.toLowerCase()}.${String(element.getAttribute('class') ?? '').split(' ')[0]} "${(element.textContent ?? '').trim().slice(0, 30)}"`);
    });
    if (overflowing.length) failures.push(`${route}: ${overflowing.join(', ')}`);
  }
  expect(failures).toEqual([]);
});

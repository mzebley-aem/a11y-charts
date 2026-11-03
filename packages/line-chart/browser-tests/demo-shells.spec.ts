import { expect, test } from '@playwright/test';

const widths = [320, 375, 390, 480, 640, 768, 1024, 1280, 1440];
const initialLinkNavigationKey = (page: import('@playwright/test').Page) =>
  page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';

test('line development demo exposes a keyboard-activatable skip link, localized controls, and reflows', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/packages/line-chart/demo/dev.html');
  await expect(page.getByRole('link', { name: 'Skip to chart examples' })).toBeAttached();
  const skipLink = page.getByRole('link', { name: 'Skip to chart examples' });
  await expect(skipLink).toHaveJSProperty('tabIndex', 0);
  await page.keyboard.press(initialLinkNavigationKey(page));
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#chart-examples')).toBeFocused();
  await page.locator('[data-demo-locale]').selectOption('fr-FR');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
  await expect(page.locator('#demo-title')).toContainText(/exemples|accessible/i);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 850 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `line demo horizontal overflow at ${width}px`).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('bar demo exposes a keyboard-activatable skip link, localized controls, and reflows', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/packages/bar-chart/demo/index.html');
  await expect(page.getByRole('link', { name: 'Skip to reference cases' })).toBeAttached();
  const skipLink = page.getByRole('link', { name: 'Skip to reference cases' });
  await expect(skipLink).toHaveJSProperty('tabIndex', 0);
  await page.keyboard.press(initialLinkNavigationKey(page));
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#reference-cases')).toBeFocused();
  const notesLink = page.locator('#population-example .a11y-bar-chart__context a[href="#reporting-notes"]').first();
  await expect(notesLink).toBeVisible();
  await notesLink.click();
  await expect(page).toHaveURL(/#reporting-notes$/);
  await expect(page.locator('#reporting-notes')).toBeFocused();
  await page.locator('#locale').selectOption('fr-FR');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
  await expect(page.locator('#page-heading')).not.toHaveText('Horizontal bar chart');
  for (const width of widths) {
    await page.setViewportSize({ width, height: 850 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `bar demo horizontal overflow at ${width}px`).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('report prototype states its status, uses landmarks, and reflows', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/packages/line-chart/demo/report-demo.html');
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
  for (const width of widths) {
    await page.setViewportSize({ width, height: 850 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `report demo horizontal overflow at ${width}px`).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('all active demo routes reflow across the requested viewport widths', async ({ page }) => {
  const routes = [
    '/demo-gallery/index.html',
    '/packages/line-chart/demo/dev.html',
    '/packages/line-chart/demo/index.html',
    '/packages/line-chart/demo/report-demo.html',
    '/packages/bar-chart/demo/index.html'
  ];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 850 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${route} horizontal overflow at ${width}px`).toBe(false);
    }
  }
  expect(errors).toEqual([]);
});

test('shell-owned navigation and configuration targets meet the 44px enhanced target size', async ({ page }) => {
  const cases = [
    {
      route: '/demo-gallery/index.html',
      selector: '.wordmark, .page-footer > a, .gallery-nav a, .example-settings > summary, .gallery-setting label, .reset-button'
    },
    {
      route: '/packages/line-chart/demo/dev.html',
      selector: '.demo-capabilities__controls select, .demo-capabilities__controls button, .demo-options label'
    },
    {
      route: '/packages/bar-chart/demo/index.html',
      selector: '.demo-control-grid select, .demo-control-grid input[type="color"], .demo-control-grid .demo-check'
    }
  ];
  for (const { route, selector } of cases) {
    await page.goto(route);
    const undersized = await page.locator(selector).evaluateAll(elements => elements
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      })
      .map(element => ({ text: element.textContent?.trim().slice(0, 50), rect: element.getBoundingClientRect().toJSON() })));
    expect(undersized, `${route} shell targets under 44px`).toEqual([]);
  }
});

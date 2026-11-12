import { expect, test, type Page } from '@playwright/test';

async function mountBar(page: Page, config: Record<string, unknown> = {}, data?: Array<Record<string, unknown>>) {
  await page.evaluate(({ config, data }) => {
    const chart = document.createElement('a11y-bar-chart');
    Object.assign(chart, {
      chartTitle: 'Service outcomes',
      config: { showDetails: true, ...config },
      total: 10,
      data: data ?? [
        { id: 'alpha', label: 'Alpha', value: 3, target: { min: 2, max: 4 }, definition: 'A plain-language measure.' },
        { id: 'beta', label: 'Beta', value: 1, target: 2, definition: 'A second measure.' },
        { id: 'gamma', label: 'Gamma', value: 0 }
      ]
    });
    document.querySelector('#fixture')!.append(chart);
  }, { config, data });
  await expect(page.locator('a11y-bar-chart .a11y-bar-chart__details-trigger')).toHaveCount(data?.length ?? 3);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/packages/line-chart/browser-tests/fixture.html');
  await page.waitForFunction(() => customElements.get('a11y-bar-chart'));
});

test('bar category buttons expose a full reading and support Arrow/Home/End without trapping Tab', async ({ page }) => {
  await mountBar(page);
  const buttons = page.locator('a11y-bar-chart .a11y-bar-chart__details-trigger');
  const alpha = buttons.nth(0);
  const beta = buttons.nth(1);
  const gamma = buttons.nth(2);
  await expect(alpha).toHaveAccessibleName(/Alpha.*Percentage of total.*30\.00%.*Count.*3.*within the target range.*Definition for Alpha.*Details for Alpha/);
  await expect(alpha).toHaveAttribute('aria-describedby', /details-help/);
  await expect(beta).not.toHaveAttribute('aria-describedby', /details-help/);
  await alpha.focus();
  await page.keyboard.press('ArrowDown');
  await expect(beta).toBeFocused();
  await expect(page.locator('.a11y-bar-chart__details').nth(1)).toBeVisible();
  await page.keyboard.press('Home');
  await expect(alpha).toBeFocused();
  await page.keyboard.press('End');
  await expect(gamma).toBeFocused();
  await expect(gamma).toHaveAccessibleName(/Gamma.*Percentage of total.*0\.00%.*Count.*0/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.a11y-bar-chart__details').nth(2)).toBeHidden();
  await expect(gamma).toBeFocused();
  await page.keyboard.press('Tab');
  await expect.poll(() => gamma.evaluate(button => button.ownerDocument.activeElement?.closest('a11y-bar-chart') === null)).toBe(true);
});

test('bar names distinguish a reported zero, missing value, and privacy suppression', async ({ page }) => {
  await mountBar(page, {}, [
    { id: 'zero', label: 'Reported zero', value: 0 },
    { id: 'missing', label: 'Missing value', value: null, target: 3 }
  ]);
  const chart = page.locator('a11y-bar-chart');
  const triggers = chart.locator('.a11y-bar-chart__details-trigger');
  await expect(triggers.nth(0)).toHaveAccessibleName(/Reported zero.*Percentage of total.*0\.00%.*Count.*0/);
  await expect(triggers.nth(1)).toHaveAccessibleName(/Missing value.*Not reported/);
  await chart.evaluate((element: any) => {
    element.suppressed = true;
    element.data = [{ id: 'protected', label: 'Protected value', value: 0, target: 2, targetSuppressed: true }];
  });
  await expect(chart.locator('.a11y-bar-chart__details-trigger'))
    .toHaveAccessibleName(/Protected value.*target suppressed.*comparison unavailable/);
  await expect(chart.locator('.a11y-bar-chart__details-trigger'))
    .not.toHaveAccessibleName(/0\.00%/);
});

test('bar previews, pins, follows keyboard focus, and keeps dismissal on the active category', async ({ page }) => {
  await mountBar(page);
  const chart = page.locator('a11y-bar-chart');
  const rows = chart.locator('.a11y-bar-chart__row');
  const alpha = chart.locator('.a11y-bar-chart__details-trigger').nth(0);
  const beta = chart.locator('.a11y-bar-chart__details-trigger').nth(1);
  await rows.nth(0).hover();
  await expect(chart.locator('.a11y-bar-chart__details').nth(0)).toBeVisible();
  await alpha.click();
  await expect(alpha).toHaveAttribute('aria-pressed', 'true');
  await rows.nth(1).hover();
  await expect(chart.locator('.a11y-bar-chart__details').nth(0)).toBeVisible();
  await expect(chart.locator('.a11y-bar-chart__details').nth(1)).toBeHidden();
  await beta.focus();
  await expect(chart.locator('.a11y-bar-chart__details').nth(1)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(beta).toBeFocused();
  await expect(chart.locator('.a11y-bar-chart__details').nth(1)).toBeHidden();
});

test('Escape dismissal permits keyboard re-entry while the pointer remains over the category', async ({ page }) => {
  await mountBar(page);
  const chart = page.locator('a11y-bar-chart');
  const trigger = chart.locator('.a11y-bar-chart__details-trigger').first();
  const card = chart.locator('.a11y-bar-chart__details').first();
  await trigger.hover();
  await trigger.focus();
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  await page.locator('#outside').focus();
  await expect(trigger).not.toBeFocused();
  await trigger.focus();
  await expect(card).toBeVisible();
});

test('bar retains logical focus on updates and falls back when details disappear', async ({ page }) => {
  await mountBar(page);
  const chart = page.locator('a11y-bar-chart');
  const beta = chart.locator('.a11y-bar-chart__details-trigger').nth(1);
  await beta.focus();
  await chart.evaluate((element: any) => {
    element.data = [
      { id: 'alpha', label: 'Alpha', value: 3 },
      { id: 'beta', label: 'Beta updated', value: 2 },
      { id: 'gamma', label: 'Gamma', value: 0 }
    ];
  });
  const updatedBeta = chart.locator('.a11y-bar-chart__details-trigger').nth(1);
  await expect(updatedBeta).toBeFocused();
  await expect(updatedBeta).toHaveAccessibleName(/Beta updated/);
  await chart.evaluate((element: any) => { element.data = [{ id: 'alpha', label: 'Alpha', value: 3 }]; });
  await expect(chart.locator('.a11y-bar-chart__details-trigger')).toHaveCount(1);
  await expect(chart.getByRole('button', { name: 'View complete data' })).toBeFocused();
  const alpha = chart.locator('.a11y-bar-chart__details-trigger').first();
  await alpha.focus();
  await chart.evaluate((element: any) => { element.config = { ...element.config, showDetails: false }; });
  await expect(chart.locator('.a11y-bar-chart__details-trigger')).toHaveCount(0);
  await expect(chart.getByRole('button', { name: 'View complete data' })).toBeFocused();
  await chart.evaluate((element: any) => { element.data = [{ id: 'invalid', label: 'Invalid', value: Number.NaN }]; });
  await expect(chart.locator('.a11y-bar-chart__message--error').first()).toBeVisible();
  await expect(page.locator('#outside')).not.toBeFocused();
});

test('bar closes a dialog when its table is hidden and restores focus to a remaining chart action', async ({ page }) => {
  await mountBar(page);
  const chart = page.locator('a11y-bar-chart');
  const dataAction = chart.getByRole('button', { name: 'View complete data' });
  await dataAction.click();
  const dialog = chart.locator('dialog');
  await expect(dialog).toBeVisible();
  await chart.evaluate((element: any) => { element.config = { ...element.config, tableVisibility: 'hidden' }; });
  await expect(dialog).toHaveJSProperty('open', false);
  await expect(chart.getByRole('button', { name: 'Explain' })).toBeFocused();
});

test('bar visible controls meet 44px target size and outcome labels meet 7:1 contrast', async ({ page }) => {
  await mountBar(page, { dataView: 'inline', targetStyle: 'color-and-texture' });
  const result = await page.locator('a11y-bar-chart').evaluate(chart => {
    const targets = [...chart.querySelectorAll<HTMLElement>(
      '.a11y-bar-chart__action, .a11y-bar-chart__glossary-toggle, .a11y-bar-chart__details-trigger, .a11y-bar-chart__inline-data > summary'
    )].filter(item => item.getClientRects().length);
    const ratios = [...chart.querySelectorAll<HTMLElement>('.a11y-bar-chart__details-outcome')].map(item => {
      const foreground = getComputedStyle(item).color.match(/\d+/g)!.slice(0, 3).map(Number);
      const background = getComputedStyle(item).backgroundColor.match(/\d+/g)!.slice(0, 3).map(Number);
      const luminance = ([r, g, b]: number[]) => [r, g, b]
        .map(value => { const v = value / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
      const a = luminance(foreground), b = luminance(background);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    return { sizes: targets.map(item => ({ width: item.getBoundingClientRect().width, height: item.getBoundingClientRect().height })), ratios };
  });
  expect(result.sizes.length).toBeGreaterThan(0);
  expect(result.sizes.every(size => size.width >= 44 && size.height >= 44)).toBe(true);
  expect(result.ratios.length).toBeGreaterThan(0);
  expect(result.ratios.every(ratio => ratio >= 7)).toBe(true);
});

test('bar details anchor to hover location or keyboard trigger and stay inside the chart', async ({ page }) => {
  await mountBar(page);
  const trigger = page.locator('.a11y-bar-chart__details-trigger').first();
  const card = page.locator('.a11y-bar-chart__details').first();
  const rect = await trigger.boundingBox();
  if (!rect) throw new Error('Missing trigger');
  await trigger.hover({ position: { x: 30, y: rect.height / 2 } });
  await expect(card).toBeVisible();
  let bounds = await card.boundingBox();
  expect(Math.abs(bounds!.x - (rect.x + 30))).toBeLessThan(2);
  await card.hover();
  await page.waitForTimeout(250);
  await expect(card).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(card).toBeHidden();
  await trigger.hover({ position: { x: rect.width - 10, y: rect.height / 2 } });
  bounds = await card.boundingBox();
  expect(bounds!.x).toBeGreaterThan(rect.x + 100);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(rect.x + rect.width + 2);
  await trigger.hover({ position: { x: 50, y: rect.height / 2 } });
  bounds = await card.boundingBox();
  expect(Math.abs(bounds!.x - (rect.x + 50))).toBeLessThan(2);
  await page.screenshot({ path: 'tmp/segmented/bar-anchored-details.png' });
  await page.mouse.move(0, 0);
  await expect(card).toBeHidden();
  await trigger.focus();
  bounds = await card.boundingBox();
  expect(Math.abs(bounds!.x - rect.x)).toBeLessThan(2);
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  await expect(trigger).toBeFocused();
});

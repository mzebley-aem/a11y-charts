import { expect, test } from '@playwright/test';
import { sections } from '../../../demo-gallery/dispute-resolution/data.js';

test('all source counts use their intended denominators without double-counting totals or meetings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const section of sections) {
    await page.goto(`/dispute-resolution/?section=${section.id}`);
    await expect(page.locator('#view-title')).toHaveText(section.title);
    await expect(page.locator('a11y-bar-chart, a11y-segmented-bar-chart')).toHaveCount(section.panels.length);
    for (const panel of section.panels) {
      const chart = page.locator(`#${panel.id} a11y-bar-chart, #${panel.id} a11y-segmented-bar-chart`);
      await expect(chart).toHaveJSProperty('total', panel.base);
      if (panel.rows.length === 1) {
        const comparison = panel.id.endsWith('-meetings');
        expect(await chart.evaluate((element: any) => element.data.map(({ value }: { value: number }) => value))).toEqual(comparison ? [panel.rows[0][1]] : [panel.rows[0][1], panel.base - panel.rows[0][1]]);
      } else {
        await expect(chart).toHaveJSProperty('data', panel.rows.map(([label, value], i) => ({id: `${panel.id}-${i}`, label, value})));
      }
      await expect(chart).toHaveJSProperty('total', panel.base);
    }
  }
  await expect(page.locator('#expedited-placement')).toContainText('30.8%');
  expect(errors).toEqual([]);
});

test('keyboard navigation, deep links, history, display preferences and chart dialogs work', async ({ page }) => {
  await page.goto('/dispute-resolution/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#view-title')).toBeFocused();
  await page.locator('#section-nav [data-section="written"]').click();
  await expect(page.locator('#view-title')).toBeFocused();
  await page.locator('.display-settings summary').click();
  await page.locator('#values').selectOption('counts');
  await page.locator('#pattern').check();
  await expect(page).toHaveURL(/values=counts.*pattern=diagonal/);
  const deepLink = page.url();
  await page.locator('#section-nav [data-section="mediation"]').click();
  await page.goBack();
  await expect(page.locator('#view-title')).toHaveText('Written signed complaints');
  await expect(page.locator('#values')).toHaveValue('counts');
  await page.goto(deepLink);
  await expect(page.locator('#pattern')).toBeChecked();
  await expect(page.locator('a11y-bar-chart').first()).toHaveJSProperty('total', 1284);
  const data = page.locator('a11y-bar-chart').first().getByRole('button', { name: 'Data', exact: true });
  await data.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('table')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(data).toBeFocused();
  const explain = page.locator('a11y-bar-chart').first().getByRole('button', { name: 'Explain', exact: true });
  await explain.click();
  await expect(page.locator('a11y-bar-chart').first().getByRole('button', { name: 'Hide explanation', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await data.click();
  const download = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Download CSV', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
});

test('clipboard failure provides recovery and invalid routes use overview', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('blocked'); } } });
  });
  await page.goto('/dispute-resolution/?section=missing');
  await expect(page.locator('#view-title')).toHaveText('Overview');
  await page.locator('#share').click();
  await expect(page.locator('#share-fallback input')).toBeFocused();
  await expect(page.locator('#share-fallback input')).toHaveValue(page.url());

});

test('all sections reflow, including enlarged text and opened chart settings', async ({ page }) => {
  for (const section of ['overview', ...sections.map(s => s.id)]) {
    await page.goto(`/dispute-resolution/?section=${section}`);
    const settings = page.locator('.display-settings');
    if (await settings.count()) await settings.locator('summary').click();
    for (const width of [320, 375, 390, 480, 640, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});

test('QA-style application menu works on mobile with Escape and enlarged text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/dispute-resolution/');
  const menu = page.locator('#site-menu');
  await expect(page.locator('#app-navigation')).not.toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#app-navigation')).toBeVisible();
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
});

test('all seven single-value panels expose their reported values and usable actions', async ({ page }) => {
  const cases = [
    ['written', 'written-findings', 318, 822, 504],
    ['written', 'written-pending', 43, 251, 208],
    ['dueprocess', 'dueprocess-meetings', 251, 614, null],
    ['dueprocess', 'dueprocess-settlements', 88, 251, 163],
    ['expedited', 'expedited-meetings', 38, 76, null],
    ['expedited', 'expedited-settlements', 12, 38, 26],
    ['expedited', 'expedited-placement', 8, 26, 18],
  ] as const;
  for (const [section, id, value, base, remainder] of cases) {
    await page.goto(`/dispute-resolution/?section=${section}`);
    const chart = page.locator(`#${id} a11y-segmented-bar-chart`);
    await expect(chart).toHaveJSProperty('total', base);
    const values = await chart.evaluate((element: any) => element.data.map((row: any) => row.value));
    expect(values).toEqual(remainder === null ? [value] : [value, remainder]);
    await chart.getByRole('button', { name: 'Data', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('table').locator('tbody tr')).toHaveCount(remainder === null ? 2 : 3);
    await expect(dialog.getByRole('table')).toContainText(String(value));
    if (remainder !== null) await expect(dialog.getByRole('table')).toContainText(String(remainder));
    await page.keyboard.press('Escape');
    await expect(chart.getByRole('button', { name: 'Data', exact: true })).toBeFocused();
  }
});

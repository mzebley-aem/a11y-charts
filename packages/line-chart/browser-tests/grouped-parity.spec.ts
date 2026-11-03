import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const evidence = fileURLToPath(new URL('../../../audit-evidence/2026-10-22/', import.meta.url));
const axeCore = fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url));
mkdirSync(evidence, { recursive: true });

async function openGallery(page: Page): Promise<void> {
  await page.goto('/#grouped-examples');
  await expect(page.locator('#grouped-examples')).toBeVisible();
  await expect(page.locator('#grouped-age a11y-bar-chart-group')).toBeVisible();
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test('desktop keyboard selection, All reset, shared scale, and screenshot fixtures', async ({ page }) => {
  await openGallery(page);
  const age = page.locator('#grouped-age a11y-bar-chart-group');
  await expect(age.getByRole('radio', { name: 'All Ages' })).toBeChecked();
  await age.screenshot({ path: `${evidence}grouped-desktop-age-all.png` });

  const allAges = age.getByRole('radio', { name: 'All Ages' });
  await allAges.focus();
  await allAges.press('ArrowDown');
  await expect(age.getByRole('radio', { name: 'Birth to 1' })).toBeChecked();
  await expect(age.locator('a11y-bar-chart').getByRole('heading', { name: 'Birth to 1' })).toBeVisible();
  await age.getByRole('radio', { name: 'All Ages' }).check();
  await expect(age.getByRole('radio', { name: 'All Ages' })).toBeChecked();

  const settings = page.locator('#grouped-age details.example-settings');
  await settings.locator('summary').click();
  await settings.getByLabel('External report filter').selectOption('on');
  await age.getByRole('radio', { name: 'Birth to 1' }).check();
  await age.getByRole('radio', { name: 'All Ages' }).check();
  await expect(age.locator('a11y-bar-chart').getByText('Filtered', { exact: true })).toBeVisible();

  const race = page.locator('#grouped-race a11y-bar-chart-group');
  const chart = race.locator('a11y-bar-chart');
  await race.screenshot({ path: `${evidence}grouped-desktop-race-all.png` });
  await race.getByRole('radio', { name: 'Black or African American' }).check();
  await expect(chart.getByRole('heading', { name: 'Black or African American' })).toBeVisible();
  expect(await chart.evaluate((element) => (element as HTMLElement & { total: number | null }).total)).toBe(102);
  await expect(chart.getByText(/Percentage of total: 100\.00%/)).toBeVisible();
  await expect(chart.getByText(/There are 102 \(20\.00%\)/).first()).toBeVisible();
  await race.screenshot({ path: `${evidence}grouped-desktop-race-black.png` });
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});

test('multi-section disclosure, persistent chart state, dialog Escape, focus return, and Excel download', async ({ page }) => {
  await openGallery(page);
  const article = page.locator('#grouped-sections');
  const group = article.locator('a11y-bar-chart-group');
  const chart = group.locator('a11y-bar-chart');
  await group.getByRole('button', { name: 'Explain' }).click();
  await expect(group.getByRole('button', { name: 'Hide explanation' })).toHaveAttribute('aria-expanded', 'true');
  await group.getByRole('button', { name: 'Show definitions' }).click();
  await expect(group.getByRole('button', { name: 'Hide definitions' })).toHaveAttribute('aria-expanded', 'true');
  await page.evaluate((element) => { (window as Window & { __persistentChart?: Element }).__persistentChart = element; }, await chart.elementHandle());

  const ageDisclosure = group.getByRole('button', { name: 'Collapse Age range' });
  await group.getByRole('radio', { name: 'Birth to 1' }).check();
  await ageDisclosure.click();
  await expect(group.getByRole('button', { name: 'Expand Age range' })).toHaveAttribute('aria-expanded', 'false');
  expect(await group.evaluate((element) => (element as HTMLElement & { selectedViewId: string }).selectedViewId)).toBe('birth-1');
  await group.getByRole('button', { name: 'Expand Age range' }).click();
  await expect(group.getByRole('radio', { name: 'Birth to 1' })).toBeChecked();
  await group.getByRole('button', { name: 'Collapse Age range' }).click();
  const raceDisclosure = group.getByRole('button', { name: 'Expand Race/ethnicity' });
  await raceDisclosure.click();
  await expect(group.getByRole('radio', { name: 'All Race/Ethnicities' })).toBeChecked();
  expect(await chart.evaluate((element) => (window as Window & { __persistentChart?: Element }).__persistentChart === element)).toBe(true);
  await group.getByRole('radio', { name: 'Black or African American' }).check();
  await expect(chart.getByRole('button', { name: 'Hide explanation' })).toHaveAttribute('aria-expanded', 'true');
  await expect(chart.getByRole('button', { name: 'Hide definitions' })).toHaveAttribute('aria-expanded', 'true');

  const dataTrigger = chart.getByRole('button', { name: 'View complete data' });
  await dataTrigger.focus();
  await dataTrigger.click();
  const dialog = chart.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('caption')).toHaveText('Complete data for Black or African American');
  await page.evaluate((element) => { (window as Window & { __persistentDialog?: Element }).__persistentDialog = element; }, await dialog.elementHandle());
  const downloadWait = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download Excel' }).click();
  const download = await downloadWait;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
  await dialog.getByRole('button', { name: 'Close' }).focus();
  await group.evaluate((element) => { (element as HTMLElement & { selectedViewId: string }).selectedViewId = 'race-all'; });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('caption')).toHaveText('Complete data for All Race/Ethnicities');
  expect(await dialog.evaluate((element) => (window as Window & { __persistentDialog?: Element }).__persistentDialog === element)).toBe(true);
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(dataTrigger).toBeFocused();

  await dataTrigger.click();
  await expect(dialog).toBeVisible();
  await group.evaluate((element) => { (element as HTMLElement & { sections: unknown[] }).sections = []; });
  await expect(dialog).toBeHidden();
  await expect(group.getByText('No population views are available.')).toBeFocused();
  await group.evaluate((element) => {
    (element as HTMLElement & { sections: unknown[] }).sections = [{ id: 'recovery', label: 'Recovery', allViewId: 'recovery-all', views: [{ id: 'recovery-all', label: 'All records', chartTitle: 'All records', data: [{ id: 'record', label: 'Record', value: 1 }], total: 1, filtered: false, suppressed: false }] }];
  });
  await group.getByRole('button', { name: 'View complete data' }).click();
  await expect(dialog).toBeVisible();
  await group.evaluate((element) => {
    (element as HTMLElement & { sections: unknown[] }).sections = [{ id: 'recovery', label: 'Recovery', allViewId: 'duplicate', views: [
      { id: 'duplicate', label: 'One', chartTitle: 'One', data: [], total: 1, filtered: false, suppressed: false },
      { id: 'duplicate', label: 'Two', chartTitle: 'Two', data: [], total: 1, filtered: false, suppressed: false }
    ] }];
  });
  await expect(dialog).toBeHidden();
  await expect(group.getByRole('alert')).toBeFocused();
});

test('320px and 375px reflow, long labels, touch hit areas, and no horizontal overflow', async ({ browser }) => {
  for (const width of [320, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await openGallery(page);
    const group = page.locator('#grouped-race a11y-bar-chart-group');
    const radioLabel = group.locator('label[for]').filter({ hasText: 'Native Hawaiian or Other Pacific Islander' });
    const labelBox = await radioLabel.boundingBox();
    expect(labelBox?.height).toBeGreaterThanOrEqual(44);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    if (width === 320) await group.screenshot({ path: `${evidence}grouped-mobile-320.png` });
    if (width === 375) await group.screenshot({ path: `${evidence}grouped-mobile-375.png` });
    const box = await radioLabel.boundingBox();
    await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(group.getByRole('radio', { name: 'Native Hawaiian or Other Pacific Islander' })).toBeChecked();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await context.close();
  }
});

test('forced colors and reduced motion retain visible selector states', async ({ page }) => {
  await openGallery(page);
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const group = page.locator('#grouped-race a11y-bar-chart-group');
  const selected = group.getByRole('radio', { name: 'All Race/Ethnicities' });
  await expect(selected).toBeChecked();
  await group.screenshot({ path: `${evidence}grouped-forced-colors.png` });
  await selected.focus();
  await expect(selected).toBeFocused();
  expect(await selected.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});

test('axe finds no WCAG 2.1 A/AA violations in the three grouped compositions', async ({ page }) => {
  await openGallery(page);
  await page.addScriptTag({ path: axeCore });
  const violations = await page.evaluate(async () => {
    const axe = (window as Window & { axe: { run: (context: Element, options: unknown) => Promise<{ violations: Array<{ id: string; impact: string; nodes: Array<{ target: string[]; failureSummary: string }> }> }> } }).axe;
    const results = [];
    for (const id of ['grouped-age', 'grouped-race', 'grouped-sections']) {
      results.push(...(await axe.run(document.querySelector(`#${id} a11y-bar-chart-group`)!, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
      })).violations.map((violation) => ({ composition: id, ...violation })));
    }
    return results;
  });
  expect(violations).toEqual([]);
});

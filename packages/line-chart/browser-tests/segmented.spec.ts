import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);

test('keyboard detail cards, data dialog and exports retain the reported comparison', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/segmented/');
  const breakdown = page.locator('#breakdown a11y-segmented-bar-chart');
  const item = breakdown.getByRole('button', { name: /Resolved/ });
  await item.focus();
  await expect(breakdown).toContainText('Requests with a recorded resolution.');
  await page.keyboard.press('Enter');
  await expect(item).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(item).toBeFocused();
  await expect(item).toHaveAttribute('aria-pressed', 'false');
  const comparison = page.locator('#comparison a11y-segmented-bar-chart');
  const data = comparison.getByRole('button', { name: /(?:Data|View complete data)/, exact: true });
  await data.focus(); await page.keyboard.press('Enter');
  const dialog = comparison.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('row', { name: /Meetings held/ })).toContainText('32');
  await expect(dialog).not.toContainText('68');
  await page.keyboard.press('Escape'); await expect(data).toBeFocused();
  await data.click();
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download CSV', exact: true }).click();
  const csv = await readFile(await (await download).path(), 'utf8');
  expect(csv).toContain('Meetings held'); expect(csv).not.toContain('68');
  expect(errors).toEqual([]);
});

test('compact links and detail controls are independent', async ({ page }) => {
  await page.goto('/segmented/');
  const linked = page.locator('#linked a11y-segmented-bar-chart');
  await expect(linked.getByRole('link', { name: /Request status summary/ })).toHaveAttribute('href', '#details');
  await linked.scrollIntoViewIfNeeded();
  const card = await linked.boundingBox();
  if (!card) throw new Error('Compact chart has no layout');
  await page.mouse.click(card.x + card.width - 8, card.y + card.height - 8);
  await expect(page).toHaveURL(/#details$/);
  const interactive = page.locator('#interactive a11y-segmented-bar-chart');
  await expect(interactive.getByRole('link', { name: /Request status details/ })).toHaveAttribute('href', '#details');
  await expect(interactive.getByRole('button', { name: /Resolved/ })).toBeVisible();
});

test('WCAG 2.2 AA automated checks, reflow and forced colors', async ({ page }) => {
  await page.goto('/segmented/');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const scan = () => page.evaluate(async () => (await (window as any).axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => ({ target: n.target, failure: n.failureSummary })) })));
  expect(await scan()).toEqual([]);
  const chart = page.locator('#breakdown a11y-segmented-bar-chart');
  await chart.getByRole('button', { name: 'Explain', exact: true }).click();
  await chart.getByRole('button', { name: 'Glossary', exact: true }).click();
  await chart.getByRole('button', { name: /Withdrawn/ }).focus();
  expect(await scan()).toEqual([]);
  await chart.getByRole('button', { name: 'View complete data' }).click();
  expect(await scan()).toEqual([]);
  await page.keyboard.press('Escape');
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }' });
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  await page.setViewportSize({ width: 320, height: 900 });
  await expect(page.locator('#breakdown').getByRole('button', { name: /Resolved/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('display options localize the chart and availability states do not invent data', async ({ page }) => {
  await page.goto('/segmented/');
  const chart = page.locator('#breakdown a11y-segmented-bar-chart');
  await page.locator('#locale').selectOption('fr-FR');
  await expect(chart.getByRole('heading', { name: 'État des demandes' })).toBeVisible();
  await expect(chart).toContainText('Résolues');
  await page.locator('#theme').selectOption('alternate');
  expect(await chart.evaluate((element: any) => element.theme.segments.resolved.pattern)).toBe('dots');
  await page.locator('#values').selectOption('counts');
  expect(await chart.evaluate((element: any) => [element.config.showCounts, element.config.showPercentages])).toEqual([true, false]);
  await page.locator('#details-toggle').uncheck();
  await expect(chart.getByRole('button', { name: /Résolues/ })).toHaveCount(0);
  await page.locator('#locale').selectOption('es-MX');
  await expect(chart.getByRole('heading', { name: 'Estado de las solicitudes' })).toBeVisible();
  const availability = page.locator('#availability a11y-segmented-bar-chart');
  await expect(availability).toContainText('Suppressed');
  await expect(availability).toContainText('Not reported');
  await expect(availability).not.toContainText('Small group: 0');
  await expect(page.locator('#above a11y-segmented-bar-chart')).toContainText('exceeds');
});

test('localized catalogs cover all component messages and preserve placeholders', async ({ page }) => {
  await page.goto('/segmented/');
  const failures = await page.evaluate(async () => {
    const { catalogs, ENGLISH_MESSAGES } = await import('/segmented/locales.ts');
    const placeholders = (value: string) => [...value.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort().join(',');
    const errors: string[] = [];
    for (const locale of ['fr-FR', 'es-MX']) for (const [key, english] of Object.entries(ENGLISH_MESSAGES)) {
      const translated = catalogs[locale][key];
      if (typeof translated !== 'string' || placeholders(translated) !== placeholders(english as string)) errors.push(`${locale}: ${key}`);
    }
    return errors;
  });
  expect(failures).toEqual([]);
});

test('grouping keeps complete data and supports keyboard details and updates', async ({ page }) => {
  await page.goto('/segmented/');
  const chart = page.locator('#grouping a11y-segmented-bar-chart');
  const other = chart.getByRole('button', { name: /Other categories/ });
  await expect(other).toBeVisible();
  await other.focus();
  await page.keyboard.press('Enter');
  await expect(other).toHaveAttribute('aria-pressed', 'true');
  await expect(chart).toContainText('Delta');
  await expect(chart).toContainText('Epsilon');
  await expect(chart).toContainText('Other');
  await page.keyboard.press('Escape');
  await expect(other).toBeFocused();
  await chart.evaluate((element: any) => { element.data = element.data.map((row: any) => ({ ...row })); });
  await expect(other).toBeFocused();
  await page.locator('#group-update').click();
  await expect(chart).toContainText('27');
  await chart.getByRole('button', { name: 'View complete data' }).click();
  const dialog = chart.getByRole('dialog');
  await expect(dialog.getByRole('row')).toHaveCount(8);
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download CSV', exact: true }).click();
  const csv = await readFile(await (await download).path(), 'utf8');
  expect(csv).toContain('Epsilon');
  expect(csv).not.toContain('Other categories');
  await page.keyboard.press('Escape');
  await page.locator('#group-mode').selectOption('explicit');
  await expect(chart.getByRole('button', { name: /Other categories/ })).toBeVisible();
  await page.locator('#group-pick-options').getByLabel('Alpha').check();
  await expect(chart.getByRole('button', { name: /Alpha/ })).toBeVisible();
  await page.locator('#group-highlight').check();
  await expect(chart).toContainText(/highlighted category/i);
  await page.locator('#group-highlight').uncheck();
  await page.locator('#group-dataset').selectOption('incomplete');
  await expect(chart).toContainText(/Not reported|Suppressed/i);
});

test('grouped detail view passes automated accessibility and reflows', async ({ page }) => {
  await page.goto('/segmented/');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const scan = () => page.evaluate(async () => (await (window as any).axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  })).violations.map((v: any) => v.id));
  expect(await scan()).toEqual([]);
  await page.locator('#grouping').getByRole('button', { name: /Other categories/ }).click();
  expect(await scan()).toEqual([]);
  await page.screenshot({ path: 'tmp/segmented/grouped-details.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('regrouping and long member lists retain keyboard access without overflow', async ({ page }) => {
  await page.goto('/segmented/');
  const chart = page.locator('#grouping a11y-segmented-bar-chart');
  const alpha = chart.locator('[data-focus-key="row:alpha"]');
  await alpha.focus();
  await chart.evaluate((element: any) => {
    element.data = element.data.map((row: any) => row.id === 'delta' ? { ...row, value: 27 } : row.id === 'alpha' ? { ...row, value: 15 } : row);
  });
  await expect(chart.locator('[data-focus-key="group:other"]')).toBeFocused();
  await chart.evaluate((element: any) => {
    element.data = Array.from({ length: 40 }, (_, index) => ({ id: `member-${index}`, label: `Member ${index}`, value: index + 1, definition: '<a href="#details">Read member definition</a>' }));
    element.total = 820;
    element.config = { showDetails: true, separateCategoryIds: [] };
  });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const trigger = chart.locator('[data-focus-key="group:other"]');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const lastLink = chart.locator('.a11y-segmented-bar-chart__group-members a').last();
    await lastLink.focus();
    await expect(lastLink).toBeFocused();
    await expect(lastLink).toBeInViewport();
    await expect(chart.locator('.a11y-segmented-bar-chart__group-members > li')).toHaveCount(40);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
});

test('detail cards follow their segment or legend trigger and clamp at the right edge', async ({ page }) => {
  await page.goto('/segmented/');
  const chart = page.locator('#grouping a11y-segmented-bar-chart');
  const button = chart.locator('[data-focus-key="group:other"]');
  const card = chart.locator('[data-group-members] .a11y-segmented-bar-chart__card');
  const segment = chart.locator('.a11y-segmented-bar-chart__segment[data-other]');
  const checkPosition = async (anchor: typeof button) => {
    const [a, c, legend] = await Promise.all([anchor.boundingBox(), card.boundingBox(), chart.locator('.a11y-segmented-bar-chart__legend').boundingBox()]);
    if (!a || !c || !legend) throw new Error('Missing geometry');
    const maxLeft = Math.min(1440 - 8, legend.x + legend.width) - c.width;
    expect(Math.abs(c.x - Math.max(legend.x, Math.min(a.x, maxLeft)))).toBeLessThan(2);
    expect(c.x).toBeGreaterThan(legend.x + legend.width / 2);
    expect(c.x + c.width).toBeLessThanOrEqual(1440 - 8);
    const gap = Math.min(Math.abs(c.y - (a.y + a.height)), Math.abs(a.y - (c.y + c.height)));
    expect(gap).toBeGreaterThanOrEqual(7);
    expect(gap).toBeLessThanOrEqual(9);
  };
  await button.scrollIntoViewIfNeeded();
  await button.hover();
  await expect(card).toBeVisible();
  await checkPosition(button);
  await card.hover();
  await page.waitForTimeout(250);
  await expect(card).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(card).toBeHidden();
  await segment.hover();
  await expect(card).toBeVisible();
  await checkPosition(segment);
  await card.hover();
  await page.waitForTimeout(250);
  await expect(card).toBeVisible();
  await checkPosition(segment);
  await page.mouse.move(0, 0);
  await expect(card).toBeHidden();
  await button.focus();
  await checkPosition(button);
  await page.screenshot({ path: 'tmp/segmented/anchored-details.png' });
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await expect(card).toBeHidden();
});

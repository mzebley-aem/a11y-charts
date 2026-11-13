import { expect, test, type Page } from '@playwright/test';

const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`);
  });
  await page.goto('/demo-gallery/index.html');
  await expect(page.locator('article.example[data-example-id]')).toHaveCount(10);
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), 'No browser or console errors').toEqual([]);
});

test('gallery renders five line and five bar examples', async ({ page }) => {
  const lineExamples = page.locator('section#line-examples article.example[data-example-id]');
  const barExamples = page.locator('section#bar-examples article.example[data-example-id]');
  await expect(lineExamples).toHaveCount(5);
  await expect(barExamples).toHaveCount(5);

  for (const example of await lineExamples.all()) {
    await expect(example.locator('a11y-line-chart .a11y-line-chart__title')).toBeVisible();
    await expect(example.locator('a11y-line-chart canvas').first()).toBeVisible();
  }
  for (const example of await barExamples.all()) {
    await expect(example.locator('a11y-bar-chart .a11y-bar-chart__title')).toBeVisible();
    await expect(example.locator('a11y-bar-chart .a11y-bar-chart__bar').first()).toBeVisible();
  }
});

for (const kind of ['line', 'bar'] as const) {
  test(`${kind} author settings affect only their example and reset cleanly`, async ({ page }) => {
    const examples = page.locator(`section#${kind}-examples article.example[data-example-id]`);
    const example = examples.first();
    const peer = examples.nth(1);
    const chartSelector = `a11y-${kind}-chart`;
    const startingView = await example.locator(chartSelector).evaluate((chart: any) => chart.config.dataView ?? 'dialog');
    const peerView = await peer.locator(chartSelector).evaluate((chart: any) => chart.config.dataView ?? 'dialog');
    const settings = example.locator('details.example-settings');

    await settings.locator('summary').click();
    await example.getByLabel('Data view').selectOption(startingView === 'dialog' ? 'inline' : 'dialog');
    await expect.poll(() => example.locator(chartSelector).evaluate((chart: any) => chart.config.dataView)).toBe(startingView === 'dialog' ? 'inline' : 'dialog');
    await expect(peer.locator(chartSelector).evaluate((chart: any) => chart.config.dataView ?? 'dialog')).resolves.toBe(peerView);

    await example.getByRole('button', { name: 'Reset example', exact: true }).click();
    await expect.poll(() => example.locator(chartSelector).evaluate((chart: any) => chart.config.dataView ?? 'dialog')).toBe(startingView);
    await expect(example.getByRole('status')).toHaveText('Original example restored.');
  });
}

test('settings work by keyboard and chart data opens a labelled modal dialog', async ({ page }) => {
  const example = page.locator('section#line-examples article.example[data-example-id]').first();
  const settings = example.locator('details.example-settings');
  const summary = settings.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(settings).toHaveJSProperty('open', true);

  const dataView = example.getByRole('combobox', { name: 'Data view' });
  await expect(dataView).toBeVisible();
  const helpId = await dataView.getAttribute('aria-describedby');
  expect(helpId).toBeTruthy();
  await expect(example.locator(`#${helpId}`)).toBeVisible();

  const dataButton = example.locator('a11y-line-chart').getByRole('button', { name: 'View complete data', exact: true });
  await dataButton.focus();
  await page.keyboard.press('Enter');
  const dialog = example.locator('a11y-line-chart dialog');
  await expect(dialog).toHaveJSProperty('open', true);
  expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
  await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
  await expect(dialog.locator('h4')).toHaveText('Chart data');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveJSProperty('open', false);
  await expect(dataButton).toBeFocused();
});

for (const width of [320, 375]) {
  test(`gallery has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      cards: [...document.querySelectorAll<HTMLElement>('article.example')].map(card => ({
        left: card.getBoundingClientRect().left,
        right: card.getBoundingClientRect().right
      }))
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.cards.every(card => card.left >= 0 && card.right <= dimensions.viewport + 1)).toBe(true);
  });
}

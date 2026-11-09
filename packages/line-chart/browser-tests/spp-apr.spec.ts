import { expect, test } from '@playwright/test';

test('report switches measures, preserves share state, and keeps source uncertainty explicit', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/spp-apr/');
  await expect(page.locator('#indicator-title')).toHaveText('Drop Out');
  await expect(page.locator('.result-summary')).toContainText('7.72%');
  await page.getByRole('link', { name: '06 Preschool Environments' }).click();
  await page.getByRole('button', { name: 'Measure 6B', exact: true }).click();
  await expect(page.locator('.result-summary')).toContainText('18.29%');
  await expect(page.locator('.result-summary')).toContainText('Target not met');
  await expect(page.locator('.view-description')).toContainText(
    'Earlier history is unavailable',
  );
  await expect(page.locator('#chart-stage a11y-line-chart')).toHaveJSProperty(
    'data',
    [
      { x: '2022', actual: 27.58, target: null },
      { x: '2023', actual: 28.12, target: 18.29 },
    ],
  );
  await page
    .getByRole('button', { name: '2023 comparison', exact: true })
    .click();
  await expect(page.locator('#chart-stage a11y-bar-chart')).toBeVisible();
  await expect(page.locator('#chart-stage')).toContainText('28.12%');
  await page.locator('.display-settings summary').click();
  await page.locator('#pattern').selectOption('diagonal');
  const sharedURL = page.url();
  await page.goto(sharedURL);
  await expect(
    page.getByRole('button', { name: 'Measure 6B', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: '2023 comparison', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#pattern')).toHaveValue('diagonal');
  await page.locator('#source-notes summary').click();
  await expect(page.locator('#source-list')).toContainText(
    'summary prints a 28.12% target',
  );
  await expect(page.locator('#population-note')).toContainText('4,981');
  await page.locator('#review-notes').fill('Confirm the measure 6B target.');
  await page
    .getByRole('button', { name: 'Save notes in this browser' })
    .click();
  await page.reload();
  await expect(page.locator('#review-notes')).toHaveValue(
    'Confirm the measure 6B target.',
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download review notes' }).click();
  expect((await download).suggestedFilename()).toBe('spp-apr-review-notes.txt');
  expect(errors).toEqual([]);
});

test('report remains within the viewport and chart dialogs work with a keyboard', async ({
  page,
}) => {
  await page.goto('/spp-apr/');
  const data = page
    .locator('#chart-stage')
    .getByRole('button', { name: 'Data', exact: true });
  await page.getByRole('button', { name: 'Restore full Y-axis', exact: true }).click();
  await expect(page).toHaveURL(/zoom=false/);
  await expect(page.locator('#zoom')).not.toBeChecked();
  await data.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(data).toBeFocused();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ['2', '5', '6']) {
      await page.locator(`#indicator-nav a[href="?indicator=${id}"]`).click();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
  }
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('The same data deserves');
});

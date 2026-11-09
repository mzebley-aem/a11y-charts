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
  await expect(page.locator('.result-summary')).toContainText(
    'Target needs confirmation',
  );
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
  await page
    .getByRole('button', { name: 'Restore full Y-axis', exact: true })
    .click();
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

test('native anchors keep focus and draft notes; Back and Forward restore report choices', async ({
  page,
}) => {
  await page.goto('/spp-apr/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#indicator-title')).toBeFocused();
  await page
    .locator('#review-notes')
    .fill('Draft to preserve while navigating.');
  await page.locator('.review-link').click();
  await expect(page.locator('#review-notes')).toHaveValue(
    'Draft to preserve while navigating.',
  );
  await page.getByRole('link', { name: '06 Preschool Environments' }).click();
  await page.getByRole('button', { name: 'Measure 6B', exact: true }).click();
  await expect(page.locator('#report-status')).toContainText('Measure 6B');
  await page
    .getByRole('button', { name: '2023 comparison', exact: true })
    .click();
  await page.goBack();
  await expect(page.locator('[data-view="trend"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('[data-measure="6B"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goBack();
  await expect(page.locator('[data-measure="6A"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goForward();
  await expect(page.locator('[data-measure="6B"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('link', { name: '02 Drop Out' }).click();
  await expect(page.locator('#review-notes')).toHaveValue(
    'Draft to preserve while navigating.',
  );
  await expect(page.locator('#feedback-status')).toContainText(
    'Unsaved changes',
  );
});

test('comparison data and explanation describe independent rates', async ({
  page,
}) => {
  await page.goto('/spp-apr/?indicator=6&measure=6B&view=comparison');
  const stage = page.locator('#chart-stage');
  await stage.getByRole('button', { name: 'Explain', exact: true }).click();
  await expect(stage).toContainText('percentage scale from 0% to 100%');
  await expect(stage).toContainText('this result would not meet the target');
  await expect(stage).not.toContainText('The total is Unavailable');
  await expect(stage).not.toContainText('Count:');
  await stage
    .getByRole('button', { name: 'View complete data', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('columnheader')).toHaveText([
    'Reporting period',
    'Rate',
  ]);
  await expect.poll(() => dialog.innerText()).not.toContain('Unavailable');
  await page.keyboard.press('Escape');
  await expect(
    stage.getByRole('button', { name: 'View complete data', exact: true }),
  ).toBeFocused();
});

test('trend controls retain keyboard focus, expose series choices and preserve view links', async ({
  page,
}) => {
  await page.goto('/spp-apr/?indicator=5&measure=5A');
  await page.locator('.display-settings summary').click();
  await page.locator('#actual').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#actual')).toBeFocused();
  await expect(page.locator('#actual')).not.toBeChecked();
  await page.locator('#target').uncheck();
  await expect(page.locator('#series-status')).toBeVisible();
  await expect(page).toHaveURL(/actual=false/);
  await page.reload();
  await page.locator('.display-settings summary').click();
  await expect(page.locator('#actual')).not.toBeChecked();
  await expect(page.locator('#target')).not.toBeChecked();
  await page.locator('#actual').check();
  await expect(page.locator('#series-status')).toBeHidden();
});

test('text-spacing and reflow keep the report and open data dialogs contained', async ({
  page,
}) => {
  await page.goto('/spp-apr/?indicator=5&measure=5A');
  await page.setViewportSize({ width: 320, height: 900 });
  await page.locator('.display-settings summary').click();
  await page.addStyleTag({
    content:
      '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }',
  });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
  await page
    .locator('#chart-stage')
    .getByRole('button', { name: 'Data', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape');
});

test('source uncertainty is part of the 6B headline and overview', async ({
  page,
}) => {
  await page.goto('/spp-apr/?indicator=6&measure=6B');
  await expect(page.locator('#overview')).toContainText(
    'Target needs confirmation',
  );
  await expect(page.locator('.result-summary .outcome')).toHaveText(
    'Target needs confirmation',
  );
  await expect(page.locator('.result-summary')).toContainText(
    'detailed target (under review)',
  );
  await expect(page.locator('.feedback-actions button').first()).toHaveText(
    'Download review notes',
  );
});

test('reviewers can copy the current measure and reach notes without returning to the header', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/spp-apr/?indicator=6&measure=6B&view=comparison');
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'Copy link to this measure', exact: true })
    .click();
  await expect(page.locator('#measure-share-status')).toContainText(
    'Review notes are not included',
  );
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('measure=6B');
  expect(copied).toContain('view=comparison');
  await page
    .getByRole('link', {
      name: 'Add review notes for this indicator',
      exact: true,
    })
    .click();
  await expect(page.locator('#feedback')).toBeFocused();
  await expect(page.locator('#review-notes')).toHaveAttribute(
    'aria-describedby',
    'feedback-context feedback-instructions',
  );
});

import { expect, test, type Page } from '@playwright/test';

const pageErrors = new WeakMap<Page, string[]>();

// These checks require browser layout and native dialog behavior; happy-dom is
// intentionally not the proof for hidden-container initialization or modality.
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/packages/line-chart/browser-tests/fixture.html');
  await page.waitForFunction(() => customElements.get('a11y-line-chart') && customElements.get('a11y-bar-chart'));
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), 'No uncaught browser errors').toEqual([]);
});

async function mount(page: Page, kind = 'line', config = {}) {
  await page.evaluate(({ kind, config }) => {
    const chart = document.createElement(`a11y-${kind}-chart`);
    Object.assign(chart, {
      config,
      data: kind === 'line'
        ? [{ x: '2024', actual: 20, target: 30 }, { x: '2025', actual: 35, target: 30 }]
        : [{ id: 'a', label: 'Alpha', value: 20 }, { id: 'b', label: 'Beta', value: 35 }]
    });
    document.querySelector('#fixture')!.append(chart);
  }, { kind, config });
}

test('line initializes when revealed, including after a hidden reconnect', async ({ page }) => {
  await page.locator('#fixture').evaluate(el => (el as HTMLElement).style.display = 'none');
  await mount(page);
  await expect(page.locator('a11y-line-chart .a11y-line-chart__title')).toBeAttached();
  await page.locator('a11y-line-chart').evaluate(el => { el.remove(); document.querySelector('#fixture')!.append(el); });
  await page.locator('#fixture').evaluate(el => (el as HTMLElement).style.display = 'block');
  await expect(page.locator('a11y-line-chart canvas').first()).toBeVisible();
});

test('line retains period identity and navigator focus across prepended data', async ({ page }) => {
  await mount(page);
  const navigator = page.locator('.a11y-line-chart__navigator');
  await navigator.focus();
  await navigator.press('End');
  await page.locator('a11y-line-chart').evaluate((el: any) => {
    el.data = [{ x: '2023', actual: 10, target: 30 }, ...el.data];
  });
  await expect(navigator).toBeFocused();
  await expect(navigator).toHaveValue('2');
  await expect(navigator).toHaveAttribute('aria-valuetext', /2025/);
});

test('line preserves display-control focus on external updates', async ({ page }) => {
  await mount(page);
  const control = page.locator('[data-control="showActualLine"]');
  await control.focus();
  await page.locator('a11y-line-chart').evaluate((el: any) => { el.subtitle = 'Updated report'; });
  await expect(control).toBeFocused();
});

test('line point payload mutation cannot change source or later interpretations', async ({ page }) => {
  await mount(page);
  const result = await page.locator('a11y-line-chart').evaluate(async (el: any) => {
    el.data = [{ x: new Date('2025-01-01T00:00:00Z'), actual: 20, target: 30 }];
    await new Promise<void>(resolve => queueMicrotask(resolve));
    let original = '';
    el.addEventListener('a11y-line-chart-point-change', (event: CustomEvent) => {
      original = event.detail.targetDifference.description;
      event.detail.x.setUTCFullYear(1999);
      event.detail.targetDifference.description = 'corrupted';
    }, { once: true });
    el.querySelector('input[type="range"]').focus();
    let next = '';
    el.addEventListener('a11y-line-chart-point-change', (event: CustomEvent) => { next = event.detail.targetDifference.description; }, { once: true });
    el.querySelector('input[type="range"]').dispatchEvent(new Event('input'));
    return { year: el.data[0].x.getUTCFullYear(), original, next };
  });
  expect(result.year).toBe(2025);
  expect(result.next).toBe(result.original);
});

test('invalid line precision falls back without aborting render', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mount(page, 'line', { decimalPlaces: 1000, axisDecimalPlaces: 1000 });
  await expect(page.locator('a11y-line-chart canvas').first()).toBeVisible();
  expect(errors).toEqual([]);
});

for (const kind of ['line', 'bar']) {
  test(`${kind} dialog retains native modality after reconnect`, async ({ page }) => {
    await mount(page, kind);
    const chart = page.locator(`a11y-${kind}-chart`);
    await chart.evaluate((el, kind) => {
      const states: boolean[] = [];
      el.addEventListener(`a11y-${kind}-chart-data-view-change`, (event: CustomEvent) => {
        states.push(event.detail.open);
        el.setAttribute('data-audit-states', JSON.stringify(states));
      });
    }, kind);
    await chart.getByRole('button', { name: kind === 'line' ? 'Data' : 'View complete data', exact: true }).click();
    await expect(chart.locator('dialog')).toHaveJSProperty('open', true);
    await chart.evaluate(el => { el.remove(); document.querySelector('#fixture')!.append(el); });
    await expect.poll(() => chart.locator('dialog').evaluate(el => el.matches(':modal'))).toBe(true);
    // Native close events are queued tasks; allow the old close event to arrive
    // before asserting that it cannot overwrite the re-opened public state.
    await chart.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
    await expect(chart).toHaveAttribute('data-audit-states', '[true,false,true]');
    expect(await chart.locator('dialog').evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(chart.locator('dialog')).toHaveJSProperty('open', false);
    await expect(chart).toHaveAttribute('data-audit-states', '[true,false,true,false]');
    await expect(chart.getByRole('button', { name: kind === 'line' ? 'Data' : 'View complete data', exact: true })).toBeFocused();
  });

  test(`${kind} maintains a focused modal close button during data updates`, async ({ page }) => {
    await mount(page, kind);
    const chart = page.locator(`a11y-${kind}-chart`);
    await chart.getByRole('button', { name: kind === 'line' ? 'Data' : 'View complete data', exact: true }).click();
    const close = chart.locator('dialog').getByRole('button', { name: /Close/ });
    await close.focus();
    await chart.evaluate((el: any) => { el.data = el.data.map(row => ({ ...row, ...(row.x ? { actual: 25 } : { value: 25 }) })); });
    await expect(close).toBeFocused();
    expect(await chart.locator('dialog').evaluate(el => el.matches(':modal'))).toBe(true);
    await page.keyboard.press('Tab');
    expect(await chart.locator('dialog').evaluate(el => el.contains(document.activeElement))).toBe(true);
  });
}

for (const kind of ['line', 'bar']) {
  test(`${kind} coalesces changed-source events and reports property display changes`, async ({ page }) => {
    await mount(page, kind);
    const result = await page.locator(`a11y-${kind}-chart`).evaluate(async (el: any, kind) => {
      const settle = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      await settle();
      const dataEvents: unknown[] = [];
      const displayEvents: unknown[] = [];
      el.addEventListener(`a11y-${kind}-chart-data-change`, (event: CustomEvent) => dataEvents.push(event.detail));
      el.addEventListener(`a11y-${kind}-chart-display-change`, (event: CustomEvent) => displayEvents.push(event.detail));
      el.data = el.data;
      await settle();
      const equivalentDataEvents = dataEvents.length;
      const next = (value: number) => kind === 'line'
        ? [{ x: '2025', actual: value, target: 30 }]
        : [{ id: 'a', label: 'Alpha', value }];
      el.data = next(22);
      el.data = next(23);
      await settle();
      el.config = { ...el.config, showSummary: false };
      el.chartTitle = 'Updated title';
      await settle();
      const changedDisplayEvents = displayEvents.length;
      el.config = { ...el.config };
      el.chartTitle = 'Updated title';
      await settle();
      return { equivalentDataEvents, dataEvents: dataEvents.length, changedDisplayEvents, finalDisplayEvents: displayEvents.length };
    }, kind);
    expect(result).toEqual({ equivalentDataEvents: 0, dataEvents: 1, changedDisplayEvents: 1, finalDisplayEvents: 1 });
  });
}


test('line moves focus to navigator when the focused next control becomes disabled', async ({ page }) => {
  await mount(page, 'line', { stepperVisibility: 'always' });
  await page.locator('[data-focus-key="stepper-next"]').focus();
  await page.locator('a11y-line-chart').evaluate((el: any) => { el.data = [el.data[0]]; });
  await expect(page.locator('.a11y-line-chart__navigator')).toBeFocused();
});


test('contextual Y-axis zoom stays synchronized and keeps keyboard focus', async ({ page }) => {
  await mount(page, 'line', { showControls: true });
  const chart = page.locator('a11y-line-chart');
  await chart.evaluate((el: any) => { el.data = [{ x: '2024', actual: 3.2, target: 4 }, { x: '2025', actual: 3.6, target: 4 }]; });
  const zoom = chart.getByRole('button', { name: 'Zoom Y-axis', exact: true });
  await expect(zoom).toBeVisible();
  const canvas = await chart.locator('canvas').first().elementHandle();
  await zoom.focus();
  await page.keyboard.press('Enter');
  const restore = chart.getByRole('button', { name: 'Restore full Y-axis', exact: true });
  await expect(restore).toBeFocused();
  await expect(restore).toHaveAttribute('aria-pressed', 'true');
  await expect(chart.locator('[data-control="initialZoomY"]')).toBeChecked();
  expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
  await chart.locator('[data-control="initialZoomY"]').uncheck();
  await expect(zoom).toBeVisible();
  await zoom.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(zoom).toBeFocused();
  await chart.evaluate((el: any) => { el.data = [{ x: '2024', actual: 2, target: 95 }, { x: '2025', actual: 90, target: 95 }]; });
  await expect(zoom).toHaveCount(0);
});

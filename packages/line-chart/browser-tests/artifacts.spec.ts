import { expect, test, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  page.on('requestfailed', request => messages.push(`Request failed: ${request.url()}: ${request.failure()?.errorText}`));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') { messages.push(`External request: ${url.href}`); return route.abort(); }
    return route.continue();
  });
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

async function populate(page: Page, kinds: string[]) {
  await page.waitForFunction(kinds => kinds.every(kind => customElements.get(`a11y-${kind}-chart`)), kinds);
  await page.evaluate(kinds => {
    for (const kind of kinds) {
      Object.assign(document.querySelector(`a11y-${kind}-chart`)!, {
        data: kind === 'line'
          ? [{ x: '2024', actual: 35, target: 40 }, { x: '2025', actual: 45, target: 40 }]
          : [{ id: 'a', label: 'Alpha', value: 35, target: 40 }, { id: 'b', label: 'Beta', value: 45, target: 40 }],
        config: kind === 'bar' ? { showDetails: true } : {}
      });
    }
  }, kinds);
}

for (const kind of ['line', 'bar']) {
  for (const esm of [false, true]) {
    test(`${kind} works alone from packed ${esm ? 'ESM' : 'standalone'} output`, async ({ page }) => {
      await page.goto(`/${kind}${esm ? '?esm=1' : ''}`);
      await populate(page, [kind]);
      const chart = page.locator(`a11y-${kind}-chart`);
      await expect(chart.getByRole('heading', { name: `${kind} chart`, exact: true })).toBeVisible();
      if (kind === 'line') await expect(chart.locator('canvas').first()).toBeVisible();
      else await expect(chart.locator('.a11y-bar-chart__bar').first()).toBeVisible();
      await chart.getByRole('button', { name: kind === 'line' ? 'Data' : 'View complete data', exact: true }).click();
      expect(await chart.locator('dialog').evaluate(dialog => dialog.matches(':modal'))).toBe(true);
      await expect(chart.locator('dialog table')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(chart.locator('dialog')).not.toBeVisible();
    });
  }
}

test('both standalone charts coexist and tolerate repeated registration', async ({ page }) => {
  await page.goto('/both');
  await populate(page, ['line', 'bar']);
  const before = await page.evaluate(() => [...document.querySelectorAll('a11y-line-chart,a11y-bar-chart')].map(el => el.constructor.name));
  await page.addScriptTag({ url: '/line/chart.js' });
  await page.addScriptTag({ url: '/bar/chart.js' });
  expect(await page.evaluate(() => [...document.querySelectorAll('a11y-line-chart,a11y-bar-chart')].map(el => el.constructor.name))).toEqual(before);
  const ids = await page.locator('[id]').evaluateAll(elements => elements.map(el => el.id));
  expect(new Set(ids).size).toBe(ids.length);
  await expect(page.locator('a11y-line-chart canvas').first()).toBeVisible();
  await expect(page.locator('a11y-bar-chart .a11y-bar-chart__bar').first()).toBeVisible();
});

for (const kind of ['line', 'bar']) {
  for (const rootFirst of [false, true]) {
    test(`${kind} packed ESM shares constructor identity with root imported ${rootFirst ? 'first' : 'last'}`, async ({ page }) => {
      await page.goto(`/${kind}?esm=1${rootFirst ? '&root=1' : ''}`);
      const identities = await page.evaluate(async kind => {
        const rootUrl = `/${kind}/index.js`;
        const defineUrl = `/${kind}/define.js`;
        const root = await import(rootUrl);
        await import(defineUrl);
        const names = kind === 'line'
          ? [['a11y-line-chart', 'A11yLineChartElement']]
          : [['a11y-bar-chart', 'A11yBarChartElement'], ['a11y-bar-chart-group', 'A11yBarChartGroupElement']];
        return names.map(([tag, name]) => ({
          same: customElements.get(tag) === root[name],
          instance: document.createElement(tag) instanceof root[name],
          constructed: new root[name]() instanceof root[name]
        }));
      }, kind);
      expect(identities.every(result => result.same && result.instance && result.constructed)).toBe(true);
    });
  }
}

test('packed chart modals follow opening order across packages and restore the underlying trap', async ({ page }) => {
  await page.goto('/both');
  await populate(page, ['line', 'bar']);
  const line = page.locator('a11y-line-chart');
  const bar = page.locator('a11y-bar-chart');
  await bar.getByRole('button', { name: 'View complete data', exact: true }).click();
  // The earlier DOM sibling opens last and is now above the bar modal.
  await line.getByRole('button', { name: 'Data', exact: true }).evaluate(button => button.click());
  for (const chart of [line, bar]) {
    const dialog = chart.locator('dialog');
    await expect(dialog).toHaveJSProperty('open', true);
    const buttons = dialog.locator('button:visible:not([disabled])');
    await buttons.last().focus();
    await page.keyboard.press('Tab');
    await expect(buttons.first()).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(buttons.last()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  }
});

test('bar card preserves hover, pin, Escape, and narrow-layout access', async ({ page }) => {
  await page.goto('/bar');
  await populate(page, ['bar']);
  const trigger = page.locator('.a11y-bar-chart__details-trigger').first();
  const card = page.locator('.a11y-bar-chart__details').first();
  await trigger.hover();
  await expect(card).toBeVisible();
  await card.hover();
  await expect(card).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(card).not.toBeVisible();
  await page.locator('#outside').focus();
  await page.setViewportSize({ width: 320, height: 740 });
  await trigger.focus();
  await expect(card).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('line preserves its canvas across ordinary presentation and source updates', async ({ page }) => {
  await page.goto('/line');
  await populate(page, ['line']);
  await expect(page.locator('canvas').first()).toBeVisible();
  const canvas = await page.locator('canvas').first().elementHandle();
  await page.locator('a11y-line-chart').evaluate((el: any) => {
    el.subtitle = 'Updated';
    el.theme = { actualColor: '#123456' };
    el.data = [{ x: '2025', actual: 46, target: 40 }];
  });
  await expect(page.locator('.a11y-line-chart__subtitle')).toHaveText('Updated');
  expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
});

test('touch activation and forced-colors cards remain usable', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/bar');
  await populate(page, ['bar']);
  const trigger = page.locator('.a11y-bar-chart__details-trigger').first();
  const card = page.locator('.a11y-bar-chart__details').first();
  await trigger.dispatchEvent('pointerenter', { pointerType: 'touch' });
  await expect(card).not.toBeVisible();
  await trigger.click();
  await expect(card).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-pressed', 'true');
  await trigger.click();
  await expect(card).not.toBeVisible();
});

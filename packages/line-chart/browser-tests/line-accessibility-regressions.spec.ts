import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

test.beforeEach(async ({ page }) => {
  await page.goto('/packages/line-chart/browser-tests/fixture.html');
  await page.waitForFunction(() => customElements.get('a11y-line-chart'));
  await page.evaluate(() => {
    const chart = document.createElement('a11y-line-chart');
    Object.assign(chart, {
      chartTitle: 'Enrollment by year',
      config: { showControls: true, stepperVisibility: 'always' },
      data: [
        { x: '2024', actual: 42, target: 50 },
        { x: '2025', actual: 58, target: 50 }
      ]
    });
    document.querySelector('#fixture')!.append(chart);
  });
  await expect(page.locator('a11y-line-chart .a11y-line-chart__title')).toBeVisible();
});

test('line period control has a concise name, help, and full keyboard narrative', async ({ page }) => {
  const chart = page.locator('a11y-line-chart');
  const navigator = chart.locator('.a11y-line-chart__navigator');
  await expect(navigator).toHaveAttribute('aria-label', 'Chart period navigation');
  await expect(chart.locator('.perf-tooltip')).toHaveCount(0);
  await navigator.focus();
  await expect(chart.locator('.perf-tooltip')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(navigator).toHaveAttribute('aria-valuetext', /2025.*Target met.*58%.*50%/);
  await expect(chart.locator('[aria-live="polite"]')).toContainText(/2025.*Target met.*58%.*50%/);
  await expect(navigator).toHaveAttribute('aria-describedby', /keyboard-help/);
  await expect(navigator).not.toHaveAttribute('aria-describedby', /-data/);
  await page.keyboard.press('Escape');
  await expect(navigator).toBeFocused();
  await expect(chart.locator('.perf-tooltip')).toBeHidden();
  await page.keyboard.press('Home');
  await expect(chart.locator('.perf-tooltip')).toBeVisible();
  await expect(navigator).toHaveAttribute('aria-valuetext', /2024.*42%.*50%/);
});

test('visible line controls and disclosures meet AAA 44px target size and tooltip text contrast', async ({ page }) => {
  const chart = page.locator('a11y-line-chart');
  await chart.locator('.a11y-line-chart__navigator').focus();
  await expect(chart.locator('.perf-tooltip')).toBeVisible();
  const measurements = await chart.evaluate(element => {
    const targets = [...element.querySelectorAll<HTMLElement>(
      'button:not([hidden]), select:not([hidden]), .a11y-line-chart__controls label, .a11y-line-chart__inline-data > summary, .a11y-line-chart__explanation > summary, .a11y-line-chart__glossary > summary'
    )].filter(target => target.getClientRects().length > 0).map(target => {
      const rect = target.getBoundingClientRect();
      return { label: target.textContent?.trim() ?? target.getAttribute('aria-label') ?? target.tagName, width: rect.width, height: rect.height };
    });
    const tooltip = element.querySelector<HTMLElement>('.perf-tooltip');
    const status = element.querySelector<HTMLElement>('.perf-tooltip__status');
    return {
      targets,
      tooltipColor: tooltip ? getComputedStyle(tooltip).color : null,
      statusColor: status ? getComputedStyle(status).color : null,
      statusBackground: status ? getComputedStyle(status).backgroundColor : null
    };
  });
  expect(measurements.targets.length).toBeGreaterThan(0);
  for (const target of measurements.targets) {
    expect(target.width, `${target.label} width`).toBeGreaterThanOrEqual(44);
    expect(target.height, `${target.label} height`).toBeGreaterThanOrEqual(44);
  }
  expect(measurements.tooltipColor).toBe('rgb(0, 0, 0)');
  expect(measurements.statusColor).toBe('rgb(0, 0, 0)');
  expect(measurements.statusBackground).toBe('rgb(255, 255, 255)');

  await page.addScriptTag({ path: fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url)) });
  const violations = await page.evaluate(async () => {
    const result = await (window as any).axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2aaa', 'wcag21aaa', 'wcag22aaa'] }
    });
    return result.violations.map((violation: { id: string; nodes: unknown[] }) => ({ id: violation.id, nodes: violation.nodes.length }));
  });
  expect(violations).toEqual([]);
});

test('translated stepper labels remain whole at a 320px chart width', async ({ page }) => {
  const chart = page.locator('a11y-line-chart');
  await page.setViewportSize({ width: 320, height: 800 });
  for (const [locale, label] of [['fr-FR', 'Précédent'], ['es-ES', 'Anterior']] as const) {
    await chart.evaluate((element: any, [currentLocale, previousLabel]) => {
      element.config = { ...element.config, locale: currentLocale };
      element.messages = { previous: previousLabel };
    }, [locale, label]);
    const previous = chart.locator('.a11y-line-chart__stepper-button--previous');
    await expect(previous).toHaveText(label);
    const geometry = await previous.evaluate(element => ({
      height: element.getBoundingClientRect().height,
      overflow: element.scrollWidth > element.clientWidth,
      whiteSpace: getComputedStyle(element).whiteSpace
    }));
    expect(geometry.height).toBeGreaterThanOrEqual(44);
    expect(geometry.whiteSpace).toBe('nowrap');
    expect(geometry.overflow).toBe(false);
  }
});

test('Escape cancels a queued tooltip reveal while a long chart scrolls', async ({ page }) => {
  const chart = page.locator('a11y-line-chart');
  await chart.evaluate((element: any) => {
    element.config = { ...element.config, minWidth: 1800 };
    element.data = Array.from({ length: 12 }, (_, index) => ({ x: `${2000 + index}`, actual: 40 + index, target: 50 }));
  });
  const navigator = chart.locator('.a11y-line-chart__navigator');
  await navigator.focus();
  await page.keyboard.press('End');
  await expect(chart.locator('[id$="-scroll-help"]')).not.toHaveAttribute('hidden', '');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await expect(navigator).toBeFocused();
  await expect(chart.locator('.perf-tooltip')).toBeHidden();
});

test('line focus remains visible in forced colors and reduced motion removes pressed movement', async ({ page }) => {
  const chart = page.locator('a11y-line-chart');
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const navigator = chart.locator('.a11y-line-chart__navigator');
  await navigator.focus();
  const focus = await navigator.evaluate(element => {
    const group = element.closest('.a11y-line-chart__chart-group')!;
    return { outlineColor: getComputedStyle(group).outlineColor, outlineWidth: getComputedStyle(group).outlineWidth };
  });
  expect(focus.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(focus.outlineWidth).toBe('3px');

  const dataButton = chart.getByRole('button', { name: 'Data' });
  await dataButton.hover();
  await page.mouse.down();
  const activeTransform = await dataButton.evaluate(element => getComputedStyle(element).transform);
  await page.mouse.up();
  expect(activeTransform).toBe('none');
});

test('stepper interaction reveals the selected reading without moving focus', async ({ page }) => {
  const chart = page.locator('a11y-line-chart');
  await chart.evaluate((element: any) => { element.data = [...element.data, { x: '2026', actual: 62, target: 50 }]; });
  const next = chart.locator('.a11y-line-chart__stepper-button--next');
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();
  await expect(chart.locator('.perf-tooltip')).toBeVisible();
  await expect(chart.locator('.a11y-line-chart__stepper-status')).toContainText('2025');
});

test('line updates period semantics and recovers when actions or data disappear', async ({ page }) => {
  const chart = page.locator('a11y-line-chart');
  const slider = chart.getByRole('slider', { name: 'Chart period navigation' });
  await slider.focus();
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuetext', /2025.*Target met.*58%.*50%/);

  const next = chart.getByRole('button', { name: /Next period/ });
  await next.focus();
  await chart.evaluate((element: any) => { element.data = [element.data[0]]; });
  await expect(slider).toBeFocused();
  await expect(slider).toHaveAttribute('aria-valuetext', /2024.*Target not met/);

  await chart.evaluate((element: any) => { element.config = { ...element.config, showActions: false }; });
  await expect(slider).toBeAttached();
  await expect(chart.getByRole('button', { name: 'Data' })).toHaveCount(0);

  await chart.evaluate((element: any) => { element.data = []; });
  const emptyMessage = chart.locator('.a11y-line-chart__message--empty[tabindex="-1"]');
  await expect(emptyMessage).toBeVisible();
  await expect(emptyMessage).toBeFocused();
  await expect(chart.locator('canvas')).toHaveCount(0);

  await chart.evaluate((element: any) => { element.data = [{ x: '2024', actual: Number.NaN, target: 50 }]; });
  const errorMessage = chart.locator('.a11y-line-chart__message--error[tabindex="-1"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toBeFocused();
  await expect(chart.locator('canvas')).toHaveCount(0);
});

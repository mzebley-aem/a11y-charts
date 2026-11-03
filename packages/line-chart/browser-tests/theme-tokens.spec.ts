import { expect, test } from '@playwright/test';

test('Adapt token adapter inherits scoped values while neighboring themes stay isolated', async ({ page }) => {
  await page.goto('/#theme-comparison');
  const cards = page.locator('#theme-comparison .theme-demo-card');
  await expect(cards).toHaveCount(7);
  const standaloneCards = page.locator('#theme-comparison .theme-demo-grid').first().locator('.theme-demo-card');
  const [defaults, adapt, alternate] = await standaloneCards.evaluateAll(elements => elements.map(card => {
    const chart = card.querySelector('a11y-bar-chart')!;
    const root = chart.querySelector('.a11y-bar-chart__root')!;
    const track = chart.querySelector('.a11y-bar-chart__track')!;
    const title = chart.querySelector('.a11y-bar-chart__title')!;
    return {
      fontFamily: getComputedStyle(chart).fontFamily,
      barColor: getComputedStyle(chart).getPropertyValue('--a11y-bar-chart-color').trim(),
      trackColor: getComputedStyle(track).backgroundColor,
      borderRadius: getComputedStyle(root).borderRadius,
      borderWidth: getComputedStyle(root).borderTopWidth,
      titleFontFamily: getComputedStyle(title).fontFamily,
      valueLayout: getComputedStyle(chart).getPropertyValue('--a11y-bar-chart-value-layout').trim(),
      percentageSurface: getComputedStyle(chart).getPropertyValue('--a11y-bar-chart-percentage-surface').trim()
    };
  }));

  expect(adapt.fontFamily).toContain('Public Sans Web');
  expect(adapt.barColor).toBe('#1f4093');
  expect(adapt.trackColor).toBe('rgba(0, 0, 0, 0)');
  expect(adapt.borderRadius).toBe('8px');
  expect(adapt.borderWidth).toBe('2px');
  expect(adapt.titleFontFamily).toContain('Public Sans Web');
  expect(adapt.valueLayout).toBe('column');
  expect(adapt.percentageSurface).toBe('#dfe1e2');
  expect(alternate.fontFamily).toContain('Georgia');
  expect(alternate.barColor).toBe('#176b57');
  expect(alternate.borderRadius).not.toBe(adapt.borderRadius);
  expect(defaults.barColor).not.toBe(adapt.barColor);

  const groupedCards = page.locator('#theme-comparison .theme-demo-grid').nth(1).locator('.theme-demo-card');
  await expect(groupedCards.nth(1).locator('a11y-bar-chart-group')).toBeVisible();
  const groupStyles = await groupedCards.nth(1).locator('a11y-bar-chart-group').evaluate(group => {
    const chart = group.querySelector('a11y-bar-chart')!;
    const sectionToggle = group.querySelector('.a11y-bar-chart-group__section-toggle') as HTMLElement;
    return {
      font: getComputedStyle(chart).fontFamily,
      background: getComputedStyle(sectionToggle).backgroundColor,
      childChartTrack: getComputedStyle(chart.querySelector('.a11y-bar-chart__track')!).backgroundColor
    };
  });
  expect(groupStyles.font).toContain('system-ui');
  expect(groupStyles.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(groupStyles.childChartTrack).toBe('rgba(0, 0, 0, 0)');

  const report = page.locator('#adapt-report-preview a11y-bar-chart');
  await expect(report.locator('.a11y-bar-chart__title')).toHaveText('By Sex (Suppressed)');
  await expect(report.locator('.a11y-bar-chart__root > .a11y-bar-chart__context')).toContainText('There are 27 children, male or female, who received early intervention services from 1/1/2024 to 12/31/2024.');
  await expect(report.locator('.a11y-bar-chart__total > span')).toHaveText(['Total', '27']);
  await expect(report.locator('.a11y-bar-chart__percentage')).toHaveText(['51.85%', '48.15%']);
  await expect(report.locator('.a11y-bar-chart__action[data-focus-key="explain"]')).toHaveText('Explain');
  await expect(report.locator('.a11y-bar-chart__action[data-focus-key="glossary"]')).toHaveText('Glossary');
  await expect(report.locator('.a11y-bar-chart__action[data-focus-key="data"]')).toHaveText('Data');

  const explain = report.locator('.a11y-bar-chart__action[data-focus-key="explain"]');
  const explanation = report.locator('.a11y-bar-chart__plain-language');
  const explanationBeforeOpen = await report.evaluate(chart => {
    const nodes = Array.from(chart.querySelector('.a11y-bar-chart__root')!.children);
    return {
      actions: nodes.findIndex(node => node.classList.contains('a11y-bar-chart__actions')),
      explanation: nodes.findIndex(node => node.classList.contains('a11y-bar-chart__plain-language')),
      rows: nodes.findIndex(node => node.classList.contains('a11y-bar-chart__rows'))
    };
  });
  expect(explanationBeforeOpen.actions).toBeLessThan(explanationBeforeOpen.explanation);
  expect(explanationBeforeOpen.explanation).toBeLessThan(explanationBeforeOpen.rows);
  await expect(explain).toHaveAttribute('aria-expanded', 'false');
  await report.screenshot({ path: '../../audit-evidence/2026-10-23/adapt-report-closed.png' });
  await page.locator('#theme-comparison').screenshot({ path: '../../audit-evidence/2026-10-23/theme-comparison-desktop.png' });
  await explain.click();
  await expect(explain).toHaveAttribute('aria-expanded', 'true');
  await expect(explain).toBeFocused();
  await expect(explanation).toBeVisible();
  await expect(explanation.locator('.a11y-bar-chart__plain-language-title')).toHaveText('Plain language summary');
  await expect(explanation).toContainText('14 children were male and 13 children were female');
  await expect(explanation).not.toContainText('undefined');
  const desktopBandBounds = await explanation.evaluate(band => {
    const root = band.closest('.a11y-bar-chart__root')!;
    const bandRect = band.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const border = Number.parseFloat(getComputedStyle(root).borderLeftWidth);
    return { leftDelta: bandRect.left - (rootRect.left + border), rightDelta: (rootRect.right - border) - bandRect.right };
  });
  expect(Math.abs(desktopBandBounds.leftDelta)).toBeLessThanOrEqual(1);
  expect(Math.abs(desktopBandBounds.rightDelta)).toBeLessThanOrEqual(1);
  await report.screenshot({ path: '../../audit-evidence/2026-10-23/adapt-report-open.png' });
  await report.locator('.a11y-bar-chart__action[data-focus-key="glossary"]').click();
  await expect(report.locator('.a11y-bar-chart__definition')).toHaveCount(2);
  const endpoints = await report.evaluate(chart => {
    const root = chart.querySelector('.a11y-bar-chart__root')!.getBoundingClientRect();
    const rows = Array.from(chart.querySelectorAll('.a11y-bar-chart__row'));
    return rows.map(row => {
      const bar = row.querySelector('.a11y-bar-chart__bar')!.getBoundingClientRect();
      const value = row.querySelector('.a11y-bar-chart__value')!.getBoundingClientRect();
      return { label: row.querySelector('.a11y-bar-chart__label')!.textContent, barRight: bar.right, valueLeft: value.left, valueRight: value.right, rootLeft: root.left, rootRight: root.right };
    });
  });
  expect(endpoints).toHaveLength(2);
  expect(endpoints[0]!.barRight).toBeGreaterThan(endpoints[1]!.barRight);
  expect(endpoints[0]!.valueLeft).toBeGreaterThan(endpoints[1]!.valueLeft);
  for (const endpoint of endpoints) {
    expect(endpoint.valueLeft).toBeGreaterThanOrEqual(endpoint.rootLeft);
    expect(endpoint.valueRight).toBeLessThanOrEqual(endpoint.rootRight);
  }

  await page.setViewportSize({ width: 320, height: 900 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const mobileReport = await report.evaluate(chart => {
    const root = chart.querySelector('.a11y-bar-chart__root')!;
    const values = Array.from(chart.querySelectorAll('.a11y-bar-chart__value'));
    const rootRect = root.getBoundingClientRect();
    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      values: values.map(value => value.getBoundingClientRect().right - rootRect.right)
    };
  });
  expect(mobileReport.scrollWidth).toBeLessThanOrEqual(mobileReport.clientWidth);
  expect(mobileReport.values.every(rightOffset => rightOffset <= 0)).toBe(true);
  const mobileBandBounds = await explanation.evaluate(band => {
    const root = band.closest('.a11y-bar-chart__root')!;
    const bandRect = band.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const border = Number.parseFloat(getComputedStyle(root).borderLeftWidth);
    return { leftDelta: bandRect.left - (rootRect.left + border), rightDelta: (rootRect.right - border) - bandRect.right };
  });
  expect(Math.abs(mobileBandBounds.leftDelta)).toBeLessThanOrEqual(1);
  expect(Math.abs(mobileBandBounds.rightDelta)).toBeLessThanOrEqual(1);
  const groupLayout = await groupedCards.nth(1).locator('a11y-bar-chart-group').evaluate(group => {
    const layout = group.querySelector('.a11y-bar-chart-group')!;
    return getComputedStyle(layout).gridTemplateColumns;
  });
  expect(groupLayout.trim().split(/\s+/)).toHaveLength(1);
});

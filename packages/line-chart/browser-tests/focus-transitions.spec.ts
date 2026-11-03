import { expect, test } from '@playwright/test';
for (const kind of ['line', 'bar']) {
  test(`${kind} recovers focus when a focused action disappears`, async ({ page }) => {
    await page.goto('/packages/line-chart/browser-tests/fixture.html');
    await page.evaluate(kind => {
      const chart = document.createElement(`a11y-${kind}-chart`);
      Object.assign(chart, { data: kind === 'line' ? [{x:'2024',actual:20,target:30}] : [{id:'a',label:'Alpha',value:20}] });
      document.querySelector('#fixture')!.append(chart);
    }, kind);
    const chart = page.locator(`a11y-${kind}-chart`);
    const action = chart.getByRole('button', { name: kind === 'line' ? 'Data' : 'View complete data', exact: true });
    await action.focus();
    await chart.evaluate((el:any) => { el.config = { ...el.config, showActions: false }; });
    await expect(action).toHaveCount(0);
    await expect.poll(() => chart.evaluate(el => el.contains(document.activeElement))).toBe(true);
  });
  test(`${kind} empty and invalid data preserve focus inside the chart`, async ({ page }) => {
    await page.goto('/packages/line-chart/browser-tests/fixture.html');
    await page.evaluate(kind => {
      const chart = document.createElement(`a11y-${kind}-chart`);
      Object.assign(chart, { data: kind === 'line' ? [{x:'2024',actual:20,target:30}] : [{id:'a',label:'Alpha',value:20}] });
      document.querySelector('#fixture')!.append(chart);
    }, kind);
    const chart = page.locator(`a11y-${kind}-chart`);
    await chart.getByRole('button', { name: kind === 'line' ? 'Data' : 'View complete data', exact: true }).focus();
    await chart.evaluate((el:any) => { el.data = []; });
    await expect.poll(() => chart.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await chart.evaluate((el:any) => { el.data = 'invalid'; });
    await expect.poll(() => chart.evaluate(el => el.contains(document.activeElement))).toBe(true);
  });
}

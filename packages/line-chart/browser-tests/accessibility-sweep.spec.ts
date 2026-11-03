import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const routes = [
  '/demo-gallery/index.html', '/packages/line-chart/demo/dev.html',
  '/packages/line-chart/demo/index.html', '/packages/line-chart/demo/report-demo.html',
  '/packages/bar-chart/demo/index.html'
];
for (const route of routes) {
  test(`AAA automated sweep: ${route}`, async ({ page }) => {
    test.setTimeout(90_000);
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('a11y-line-chart canvas, a11y-bar-chart .a11y-bar-chart__bar').first()).toBeVisible();
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    for (const expanded of [false, true]) {
      if (expanded) {
        await page.evaluate(() => document.querySelectorAll('details').forEach(details => { details.open = true; }));
        for (const button of await page.getByRole('button', { name: /^(Explain|Glossary|Show definitions)$/ }).all()) {
          if (await button.isVisible() && await button.getAttribute('aria-expanded') === 'false') await button.click();
        }
      }
      const violations = await page.evaluate(async () => {
        const result = await (window as any).axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice'] },
          rules: { 'color-contrast-enhanced': { enabled: true } }
        });
        return result.violations.map((violation: any) => ({ id: violation.id, nodes: violation.nodes.map((node: any) => ({ target: node.target, failure: node.failureSummary })) }));
      });
      expect(violations, `${expanded ? 'Expanded' : 'Default'} accessibility findings`).toEqual([]);
    }
  });
}

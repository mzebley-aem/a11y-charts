import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// The AAA automated sweep for the docs Examples pages and report prototypes,
// against the built docs site. On Examples pages it covers the examples and
// their settings panels; the surrounding docs site chrome, including the
// syntax-highlighted code blocks, comes from Starlight and isn't held to this
// AAA sweep. Report prototypes are swept as whole pages.
const routes: { route: string; include?: string[] }[] = [
  { route: '/examples/target-line-charts/', include: ['.example-entry'] },
  { route: '/examples/bar-charts/', include: ['.example-entry'] },
  { route: '/examples/grouped-bar-charts/', include: ['.example-entry'] },
  { route: '/examples/segmented-bar-charts/', include: ['.segmented-demo'] },
  { route: '/examples/theme-comparison/', include: ['.theme-comparison'] },
  { route: '/reports/report-demo/' },
];

for (const { route, include } of routes) {
  test(`AAA automated sweep: ${route}`, async ({ page }) => {
    test.setTimeout(90_000);
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('a11y-target-line-chart canvas, a11y-bar-chart .a11y-bar-chart__bar, a11y-segmented-bar-chart .a11y-segmented-bar-chart__root').first()).toBeVisible();
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    for (const expanded of [false, true]) {
      if (expanded) {
        await page.evaluate(() => document.querySelectorAll('details').forEach(details => { details.open = true; }));
        for (const button of await page.getByRole('button', { name: /^(Explain|Glossary|Show definitions)$/ }).all()) {
          if (await button.isVisible() && await button.getAttribute('aria-expanded') === 'false') await button.click();
        }
      }
      const violations = await page.evaluate(async (include) => {
        const context = include ? { include: include.map(selector => [selector]), exclude: [['.expressive-code']] } : document;
        const result = await (window as any).axe.run(context, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice'] },
          rules: { 'color-contrast-enhanced': { enabled: true } }
        });
        return result.violations.map((violation: any) => ({ id: violation.id, nodes: violation.nodes.map((node: any) => ({ target: node.target, failure: node.failureSummary })) }));
      }, include);
      expect(violations, `${expanded ? 'Expanded' : 'Default'} accessibility findings`).toEqual([]);
    }
  });
}

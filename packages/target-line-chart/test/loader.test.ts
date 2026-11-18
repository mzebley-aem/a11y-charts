import { describe, expect, it, vi } from 'vitest';

describe('loadA11yTargetLineChart', () => {
  it('registers the elements in a browser and reuses one pending load', async () => {
    const early = document.createElement('a11y-target-line-chart') as HTMLElement & { data: unknown };
    const data = [{ x: 2020, actual: 40, target: 50 }];
    early.data = data;
    document.body.append(early);
    const { loadA11yTargetLineChart } = await import('../src/loader.js');
    const first = loadA11yTargetLineChart();
    expect(loadA11yTargetLineChart()).toBe(first);
    await expect(first).resolves.toBe(true);
    for (const tag of ['a11y-target-line-chart']) {
      expect(customElements.get(tag)).toBeDefined();
    }
    // A value set before the definition loaded must reach the class setter.
    expect(Object.prototype.hasOwnProperty.call(early, 'data')).toBe(false);
    expect(early.data).toEqual(data);
    early.remove();
  }, 30_000); // Cold dynamic import of the chart and ECharts can exceed the default under parallel load.

  it('resolves false without touching the element modules when there is no DOM', async () => {
    vi.resetModules();
    vi.stubGlobal('customElements', undefined);
    vi.stubGlobal('HTMLElement', undefined);
    try {
      const { loadA11yTargetLineChart } = await import('../src/loader.js');
      await expect(loadA11yTargetLineChart()).resolves.toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

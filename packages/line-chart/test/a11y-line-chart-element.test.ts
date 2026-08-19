import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  A11Y_LINE_CHART_TAG_NAME,
  A11yLineChartElement,
  defineA11yLineChart
} from '../src/index.js';

async function settle(): Promise<void> {
  await Promise.resolve();
}

describe('A11yLineChartElement foundation', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('registers idempotently as an autonomous custom element', () => {
    expect(() => defineA11yLineChart()).not.toThrow();
    expect(customElements.get(A11Y_LINE_CHART_TAG_NAME)).toBe(
      A11yLineChartElement
    );
  });

  it('renders in Light DOM and preserves authored children', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME);
    const authored = document.createElement('p');
    authored.dataset['consumerContent'] = 'true';
    authored.textContent = 'Authored fallback content';
    element.append(authored);
    document.body.append(element);
    await settle();

    expect(element.shadowRoot).toBeNull();
    expect(element.querySelector('[data-consumer-content]')).toBe(authored);
    expect(element.querySelector('[data-a11y-line-chart-owned]')).not.toBeNull();
  });

  it('provides an explanatory empty state', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME);
    document.body.append(element);
    await settle();

    expect(element.textContent).toContain('No chart data is available');
    expect(element.textContent).toContain('Provide at least one data point');
  });

  it('updates its accessible table when data is replaced', async () => {
    const element = document.createElement(
      A11Y_LINE_CHART_TAG_NAME
    ) as A11yLineChartElement;
    document.body.append(element);
    element.data = [{ x: 2024, actual: 72.5, target: 80 }];
    await settle();

    expect(element.querySelector('tbody')?.textContent).toContain('2024');
    expect(element.querySelector('tbody')?.textContent).toContain('73%');

    element.data = [{ x: 2030, actual: 90, target: null }];
    await settle();

    expect(element.querySelector('tbody')?.textContent).not.toContain('2024');
    expect(element.querySelector('tbody')?.textContent).toContain('2030');
    expect(element.querySelector('tbody')?.textContent).toContain('Missing');
  });

  it('restores the one-tab-stop keyboard model and announces point changes', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [
      { x: 2024, actual: 72, target: 80 },
      { x: 2025, actual: 85, target: 80 },
      { x: 2026, actual: 80, target: 80 }
    ];
    const pointListener = vi.fn();
    element.addEventListener('a11y-line-chart-point-change', pointListener);
    document.body.append(element);
    await settle();

    const navigator = element.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');
    expect(navigator?.type).toBe('range');
    expect(navigator?.getAttribute('aria-valuetext')).toContain('2024');

    navigator?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(navigator?.value).toBe('1');
    expect(navigator?.getAttribute('aria-valuetext')).toContain('Actual is 5% above target');
    expect(element.querySelector('[aria-live="polite"]')?.textContent).toContain('2025');
    expect(pointListener).toHaveBeenCalled();

    navigator?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(navigator?.value).toBe('2');
  });

  it('supports wraparound and emits framework-neutral control changes', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { wrapAround: true };
    element.data = [{ x: 2024, actual: 72, target: 80 }, { x: 2025, actual: 85, target: 80 }];
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-config-change', listener);
    document.body.append(element);
    await settle();

    const navigator = element.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');
    navigator?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(navigator?.value).toBe('1');

    const labelToggle = element.querySelector<HTMLInputElement>('[data-control="showActualValues"]');
    labelToggle?.click();
    await settle();
    expect(element.config.showActualValues).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('accepts the Angular year/showTable contract and direct sizing inputs', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.a11y = { decimalPlaces: 2, showTable: false };
    element.minWidth = 640;
    element.dynamicMinWidth = true;
    element.perPointMinWidth = 80;
    element.data = [{ year: 2024, actual: 72.5, target: 80 }];
    document.body.append(element);
    await settle();

    expect(element.querySelector('tbody')?.textContent).toContain('2024');
    expect(element.querySelector('tbody')?.textContent).toContain('72.50%');
    expect(element.querySelector('.a11y-line-chart__table-region')?.hasAttribute('hidden')).toBe(true);
    expect((element.querySelector('.a11y-line-chart__resizable') as HTMLElement).style.minWidth).toBe('320px');
    expect(element.minWidth).toBe(640);
  });

  it('generates unique instance relationships', async () => {
    const first = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const second = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    first.data = [{ x: 2024, actual: 72.5, target: 80 }];
    second.data = [{ x: 2025, actual: 75, target: 82 }];
    document.body.append(first, second);
    await settle();

    const ids = [...document.querySelectorAll<HTMLElement>('[id]')].map(
      (node) => node.id
    );
    expect(new Set(ids).size).toBe(ids.length);

    for (const element of [first, second]) {
      const root = element.querySelector('.a11y-line-chart__root');
      const labelledBy = root?.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(element.querySelector(`#${labelledBy}`)).not.toBeNull();
    }
  });

  it('renders a recoverable error and emits a framework-neutral event', async () => {
    const element = document.createElement(
      A11Y_LINE_CHART_TAG_NAME
    ) as A11yLineChartElement;
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-error', listener);
    document.body.append(element);

    element.data = [{ x: 2024, actual: Number.NaN, target: 80 }];
    await settle();

    expect(listener).toHaveBeenCalledOnce();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Check the data supplied to the chart'
    );
  });
});

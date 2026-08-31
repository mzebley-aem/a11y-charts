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
    expect(navigator?.getAttribute('aria-valuetext')).toContain('5 percentage points above target');
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

  it('exposes end-user Y-axis zoom and fill-pattern controls', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [{ x: 2024, actual: 72, target: 80 }, { x: 2025, actual: 85, target: 82 }];
    document.body.append(element);
    await settle();

    const zoom = element.querySelector<HTMLInputElement>('[data-control="initialZoomY"]');
    const actualPattern = element.querySelector<HTMLSelectElement>('[data-control="actualPattern"]');
    expect(zoom?.checked).toBe(false);
    expect(actualPattern?.value).toBe('none');

    zoom?.click();
    await settle();
    expect(element.config.initialZoomY).toBe(true);

    if (actualPattern) {
      actualPattern.value = 'diagonal';
      actualPattern.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await settle();
    expect(element.config.actualPattern).toBe('diagonal');
  });

  it('provides touch-safe period controls that use the canonical selection path', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { stepperVisibility: 'always' };
    element.data = [
      { x: 2024, actual: 72, target: 80 },
      { x: 2025, actual: 85, target: 80 },
      { x: 2026, actual: 80, target: 80 }
    ];
    const pointListener = vi.fn();
    element.addEventListener('a11y-line-chart-point-change', pointListener);
    document.body.append(element);
    await settle();

    const stepper = element.querySelector<HTMLElement>('.a11y-line-chart__stepper');
    const previous = element.querySelector<HTMLButtonElement>('[data-stepper-direction="previous"]');
    const next = element.querySelector<HTMLButtonElement>('[data-stepper-direction="next"]');
    const status = element.querySelector<HTMLElement>('.a11y-line-chart__stepper-status');
    const navigator = element.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');

    expect(stepper?.hidden).toBe(false);
    expect(stepper?.getAttribute('aria-label')).toBe('Chart period navigation');
    expect(status?.textContent).toBe('2024 · 1 of 3');
    expect(previous?.disabled).toBe(true);
    expect(next?.getAttribute('aria-label')).toBe('Next period, 2025');

    next?.click();
    expect(navigator?.value).toBe('1');
    expect(status?.textContent).toBe('2025 · 2 of 3');
    expect(previous?.getAttribute('aria-label')).toBe('Previous period, 2024');
    expect(next?.getAttribute('aria-label')).toBe('Next period, 2026');
    expect(pointListener).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({ index: 1, x: 2025 })
    }));

    next?.click();
    expect(status?.textContent).toBe('2026 · 3 of 3');
    expect(next?.disabled).toBe(true);
  });

  it('applies wraparound to the visible period controls', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { stepperVisibility: 'always', wrapAround: true };
    element.data = [
      { x: 2024, actual: 72, target: 80 },
      { x: 2025, actual: 85, target: 80 }
    ];
    document.body.append(element);
    await settle();

    const previous = element.querySelector<HTMLButtonElement>('[data-stepper-direction="previous"]');
    const next = element.querySelector<HTMLButtonElement>('[data-stepper-direction="next"]');
    const status = element.querySelector<HTMLElement>('.a11y-line-chart__stepper-status');

    expect(previous?.disabled).toBe(false);
    expect(previous?.getAttribute('aria-label')).toBe('Previous period, 2025');
    previous?.click();
    expect(status?.textContent).toBe('2025 · 2 of 2');
    expect(next?.disabled).toBe(false);
    expect(next?.getAttribute('aria-label')).toBe('Next period, 2024');
    next?.click();
    expect(status?.textContent).toBe('2024 · 1 of 2');
  });

  it('shows the default automatic stepper only when the chart overflows', async () => {
    const frameSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('a11y-line-chart__viewport') ? 320 : 0;
    });
    const scrollWidthSpy = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('a11y-line-chart__viewport') ? 720 : 0;
    });

    try {
      const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
      element.data = [{ x: 2024, actual: 72, target: 80 }];
      document.body.append(element);
      await settle();

      expect(element.querySelector<HTMLElement>('.a11y-line-chart__stepper')?.hidden).toBe(false);
      expect(element.querySelector(`#${element.instanceId}-scroll-help`)?.hasAttribute('hidden')).toBe(false);
    } finally {
      frameSpy.mockRestore();
      clientWidthSpy.mockRestore();
      scrollWidthSpy.mockRestore();
    }
  });

  it('allows consumers to suppress the period stepper', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { stepperVisibility: 'never' };
    element.data = [{ x: 2024, actual: 72, target: 80 }];
    document.body.append(element);
    await settle();

    expect(element.querySelector('.a11y-line-chart__stepper')).toBeNull();
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

  it('renders one baseline-aware semantic result across summary, table, and events', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { decimalPlaces: 2, tableVisibility: 'visible' };
    element.baseline = {
      x: 2015,
      value: 38,
      explanation: 'A new reporting policy took effect.'
    };
    element.data = [
      { x: 2015, actual: 40, target: 50 },
      { x: 2020, actual: 83.92, target: 77.02 },
      { x: 2021, actual: null, target: 78.27 }
    ];
    const pointListener = vi.fn();
    element.addEventListener('a11y-line-chart-point-change', pointListener);
    document.body.append(element);
    await settle();

    const summary = element.querySelector('.a11y-line-chart__summary');
    expect(summary?.querySelector('strong')?.textContent).toBe('Target met in 2020.');
    expect(summary?.textContent).toContain('45.92 percentage points above the 2015 baseline of 38.00%');
    expect(summary?.textContent).toContain('A new reporting policy took effect.');
    expect(element.querySelector('caption')?.textContent).toContain('Baseline: 2015, 38.00%');
    expect(element.querySelector('thead')?.textContent).toContain('Target outcome');
    expect(element.querySelector('thead')?.textContent).toContain('Change from baseline');

    const navigator = element.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');
    navigator?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(navigator?.getAttribute('aria-valuetext')).toContain('45.92 percentage points above the 2015 baseline');
    const detail = pointListener.mock.calls[0]?.[0].detail;
    expect(detail).toMatchObject({
      outcome: 'met',
      outcomeLabel: 'Target met',
      baselineDifference: { signedValue: 45.92 }
    });
    expect(detail.targetDifference.signedValue).toBeCloseTo(6.9);
  });

  it('reports an invalid baseline without suppressing the chart data', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-error', listener);
    element.baseline = { x: 2014, value: 38 };
    element.data = [{ x: 2015, actual: 40, target: 50 }];
    document.body.append(element);
    await settle();

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({ code: 'invalid-baseline' })
    }));
    expect(element.querySelector('[role="status"]')?.textContent).toContain('must match the earliest displayed data period');
    expect(element.querySelector('tbody')?.textContent).toContain('2015');
    expect(element.querySelector('.a11y-line-chart__summary')?.textContent).not.toContain('baseline of');
  });

  it('applies structured consumer labels and formatters consistently', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = {
      actualSeriesLabel: 'Performance',
      baselineSeriesLabel: 'Starting point',
      contextNote: 'Values are reported as service points.',
      decimalPlaces: 1,
      targetSeriesLabel: 'Goal',
      valuePreset: 'number'
    };
    element.formatValue = ({ value }) => value === null ? 'None' : `${value.toFixed(1)} pts`;
    element.formatDifference = ({ value }) => `${value.toFixed(1)} points`;
    element.formatXValue = (value) => `FY ${String(value)}`;
    element.baseline = { x: 1, value: 4 };
    element.data = [
      { x: 1, actual: 5, target: 6 },
      { x: 2, actual: 8, target: 7 }
    ];
    document.body.append(element);
    await settle();

    const summary = element.querySelector('.a11y-line-chart__summary')?.textContent;
    expect(summary).toContain('Target met in FY 2.');
    expect(summary).toContain('Performance was 8.0 pts. Goal was 7.0 pts—1.0 points above goal.');
    expect(summary).toContain('4.0 points above the FY 1 starting point of 4.0 pts');
    expect(summary).toContain('Values are reported as service points.');
    expect(element.querySelector('caption')?.textContent).toContain('Starting point: FY 1, 4.0 pts');
  });

  it('falls back to canonical formatting when a formatter fails', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { decimalPlaces: 1 };
    element.formatValue = () => { throw new Error('consumer formatter failed'); };
    element.formatDifference = () => '';
    element.formatXValue = () => '';
    element.data = [{ x: 2020, actual: 83.9, target: 77 }];
    document.body.append(element);
    await settle();

    expect(element.querySelector('.a11y-line-chart__summary')?.textContent).toContain(
      'Target met in 2020. Actual was 83.9%. Target was 77.0%—6.9 percentage points above target.'
    );
  });
});

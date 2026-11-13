import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  A11Y_LINE_CHART_TAG_NAME,
  A11yLineChartElement,
  defineA11yLineChart
} from '../src/index.js';
import type { A11yLineChartConfig, A11yLineChartDatum, A11yLineChartFormatContext } from '../src/index.js';

async function settle(): Promise<void> {
  await Promise.resolve();
}

function createChart(
  config: A11yLineChartConfig,
  data: A11yLineChartDatum[],
  attributes: Record<string, string> = {}
): A11yLineChartElement {
  const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.config = config;
  element.data = data;
  document.body.append(element);
  return element;
}

function selectPoint(element: A11yLineChartElement, index: number): void {
  const navigator = element.querySelector<HTMLInputElement>('input[type="range"]')!;
  navigator.value = String(index);
  navigator.dispatchEvent(new Event('input'));
}

const WHOLE_DATA: A11yLineChartDatum[] = [
  { x: 'Q1', actual: 45, target: { min: 40, max: 50 } },
  { x: 'Q2', actual: 52.5, target: 50 },
  { x: 'Q3', actual: null, target: 60 }
];

const FRACTION_DATA: A11yLineChartDatum[] = [
  { x: 'Q1', actual: 0.45, target: { min: 0.4, max: 0.5 } },
  { x: 'Q2', actual: 0.525, target: 0.5 },
  { x: 'Q3', actual: null, target: 0.6 }
];

describe('dataView none', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('removes the data table, the data action, the inline disclosure, the dialog and the CSV export', async () => {
    const element = createChart({ dataView: 'none' }, [{ x: 'Q1', actual: 1, target: 2 }]);
    await settle();
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('.a11y-line-chart__data-action')).toBeNull();
    expect(element.querySelector('.a11y-line-chart__inline-data')).toBeNull();
    expect(element.querySelector('.a11y-line-chart__export')).toBeNull();
    expect(element.querySelector('dialog')).toBeNull();
    expect(element.textContent).not.toContain('View complete data');
  });

  it('keeps a visually hidden screen-reader table for the dialog and inline views', async () => {
    const dialogChart = createChart({ dataView: 'dialog' }, [{ x: 'Q1', actual: 1, target: 2 }]);
    await settle();
    const hiddenDialogTable = dialogChart.querySelector('.a11y-line-chart__table-region--visually-hidden table');
    expect(hiddenDialogTable).toBeTruthy();

    const inlineChart = createChart({ dataView: 'inline' }, [{ x: 'Q1', actual: 1, target: 2 }]);
    await settle();
    expect(inlineChart.querySelector('.a11y-line-chart__table-region--visually-hidden table')).toBeTruthy();
    expect(inlineChart.querySelector('.a11y-line-chart__inline-data table')).toBeTruthy();
  });

  it('reports the closed state for the view that was open when switching to none', async () => {
    const element = createChart({ dataView: 'inline', showActions: false, showControls: false }, [{ x: 'Q1', actual: 1, target: 2 }]);
    await settle();
    const events: CustomEvent[] = [];
    element.addEventListener('a11y-line-chart-data-view-change', (event) => events.push(event as CustomEvent));
    element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')!.open = true;
    await settle();
    element.config = { dataView: 'none', showActions: false, showControls: false };
    await settle();
    expect(events[events.length - 1]?.detail).toEqual({ open: false, dataView: 'inline' });
    expect(events.every((event) => event.detail.dataView !== 'none')).toBe(true);
  });
});

describe('data-view attribute', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('takes precedence over config.dataView and follows later changes', async () => {
    const element = createChart({ dataView: 'inline' }, [{ x: 'Q1', actual: 1, target: 2 }], { 'data-view': 'none' });
    await settle();
    expect(element.querySelector('.a11y-line-chart__inline-data')).toBeNull();
    expect(element.querySelector('table')).toBeNull();

    element.setAttribute('data-view', 'dialog');
    await settle();
    expect(element.querySelector('.a11y-line-chart__data-action')).toBeTruthy();

    element.removeAttribute('data-view');
    await settle();
    expect(element.querySelector('.a11y-line-chart__inline-data')).toBeTruthy();
  });

  it('ignores an invalid attribute value and falls back to config.dataView', async () => {
    const element = createChart({ dataView: 'none' }, [{ x: 'Q1', actual: 1, target: 2 }], { 'data-view': 'bogus' });
    await settle();
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('.a11y-line-chart__data-action')).toBeNull();
  });
});

describe('percentScale', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('renders the same table text for fraction input as for the equivalent whole-percent input', async () => {
    const baseline = { x: 'Q1', value: 0.6 };
    const whole = createChart({ actualSeriesLabel: 'Actual', showSummary: true }, WHOLE_DATA.map((datum) => ({ ...datum })));
    whole.baseline = { x: 'Q1', value: 60 };
    await settle();
    const fraction = createChart({ percentScale: 'fraction', actualSeriesLabel: 'Actual', showSummary: true }, FRACTION_DATA.map((datum) => ({ ...datum })));
    fraction.baseline = baseline;
    await settle();

    const wholeTable = whole.querySelector('.a11y-line-chart__table-region table')!;
    const fractionTable = fraction.querySelector('.a11y-line-chart__table-region table')!;
    expect(wholeTable.textContent).toBeTruthy();
    expect(fractionTable.textContent).toBe(wholeTable.textContent);
    expect(fraction.querySelector('.a11y-line-chart__summary')?.textContent).toBe(whole.querySelector('.a11y-line-chart__summary')?.textContent);
    expect(fraction.textContent).toContain('45%');
  });

  it('keeps data getter, baseline getter, formatValue context and point-change detail in author scale', async () => {
    const format = vi.fn((context: A11yLineChartFormatContext) => `${context.series}:${context.value}`);
    const element = createChart({ percentScale: 'fraction', dataView: 'dialog' }, FRACTION_DATA.map((datum) => ({ ...datum })));
    element.baseline = { x: 'Q1', value: 0.6 };
    element.formatValue = format;
    await settle();

    expect(element.data).toEqual(FRACTION_DATA);
    expect(element.baseline).toEqual({ x: 'Q1', value: 0.6 });
    expect(format).toHaveBeenCalledWith(expect.objectContaining({ series: 'actual', value: 0.45, x: 'Q1' }));
    expect(format).toHaveBeenCalledWith(expect.objectContaining({ series: 'target', value: 0.4, x: 'Q1' }));
    expect(format).toHaveBeenCalledWith(expect.objectContaining({ series: 'baseline', value: 0.6, x: 'Q1' }));

    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-point-change', listener);
    selectPoint(element, 0);
    const detail = listener.mock.calls[0]?.[0].detail;
    expect(detail.actual).toBe(0.45);
    expect(detail.target).toEqual({ min: 0.4, max: 0.5 });
    expect(Math.abs(detail.baselineDifference.signedValue)).toBe(15);
  });

  it('keeps the whole-percent scale semantics for number presets', async () => {
    const element = createChart({ valuePreset: 'number', percentScale: 'fraction' }, [{ x: 'Q1', actual: 45, target: 50 }]);
    await settle();
    expect(element.data).toEqual([{ x: 'Q1', actual: 45, target: 50 }]);
  });

  it('applies the percent-scale attribute and re-scales when it changes', async () => {
    const whole = createChart({}, WHOLE_DATA.map((datum) => ({ ...datum })));
    await settle();
    const element = createChart({}, FRACTION_DATA.map((datum) => ({ ...datum })), { 'percent-scale': 'fraction' });
    await settle();
    expect(element.querySelector('table')!.textContent).toBe(whole.querySelector('table')!.textContent);

    element.removeAttribute('percent-scale');
    await settle();
    expect(element.querySelector('table')!.textContent).not.toBe(whole.querySelector('table')!.textContent);
  });
});

describe('formatValue for missing values', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('is never called with a missing value and the missing description is used instead', async () => {
    const format = vi.fn((context: A11yLineChartFormatContext) => `Value ${context.value}`);
    const element = createChart({ describeMissingAs: 'No figure', dataView: 'dialog' }, [
      { x: 'Q1', actual: null, target: 50 },
      { x: 'Q2', actual: 40, target: 50 }
    ]);
    element.formatValue = format;
    await settle();
    expect(format.mock.calls.every(([context]) => typeof context.value === 'number')).toBe(true);
    expect(format.mock.calls.some(([context]) => context.series === 'actual' && context.value === 40)).toBe(true);
    const firstRowActual = element.querySelector('.a11y-line-chart__table-region table tbody tr td')!;
    expect(firstRowActual.textContent).toBe('No figure');
  });
});

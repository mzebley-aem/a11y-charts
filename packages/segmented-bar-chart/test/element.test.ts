import { afterEach, describe, expect, it } from 'vitest';
import {
  A11ySegmentedBarChartElement,
  defineA11ySegmentedBarChart,
} from '../src/index.js';

defineA11ySegmentedBarChart();
afterEach(() => document.body.replaceChildren());
const settled = async () => {
  await Promise.resolve();
};

describe('segmented bar element', () => {
  it('renders the highlighted value and denominator from the same model as the table', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.chartTitle = 'Outcomes';
    chart.data = [
      { id: 'a', label: 'First', value: 3 },
      { id: 'b', label: 'Second', value: 7 },
    ];
    chart.total = 10;
    chart.config = {
      highlightedId: 'a',
      dataView: 'inline',
      showActions: false,
    };
    document.body.append(chart);
    await settled();
    expect(chart?.querySelector('.total')?.textContent).toContain('3');
    expect(chart?.querySelector('.total')?.textContent).toContain('10');
    expect(chart?.querySelector('table')?.textContent).toContain('30.00%');
  });

  it('never exposes a suppressed value in the getter, table, legend, or segment geometry', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.data = [
      { id: 'a', label: 'Protected', value: 37, valueSuppressed: true },
      { id: 'b', label: 'Other', value: 63 },
    ];
    chart.total = 100;
    chart.config = { dataView: 'inline', showDetails: true };
    document.body.append(chart);
    await settled();
    expect(chart.data[0]?.value).toBeNull();
    expect(chart?.textContent).not.toContain('37');
    expect(chart?.querySelectorAll('.segment')).toHaveLength(0);
  });

  it('provides independent inline table and dismissible detail controls', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.data = [
      { id: 'a', label: 'First', value: 3, definition: 'Definition' },
    ];
    chart.config = {
      dataView: 'inline',
      showActions: false,
      showDetails: true,
    };
    document.body.append(chart);
    await settled();
    expect(chart?.querySelector('table')).not.toBeNull();
    const button = chart.querySelector<HTMLButtonElement>('.legend button')!;
    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('data view invalidation', () => {
  it('closes stale data and recovers focus when data becomes invalid or its table is hidden', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.chartTitle = 'Data';
    chart.data = [{ id: 'a', label: 'A', value: 1 }];
    document.body.append(chart);
    await settled();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    expect(chart.querySelector('dialog')?.open).toBe(true);
    chart.config = { tableVisibility: 'hidden' };
    await settled();
    expect(chart.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(chart.querySelector('.title'));
    chart.config = {};
    await settled();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    chart.data = [{ id: '', label: 'Invalid', value: 1 }];
    await settled();
    expect(chart.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(chart.querySelector('[role="alert"]'));
    expect(chart.textContent).not.toContain('Download CSV');
  });
});

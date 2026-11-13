import { afterEach, describe, expect, it, vi } from 'vitest';
import { A11ySegmentedBarChartElement, defineA11ySegmentedBarChart } from '../src/index.js';
defineA11ySegmentedBarChart();
afterEach(() => document.body.replaceChildren());
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
function setup() {
  const chart = new A11ySegmentedBarChartElement();
  chart.chartTitle = 'Requests';
  chart.data = [{ id: 'a', label: 'Resolved', value: 6 }, { id: 'b', label: 'Pending', value: 4 }];
  chart.total = 10;
  return chart;
}

describe('public API consistency', () => {
  it('emits one ready event with identity and coalesces changed data with safe copied payloads', async () => {
    const chart = setup();
    const ready = vi.fn(); const changed = vi.fn();
    chart.addEventListener('a11y-segmented-bar-chart-ready', ready);
    chart.addEventListener('a11y-segmented-bar-chart-data-change', changed);
    document.body.append(chart); await settle();
    expect(ready).toHaveBeenCalledTimes(1);
    expect((ready.mock.calls[0]![0] as CustomEvent).detail.instanceId).toBeTruthy();
    expect(changed).not.toHaveBeenCalled();
    chart.total = 20;
    chart.data = [{ id: 'a', label: 'Resolved', value: 12 }, { id: 'b', label: 'Pending', value: 8 }];
    await settle();
    expect(changed).toHaveBeenCalledTimes(1);
    const event = changed.mock.calls[0]![0] as CustomEvent;
    expect(event.detail.data).toEqual(chart.data);
    event.detail.data[0].value = 999;
    event.detail.model.rows[0].value = 999;
    expect(chart.data[0]!.value).toBe(12);
    chart.data = chart.data; chart.total = chart.total;
    await settle();
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('defensively copies configuration, theme and messages on both input and output', async () => {
    const chart = setup();
    const config = { showCounts: true }; const messages = { showData: 'Open data' };
    const theme = { segments: { a: { color: 'red' } } };
    chart.config = config; chart.messages = messages; chart.theme = theme;
    config.showCounts = false; messages.showData = 'Changed'; theme.segments.a.color = 'green';
    expect(chart.config.showCounts).toBe(true);
    expect(chart.messages.showData).toBe('Open data');
    expect(chart.theme.segments?.a?.color).toBe('red');
    chart.config.showCounts = false; chart.messages.showData = 'Changed'; chart.theme.segments!.a!.color = 'green';
    expect(chart.config.showCounts).toBe(true);
    expect(chart.messages.showData).toBe('Open data');
    expect(chart.theme.segments?.a?.color).toBe('red');
  });

  it('provides optional safe navigation without trapping segment controls in a link', async () => {
    const chart = setup(); chart.config = { presentation: 'compact', showDetails: true };
    document.body.append(chart); await settle();
    expect(chart.querySelector('.a11y-segmented-bar-chart__title a')).toBeNull();
    chart.href = 'javascript:alert(1)'; await settle();
    expect(chart.querySelector('.a11y-segmented-bar-chart__title a')).toBeNull();
    chart.href = '#destination'; await settle();
    expect(chart.querySelector('.a11y-segmented-bar-chart__title a')?.getAttribute('href')).toBe('#destination');
    expect(chart.querySelector('a button')).toBeNull();
    expect(chart.querySelector('.a11y-segmented-bar-chart__title a')?.classList.contains('a11y-segmented-bar-chart__card-link')).toBe(false);
    chart.config = { presentation: 'compact', showDetails: false, showActions: false };
    await settle();
    expect(chart.querySelector('.a11y-segmented-bar-chart__title a')?.classList.contains('a11y-segmented-bar-chart__card-link')).toBe(true);
  });

  it('does not inject inline style tags and preserves host-authored children', async () => {
    const chart = setup(); const authored = document.createElement('p'); authored.textContent = 'Host note';
    chart.append(authored); document.body.append(chart); await settle();
    expect(chart.querySelector('style')).toBeNull();
    expect(authored.parentNode).toBe(chart);
    chart.config = { showCounts: false }; await settle();
    expect(authored.parentNode).toBe(chart);
  });

  it('preserves missing/suppressed status when numeric annotations are hidden', async () => {
    const chart = setup();
    chart.data = [{ id: 'a', label: 'Protected', value: 0 }, { id: 'b', label: 'Missing record', value: null }];
    chart.suppressed = true;
    chart.config = { showCounts: false, showPercentages: false, showSummary: false };
    document.body.append(chart); await settle();
    expect(chart.querySelector('.a11y-segmented-bar-chart__legend')?.textContent).toContain('Suppressed');
    expect(chart.querySelector('.a11y-segmented-bar-chart__legend')?.textContent).toContain('Not reported');
  });
  it('keeps inline data and its CSV export available and reports invalid replacements', async () => {
    const chart = setup();
    chart.config = { dataView: 'inline', showActions: false };
    document.body.append(chart); await settle();
    expect(chart.querySelector('.a11y-segmented-bar-chart__inline-data summary')).not.toBeNull();
    expect(chart.querySelector('.a11y-segmented-bar-chart__inline-data [data-focus-key="export:csv"]')).not.toBeNull();
    const changed = vi.fn(); chart.addEventListener('a11y-segmented-bar-chart-data-change', changed);
    chart.data = [{ id: 'invalid', label: 'Invalid', value: -1 }]; await settle();
    expect(chart.querySelector('[role="alert"]')).not.toBeNull();
    expect((changed.mock.calls[0]![0] as CustomEvent).detail.model).toBeNull();
  });

  it('does not dispatch any event when chartTitle or config change after the first render', async () => {
    const chart = setup();
    document.body.append(chart); await settle();
    const dispatch = vi.spyOn(chart, 'dispatchEvent');
    chart.chartTitle = 'Updated requests';
    chart.config = { showDetails: true, percentageDecimals: 1 };
    await settle();
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('data view, percent scale, and export attributes', () => {
  const dataTools = (chart: Element) => [...chart.querySelectorAll<HTMLButtonElement>('.a11y-segmented-bar-chart__data-tools button')];

  it('dataView none removes the data action, table, inline view, and exports', async () => {
    const chart = setup();
    chart.config = { dataView: 'none' };
    document.body.append(chart); await settle();
    expect(chart.querySelector('[data-focus-key="data"]')).toBeNull();
    expect(chart.querySelector('dialog')).toBeNull();
    expect(chart.querySelector('details.a11y-segmented-bar-chart__inline-data')).toBeNull();
    expect(chart.querySelector('table')).toBeNull();
    expect(dataTools(chart)).toHaveLength(0);
    expect(chart.textContent).not.toContain('Download CSV');
  });

  it('data-view attribute takes precedence over config when valid', async () => {
    const chart = setup();
    chart.config = { dataView: 'none' };
    chart.setAttribute('data-view', 'inline');
    document.body.append(chart); await settle();
    expect(chart.querySelector('details.a11y-segmented-bar-chart__inline-data')).not.toBeNull();

    chart.setAttribute('data-view', 'dialog');
    await settle();
    expect(chart.querySelector('details.a11y-segmented-bar-chart__inline-data')).toBeNull();
    expect(chart.querySelector('[data-focus-key="data"]')).not.toBeNull();

    chart.setAttribute('data-view', 'none');
    await settle();
    expect(chart.querySelector('[data-focus-key="data"]')).toBeNull();
    expect(chart.querySelector('table')).toBeNull();
  });

  it('ignores an invalid data-view attribute and uses config', async () => {
    const chart = setup();
    chart.config = { dataView: 'inline' };
    chart.setAttribute('data-view', 'bogus');
    document.body.append(chart); await settle();
    expect(chart.querySelector('details.a11y-segmented-bar-chart__inline-data')).not.toBeNull();
  });

  it('percent-scale attribute overrides config, and config alone controls the default', async () => {
    const formatValue = vi.fn((_context: { value: number; series: string }) => `v`);
    const chart = setup();
    const percents = () => formatValue.mock.calls.filter(([context]) => context.series === 'percentage').map(([context]) => context.value);
    chart.formatValue = formatValue;
    chart.config = { percentScale: 'fraction' };
    chart.setAttribute('percent-scale', 'whole');
    document.body.append(chart); await settle();
    expect(percents()).toContain(60);

    formatValue.mockClear();
    chart.removeAttribute('percent-scale');
    await settle();
    expect(percents()).toContain(0.6);

    formatValue.mockClear();
    chart.config = {};
    await settle();
    expect(percents()).toContain(60);
  });

  it('offers only a CSV download, with no Excel button', async () => {
    const chart = setup();
    chart.config = { dataView: 'inline', showActions: false };
    document.body.append(chart); await settle();
    expect(dataTools(chart).map(button => button.textContent)).toEqual(['Download CSV']);
    expect(chart.textContent).not.toMatch(/excel|xlsx/i);
  });

  it('downloads CSV prefixed with the UTF-8 byte-order mark', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:csv');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const chart = setup();
    chart.config = { dataView: 'inline', showActions: false };
    document.body.append(chart); await settle();
    dataTools(chart)[0]!.click();
    const blob = createObjectURL.mock.calls[0]![0];
    const text = await blob.text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text.slice(1)).toContain('Resolved');
    expect(text.slice(1).startsWith('\ufeff')).toBe(false);
  });
});

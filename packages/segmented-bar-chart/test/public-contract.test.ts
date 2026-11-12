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
    expect(chart.querySelector('.title a')).toBeNull();
    chart.href = 'javascript:alert(1)'; await settle();
    expect(chart.querySelector('.title a')).toBeNull();
    chart.href = '#destination'; await settle();
    expect(chart.querySelector('.title a')?.getAttribute('href')).toBe('#destination');
    expect(chart.querySelector('a button')).toBeNull();
    expect(chart.querySelector('.title a')?.classList.contains('card-link')).toBe(false);
    chart.config = { presentation: 'compact', showDetails: false, showActions: false };
    await settle();
    expect(chart.querySelector('.title a')?.classList.contains('card-link')).toBe(true);
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
    chart.data = [{ id: 'a', label: 'Protected', value: 999, valueSuppressed: true }, { id: 'b', label: 'Missing record', value: null }];
    chart.config = { showCounts: false, showPercentages: false, showSummary: false };
    document.body.append(chart); await settle();
    expect(chart.querySelector('.legend')?.textContent).toContain('Suppressed');
    expect(chart.querySelector('.legend')?.textContent).toContain('Missing');
    expect(chart.textContent).not.toContain('999');
  });
  it('keeps inline data available in screen-reader table mode and reports invalid replacements', async () => {
    const chart = setup();
    chart.config = { dataView: 'inline', tableVisibility: 'screen-reader', showActions: false };
    document.body.append(chart); await settle();
    expect(chart.querySelector('.inline-data summary')).not.toBeNull();
    expect(chart.querySelector('.inline-data [data-focus-key="export:csv"]')).not.toBeNull();
    const changed = vi.fn(); chart.addEventListener('a11y-segmented-bar-chart-data-change', changed);
    chart.data = [{ id: 'invalid', label: 'Invalid', value: -1 }]; await settle();
    expect(chart.querySelector('[role="alert"]')).not.toBeNull();
    expect((changed.mock.calls[0]![0] as CustomEvent).detail.model).toBeNull();
  });

});

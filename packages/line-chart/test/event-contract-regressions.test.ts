import { beforeEach, describe, expect, it, vi } from 'vitest';
import { A11Y_LINE_CHART_TAG_NAME, A11yLineChartElement, defineA11yLineChart } from '../src/index.js';

const settle = async (): Promise<void> => { await Promise.resolve(); };

describe('line chart event contract', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('emits data-change only for changed normalized data after initial render and coalesces updates', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const listener = vi.fn();
    chart.addEventListener('a11y-line-chart-data-change', listener);
    chart.data = [{ x: 'Q1', actual: 1, target: 2 }];
    document.body.append(chart);
    await settle();
    expect(listener).not.toHaveBeenCalled();

    chart.data = [{ x: 'Q1', actual: 1, target: 2 }];
    await settle();
    expect(listener).not.toHaveBeenCalled();

    chart.data = [{ x: 'Q1', actual: 3, target: 4 }];
    chart.data = [{ x: 'Q1', actual: 5, target: 6 }];
    await settle();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].detail.data[0].actual).toBe(5);
  });

  it('includes baseline-only source changes in data-change detail', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.data = [{ x: 2024, actual: 50, target: 60 }, { x: 2025, actual: 70, target: 65 }];
    document.body.append(chart);
    await settle();
    const listener = vi.fn();
    chart.addEventListener('a11y-line-chart-data-change', listener);
    chart.baseline = { x: 2024, value: 45, explanation: 'Prior period' };
    chart.baseline = { x: 2024, value: 55, explanation: 'Updated prior period' };
    await settle();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].detail.model.baseline.value).toBe(55);
  });

  it('distinguishes a Date period from an equal-looking string period', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.data = [{ x: new Date('2025-01-01T00:00:00Z'), actual: 1, target: 2 }];
    document.body.append(chart);
    await settle();
    const listener = vi.fn();
    chart.addEventListener('a11y-line-chart-data-change', listener);
    chart.data = [{ x: '2025-01-01T00:00:00.000Z', actual: 1, target: 2 }];
    await settle();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('emits the first property update after initial render', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.data = [{ x: 2025, actual: 1, target: 2 }];
    document.body.append(chart);
    await settle();
    const listener = vi.fn();
    chart.addEventListener('a11y-line-chart-display-change', listener);
    chart.subtitle = 'Updated after initial render';
    await settle();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].detail.source).toBe('properties');
  });

  it('emits one copied properties display-change after actual updates and none for equivalent assignments', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.data = [{ x: 2025, actual: 1, target: 2 }];
    document.body.append(chart);
    await settle();
    const listener = vi.fn();
    chart.addEventListener('a11y-line-chart-display-change', listener);

    chart.theme = { ...chart.theme };
    chart.config = { ...chart.config };
    chart.context = undefined;
    await settle();
    expect(listener).not.toHaveBeenCalled();

    chart.chartTitle = 'Updated title';
    chart.theme = { ...chart.theme, actualColor: '#123456' };
    chart.definitions = [{ id: 'term', label: 'Term', definition: 'Definition' }];
    await settle();
    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0]?.[0].detail;
    expect(detail.source).toBe('properties');
    expect(detail.chartTitle).toBe('Updated title');
    expect(detail.definitions).toEqual([{ id: 'term', label: 'Term', definition: 'Definition' }]);

    chart.dataNote = 'Changed note';
    await settle();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps user controls on their existing source and avoids a duplicate properties event', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = { showControls: true };
    chart.data = [{ x: 2025, actual: 1, target: 2 }];
    document.body.append(chart);
    await settle();
    const listener = vi.fn();
    chart.addEventListener('a11y-line-chart-display-change', listener);
    chart.subtitle = 'Concurrent property update';
    chart.querySelector<HTMLInputElement>('[data-control="showActualValues"]')!.click();
    await settle();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0]?.[0].detail.source).toBe('controls');
    expect(listener.mock.calls[1]?.[0].detail.source).toBe('properties');

    chart.subtitle = 'An independent property update';
    await settle();
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.calls[2]?.[0].detail.source).toBe('properties');
  });
});

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

  it('never emits settings-change for host-driven property, config, or message updates', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = { showControls: true };
    chart.data = [{ x: 2025, actual: 1, target: 2 }];
    document.body.append(chart);
    await settle();
    const listener = vi.fn();
    chart.addEventListener('a11y-line-chart-settings-change', listener);

    chart.subtitle = 'Host subtitle';
    chart.chartTitle = 'Host title';
    chart.theme = { actualColor: '#123456' };
    chart.definitions = [{ id: 'term', label: 'Term', definition: 'Definition' }];
    chart.dataNote = 'Host note';
    chart.context = 'Host context';
    chart.formatValue = () => 'Formatted';
    chart.config = { showActualValues: true, showTargetLine: false };
    chart.messages = { noData: 'Host message' };
    chart.filtered = true;
    chart.setAttribute('filtered', '');
    await settle();

    expect(listener).not.toHaveBeenCalled();
    expect(chart.config.showActualValues).toBe(true);
    expect(chart.config.showTargetLine).toBe(false);
  });

  it('emits exactly one bubbling settings-change per reader control change, after config reflects it', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = { showControls: true };
    chart.data = [{ x: 2025, actual: 1, target: 2 }];
    document.body.append(chart);
    await settle();
    const listener = vi.fn();
    const configAtEvent: unknown[] = [];
    chart.addEventListener('a11y-line-chart-settings-change', (event) => {
      listener(event);
      configAtEvent.push(chart.config.showActualValues);
    });
    const bubbled = vi.fn();
    document.body.addEventListener('a11y-line-chart-settings-change', bubbled);

    chart.querySelector<HTMLInputElement>('[data-control="showActualValues"]')!.click();
    await settle();

    expect(listener).toHaveBeenCalledOnce();
    expect(bubbled).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0].bubbles).toBe(true);
    expect(listener.mock.calls[0]?.[0].detail).toEqual({ setting: 'showActualValues', value: true, source: 'controls' });
    expect(configAtEvent).toEqual([true]);

    chart.subtitle = 'Host update after reader change';
    await settle();
    expect(listener).toHaveBeenCalledOnce();
    document.body.removeEventListener('a11y-line-chart-settings-change', bubbled);
  });
});

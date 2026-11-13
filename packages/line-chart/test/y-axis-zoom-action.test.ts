import { beforeEach, describe, expect, it, vi } from 'vitest';
import { A11Y_LINE_CHART_TAG_NAME, A11yLineChartElement, defineA11yLineChart } from '../src/index.js';
import { buildChartOptions, shouldSuggestYAxisZoom } from '../src/chart-options.js';
import { resolveConfig, resolveTheme } from '../src/config.js';
import { buildSemanticModel } from '../src/semantic-model.js';
import type { A11yLineChartDatum } from '../src/model.js';

const settle = async (): Promise<void> => { await Promise.resolve(); };

function makeModel(data: A11yLineChartDatum[], overrides: Record<string, unknown> = {}, suppressed = false) {
  const config = resolveConfig(overrides);
  const formatValue = (value: number | null): string => value === null ? 'Missing' : String(value);
  return {
    config,
    model: buildSemanticModel({ config, data, suppressed, formatDifference: ({ value }) => String(value), formatValue, formatXValue: String })
  };
}

describe('Y-axis zoom recommendation and action', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('suggests zoom only when the padded data extent uses at most half of the base domain', () => {
    const focused = [{ x: 'A', actual: 47, target: 50 }, { x: 'B', actual: 54, target: 52 }];
    const wide = [{ x: 'A', actual: 20, target: 20 }, { x: 'B', actual: 80, target: 80 }];
    const focusedModel = makeModel(focused);
    const wideModel = makeModel(wide);
    expect(shouldSuggestYAxisZoom(focusedModel.config, focusedModel.model)).toBe(true);
    expect(shouldSuggestYAxisZoom(wideModel.config, wideModel.model)).toBe(false);
  });

  it('uses semantic actual, target-range, and baseline extents while excluding missing and suppressed points', () => {
    const ranges = [{ x: 'A', actual: 50, target: { min: 40, max: 60 } }, { x: 'B', actual: 50, target: { min: 42, max: 58 } }];
    const rangeModel = makeModel(ranges);
    expect(shouldSuggestYAxisZoom(rangeModel.config, rangeModel.model)).toBe(true);

    const zeroValues = [
      { x: 'A', actual: 0, target: null },
      { x: 'B', actual: 47, target: null },
      { x: 'C', actual: 54, target: null }
    ];
    const plainZero = makeModel(zeroValues);
    expect(shouldSuggestYAxisZoom(plainZero.config, plainZero.model)).toBe(false);
    const suppressedZero = makeModel(zeroValues, {}, true);
    expect(shouldSuggestYAxisZoom(suppressedZero.config, suppressedZero.model)).toBe(true);

    const withBaseline = makeModel(
      [{ x: 'A', actual: 49, target: 50 }, { x: 'B', actual: 51, target: 50 }],
      { yAxisBaseMin: 0, yAxisBaseMax: 100 }
    );
    const baselineModel = buildSemanticModel({
      config: withBaseline.config,
      data: [{ x: 'A', actual: 49, target: 50 }, { x: 'B', actual: 51, target: 50 }],
      baseline: { x: 'A', value: 0 },
      formatDifference: ({ value }) => String(value), formatValue: (value) => String(value), formatXValue: String
    });
    expect(shouldSuggestYAxisZoom(withBaseline.config, baselineModel)).toBe(false);
  });

  it('does not suggest zoom for constant values and falls back to base bounds for out-of-domain extents', () => {
    const constant = makeModel([{ x: 'A', actual: 50, target: 50 }, { x: 'B', actual: 50, target: 50 }]);
    expect(shouldSuggestYAxisZoom(constant.config, constant.model)).toBe(false);

    const outOfBounds = [{ x: 'A', actual: -5, target: 1 }, { x: 'B', actual: 8, target: 9 }];
    const resolved = makeModel(outOfBounds, { initialZoomY: true });
    const options = buildChartOptions({
      config: resolved.config, data: outOfBounds, model: resolved.model,
      formatValue: (value) => String(value), formatXValue: String,
      reducedMotion: false, theme: resolveTheme({})
    });
    expect(options['yAxis']).toMatchObject({ min: 0, max: 100 });
  });

  it('adds a zoom and restore action, synchronizes the checkbox, retains focus, and preserves the chart node', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = { showActions: true, showControls: true, showSummary: false, dataView: 'none' };
    chart.data = [{ x: 'A', actual: 47, target: 50 }, { x: 'B', actual: 54, target: 52 }];
    const settingsChanges = vi.fn();
    chart.addEventListener('a11y-line-chart-settings-change', settingsChanges);
    document.body.append(chart);
    await settle();

    const canvas = chart.querySelector('.a11y-line-chart__chart');
    let action = chart.querySelector<HTMLButtonElement>('[data-focus-key="y-axis-zoom-action"]')!;
    const checkbox = chart.querySelector<HTMLInputElement>('[data-control="initialZoomY"]')!;
    expect(action.textContent).toBe('Zoom Y-axis');
    expect(action.getAttribute('aria-pressed')).toBe('false');
    action.focus(); action.click();
    await settle();
    action = chart.querySelector<HTMLButtonElement>('[data-focus-key="y-axis-zoom-action"]')!;
    expect(chart.config.initialZoomY).toBe(true);
    expect(action.textContent).toBe('Restore full Y-axis');
    expect(action.getAttribute('aria-pressed')).toBe('true');
    expect(chart.querySelector<HTMLInputElement>('[data-control="initialZoomY"]')?.checked).toBe(true);
    expect(document.activeElement).toBe(action);
    expect(chart.querySelector('.a11y-line-chart__chart')).toBe(canvas);
    expect(settingsChanges).toHaveBeenCalledTimes(1);
    expect(settingsChanges.mock.calls[0]?.[0].detail).toEqual({ setting: 'initialZoomY', value: true, source: 'controls' });

    action.click();
    await settle();
    action = chart.querySelector<HTMLButtonElement>('[data-focus-key="y-axis-zoom-action"]')!;
    expect(chart.config.initialZoomY).toBe(false);
    expect(action.textContent).toBe('Zoom Y-axis');
    expect(action.getAttribute('aria-pressed')).toBe('false');
    expect(chart.querySelector<HTMLInputElement>('[data-control="initialZoomY"]')?.checked).toBe(false);
    expect(settingsChanges).toHaveBeenCalledTimes(2);
    expect(settingsChanges.mock.calls[1]?.[0].detail).toEqual({ setting: 'initialZoomY', value: false, source: 'controls' });
    expect(checkbox.isConnected).toBe(false);
  });

  it('offers restore while zoom is active and respects showActions=false', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = { initialZoomY: true, showActions: true, showControls: false, dataView: 'none' };
    chart.data = [{ x: 'A', actual: 50, target: 50 }, { x: 'B', actual: 50, target: 50 }];
    document.body.append(chart);
    await settle();
    expect(chart.querySelector('[data-focus-key="y-axis-zoom-action"]')?.textContent).toBe('Restore full Y-axis');

    chart.config = { ...chart.config, showActions: false };
    await settle();
    expect(chart.querySelector('[data-focus-key="y-axis-zoom-action"]')).toBeNull();
  });

  it('creates restore after manual checkbox zoom when no shortcut was suggested', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = { showActions: true, showControls: true, showSummary: false, dataView: 'none' };
    chart.data = [{ x: 'A', actual: 50, target: 50 }, { x: 'B', actual: 50, target: 50 }];
    document.body.append(chart);
    await settle();
    expect(chart.querySelector('[data-focus-key="y-axis-zoom-action"]')).toBeNull();
    const viewport = chart.querySelector('.a11y-line-chart__chart');
    const checkbox = chart.querySelector<HTMLInputElement>('[data-control="initialZoomY"]')!;

    checkbox.focus(); checkbox.click();
    await settle();
    const restore = chart.querySelector<HTMLButtonElement>('[data-focus-key="y-axis-zoom-action"]');
    expect(chart.config.initialZoomY).toBe(true);
    expect(restore?.textContent).toBe('Restore full Y-axis');
    expect(restore?.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(chart.querySelector('[data-control="initialZoomY"]'));
    expect(chart.querySelector('.a11y-line-chart__chart')).toBe(viewport);

    chart.querySelector<HTMLInputElement>('[data-control="initialZoomY"]')!.click();
    await settle();
    expect(chart.config.initialZoomY).toBe(false);
    expect(chart.querySelector('[data-focus-key="y-axis-zoom-action"]')).toBeNull();
    expect(chart.querySelector('.a11y-line-chart__chart')).toBe(viewport);
  });
});

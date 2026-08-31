import { describe, expect, it } from 'vitest';
import { buildChartOptions, calculateTooltipPosition } from '../src/chart-options.js';
import { resolveConfig, resolveTheme } from '../src/config.js';
import { buildSemanticModel } from '../src/semantic-model.js';

const data = [
  { x: 2024, actual: 72.5, target: 80 },
  { x: 2025, actual: null, target: 82 }
];

function build(config = {}, theme = {}) {
  const resolved = resolveConfig(config);
  const formatValue = (value: number | null) => (value === null ? 'Missing' : `${value}%`);
  const formatXValue = String;
  return buildChartOptions({
    config: resolved,
    data,
    formatValue,
    formatXValue,
    model: buildSemanticModel({
      config: resolved,
      data,
      formatDifference: ({ value }) => `${value}%`,
      formatValue,
      formatXValue
    }),
    reducedMotion: false,
    theme: resolveTheme(theme)
  });
}

describe('buildChartOptions', () => {
  it('keeps tooltips inside the currently visible horizontal scroll window', () => {
    expect(calculateTooltipPosition(
      [500, 200],
      [300, 180],
      [720, 400],
      { left: 200, width: 343 }
    )).toEqual([208, 110]);

    expect(calculateTooltipPosition(
      [220, 20],
      [200, 150],
      [720, 400],
      { left: 200, width: 343 }
    )).toEqual([236, 8]);
  });

  it('builds the original area, outline, and main-series layering', () => {
    const options = build();
    const series = options['series'] as Array<Record<string, unknown>>;

    expect(series.map((item) => item['id'])).toEqual([
      'target-area', 'actual-area', 'target-outline', 'target-main', 'actual-outline', 'actual-main'
    ]);
    const actual = series.find((item) => item['id'] === 'actual-main');
    const target = series.find((item) => item['id'] === 'target-main');
    expect(actual?.['symbol']).toBe('circle');
    expect(target?.['symbol']).toBe('diamond');
    expect((target?.['lineStyle'] as Record<string, unknown>)['type']).toBe('dashed');
  });

  it('keeps hidden series mounted so the legend can show them again', () => {
    const options = build({ showActualLine: false });
    const series = options['series'] as Array<Record<string, unknown>>;
    const legend = options['legend'] as Record<string, unknown>;

    expect(series.map((item) => item['id'])).toEqual([
      'target-area', 'actual-area', 'target-outline', 'target-main', 'actual-outline', 'actual-main'
    ]);
    expect(series.filter((item) => String(item['id']).startsWith('actual')).every((item) => item['name'] === 'Actual')).toBe(true);
    expect(legend['data']).toEqual(['Actual', 'Target']);
    expect((legend['selected'] as Record<string, boolean>)['Actual']).toBe(false);
  });

  it('renders baseline as one reference line and one labeled starting marker', () => {
    const config = resolveConfig({ initialZoomY: true });
    const formatValue = (value: number | null) => value === null ? 'Missing' : `${value}%`;
    const model = buildSemanticModel({
      baseline: { x: 2024, value: 38 },
      config,
      data,
      formatDifference: ({ value }) => `${value} percentage points`,
      formatValue,
      formatXValue: String
    });
    const options = buildChartOptions({
      config,
      data,
      formatValue,
      formatXValue: String,
      model,
      reducedMotion: false,
      theme: resolveTheme({})
    });
    const series = options['series'] as Array<Record<string, unknown>>;
    const baselineLine = series.find((item) => item['id'] === 'baseline-main');
    const baselineMarker = series.find((item) => item['id'] === 'baseline-marker');
    const legend = options['legend'] as { data: string[] };
    const yAxis = options['yAxis'] as { min: number };

    expect(baselineLine?.['data']).toEqual([38, 38]);
    expect(baselineLine?.['symbol']).toBe('none');
    expect(baselineMarker?.['data']).toEqual([['2024', 38]]);
    expect((baselineMarker?.['label'] as Record<string, unknown>)['formatter']).toBe('2024 baseline: 38%');
    expect(legend.data).toEqual(['Actual', 'Target', 'Baseline']);
    expect(yAxis.min).toBeLessThanOrEqual(38);
  });

  it('disables animation for reduced motion', () => {
    const config = resolveConfig({});
    const formatValue = (value: number | null) => String(value);
    const options = buildChartOptions({
      config,
      data,
      formatValue,
      formatXValue: String,
      model: buildSemanticModel({
        config,
        data,
        formatDifference: ({ value }) => String(value),
        formatValue,
        formatXValue: String
      }),
      reducedMotion: true,
      theme: resolveTheme({})
    });

    expect(options['animation']).toBe(false);
    expect(options['animationDuration']).toBe(0);
  });

  it('uses a smooth update transition when motion is allowed', () => {
    const options = build({ initialZoomY: true });

    expect(options['animation']).toBe(true);
    expect(options['animationDurationUpdate']).toBe(650);
    expect(options['animationEasingUpdate']).toBe('cubicInOut');
  });

  it('uses corrected high-contrast default target styling', () => {
    const theme = resolveTheme({});
    expect(theme.targetColor).toBe('#765f00');
    expect(theme.targetColor).not.toBe('#c1a100');
  });

  it('applies independently themed axis and legend font sizes', () => {
    const options = build({}, { axisLabelFontSize: 16, legendFontSize: 18 });
    const legend = options['legend'] as { textStyle: { fontSize: number } };
    const xAxis = options['xAxis'] as { axisLabel: { fontSize: number } };
    const yAxis = options['yAxis'] as { axisLabel: { fontSize: number } };

    expect(legend.textStyle.fontSize).toBe(18);
    expect(xAxis.axisLabel.fontSize).toBe(16);
    expect(yAxis.axisLabel.fontSize).toBe(16);
  });

  it('restores axis title, decimal, zoom, label, and theme configuration', () => {
    const options = build({
      axisDecimalPlaces: 1,
      initialZoomY: true,
      showActualValues: true,
      showXAxisTitle: true,
      showYAxisTitle: true
    });
    const actual = (options['series'] as Array<Record<string, unknown>>).find((item) => item['id'] === 'actual-main');
    const xAxis = options['xAxis'] as Record<string, unknown>;
    const yAxis = options['yAxis'] as Record<string, unknown>;
    expect((actual?.['label'] as Record<string, unknown>)['show']).toBe(true);
    expect(xAxis['name']).toBe('Year');
    expect(yAxis['name']).toBe('Percent');
    expect(yAxis['min']).toBeGreaterThan(0);
    expect((yAxis['axisLabel'] as { formatter: (value: number) => string }).formatter(72.25)).toBe('72.3%');
  });

  it('keeps visual tooltips present but offscreen when visual display is disabled', () => {
    const options = build({ decimalPlaces: 1, showTooltipVisual: false });
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    const tooltip = formatter([{ seriesName: 'Actual', dataIndex: 0 }, { seriesName: 'Target', dataIndex: 0 }]);
    expect(tooltip).toContain('perf-tooltip--visually-hidden');
    expect(tooltip).toContain('Actual is 7.5% below target');
  });

  it('keeps tooltip status color aligned with a below-is-positive outcome', () => {
    const options = build({ positiveDirection: 'below' });
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    const tooltip = formatter([{ seriesName: 'Actual', dataIndex: 0 }, { seriesName: 'Target', dataIndex: 0 }]);
    expect(tooltip).toContain('Target met');
    expect(tooltip).toContain('background:#148f2a');
    expect(tooltip).toContain('below target');
  });

  it('retains the legacy custom tooltip hooks during migration', () => {
    const config = resolveConfig({ decimalPlaces: 1 });
    const formatValue = (value: number | null) => value === null ? 'Missing' : `${value.toFixed(1)}%`;
    const options = buildChartOptions({
      buildTooltipHtml: (context) => `<p>Custom ${context.year}: ${context.actualFormatted}</p>`,
      config,
      data,
      formatValue,
      formatXValue: String,
      model: buildSemanticModel({
        config,
        data,
        formatDifference: ({ value }) => `${value.toFixed(1)} percentage points`,
        formatValue,
        formatXValue: String
      }),
      reducedMotion: false,
      theme: resolveTheme({})
    });
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    expect(formatter([{ seriesName: 'Actual', dataIndex: 0 }])).toBe('<p>Custom 2024: 72.5%</p>');
  });

  it('resolves the complete theme surface from instance-scoped CSS variables', () => {
    const host = document.createElement('div');
    host.style.setProperty('--a11y-line-chart-line-width', '7');
    host.style.setProperty('--a11y-line-chart-axis-label-font-size', '15');
    host.style.setProperty('--a11y-line-chart-legend-font-size', '17');
    host.style.setProperty('--a11y-line-chart-actual-color', '#123456');
    document.body.append(host);
    const theme = resolveTheme({}, host);
    expect(theme.lineWidth).toBe(7);
    expect(theme.axisLabelFontSize).toBe(15);
    expect(theme.legendFontSize).toBe(17);
    expect(theme.actualColor).toBe('#123456');
    expect(theme.actualLineOutlineWidth).toBe(6);
    expect(theme.trendUpSymbol).toBe('↑');
  });
});

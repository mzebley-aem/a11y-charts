import { describe, expect, it } from 'vitest';
import { buildChartOptions, calculateTooltipPosition } from '../src/chart-options.js';
import { resolveConfig, resolveTheme } from '../src/config.js';
import { buildSemanticModel } from '../src/semantic-model.js';
import type { A11yLineChartDatum } from '../src/model.js';

const data = [
  { x: 2024, actual: 72.5, target: 80 },
  { x: 2025, actual: null, target: 82 }
];

function build(config = {}, theme = {}, chartData: A11yLineChartDatum[] = data) {
  const resolved = resolveConfig(config);
  const formatValue = (value: number | null) => (value === null ? 'Missing' : `${value}%`);
  const formatXValue = String;
  return buildChartOptions({
    config: resolved,
    data: chartData,
    formatValue,
    formatXValue,
    model: buildSemanticModel({
      config: resolved,
      data: chartData,
      formatDifference: ({ value }) => `${value}%`,
      formatValue,
      formatXValue
    }),
    reducedMotion: false,
    theme: resolveTheme(theme)
  });
}

describe('buildChartOptions', () => {
  it('masks a suppressed zero before chart series and tooltip hooks while a target zero stays a value', () => {
    const protectedData = [{ x: 'A', actual: 0, target: 88 }];
    let hookContext: import('../src/model.js').A11yLineChartTooltipContext | undefined;
    const config = resolveConfig({ initialZoomY: true, yAxisBaseMin: 0, yAxisBaseMax: 100 });
    const formatValue = (value: number | null) => value === null ? 'Missing' : `${value}`;
    const model = buildSemanticModel({ config, data: protectedData, suppressed: true, formatDifference: ({ value }) => `${value}`, formatValue, formatXValue: String });
    const options = buildChartOptions({
      config, data: protectedData, formatValue, formatXValue: String, model, reducedMotion: false,
      theme: resolveTheme({}), buildTooltipHtml: (context) => { hookContext = context; return context.actualFormatted; }
    });
    const series = options['series'] as Array<Record<string, unknown>>;
    expect(series.find((item) => item['id'] === 'actual-main')?.['data']).toEqual([null]);
    expect(series.find((item) => item['id'] === 'target-main')?.['data']).toEqual([88]);
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    expect(formatter([{ seriesName: 'Actual', dataIndex: 0 }, { seriesName: 'Target', dataIndex: 0 }])).toBe('Suppressed');
    expect(hookContext?.datum).toEqual({ x: 'A', actual: null, target: 88 });
    expect(hookContext?.actualValue).toBeNull();
    expect(hookContext?.actualSuppressed).toBe(true);
    expect(hookContext?.actualFormatted).toBe('Suppressed');
    expect(JSON.stringify(hookContext)).not.toContain('"actual":0');
  });

  it('plots a zero as a real value when the chart-wide suppressed flag is off', () => {
    const options = build({}, {}, [{ x: 2024, actual: 0, target: 80 }]);
    const series = options['series'] as Array<Record<string, unknown>>;
    expect(series.find((item) => item['id'] === 'actual-main')?.['data']).toEqual([0]);
  });
  it('formats axis tick decimals and percentage affixes using the configured locale', () => {
    const percentOptions = build({ locale: 'fr-FR', axisDecimalPlaces: 1 });
    const percentAxis = percentOptions['yAxis'] as { axisLabel: { formatter: (value: number) => string } };
    expect(percentAxis.axisLabel.formatter(12.5)).toBe(new Intl.NumberFormat('fr-FR', {
      style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1
    }).format(0.125));
    const numberOptions = build({ locale: 'es-ES', valuePreset: 'number', axisDecimalPlaces: 2 });
    const numberAxis = numberOptions['yAxis'] as { axisLabel: { formatter: (value: number) => string } };
    expect(numberAxis.axisLabel.formatter(1234.5)).toBe(new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(1234.5));
  });

  const rangeData: A11yLineChartDatum[] = [
    { x: 'A', actual: -4, target: { min: -3, max: -1 } },
    { x: 'B', actual: -1, target: { min: -2, max: 1 } },
    { x: 'C', actual: null, target: null },
    { x: 'D', actual: 2, target: 3 },
    { x: 'E', actual: null, target: { min: 4, max: 6 } }
  ];

  it('plots both range bounds and includes both in the zoom extent', () => {
    const options = build({ initialZoomY: true, yAxisBaseMin: -10, yAxisBaseMax: 10 }, {}, rangeData);
    const series = options['series'] as Array<Record<string, unknown>>;
    expect(series.find((item) => item['id'] === 'target-main')?.['data']).toEqual([-3, -2, null, 3, 4]);
    expect(series.find((item) => item['id'] === 'target-upper')?.['data']).toEqual([-1, 1, null, null, 6]);
    expect(series.find((item) => item['id'] === 'target-area')?.['data']).toEqual([null, null, null, 3, null]);
    const bounds = options['yAxis'] as { min: number; max: number };
    expect(bounds.min).toBeLessThanOrEqual(-4);
    expect(bounds.max).toBeGreaterThanOrEqual(6);
    expect(series.filter((item) => String(item['id']).startsWith('target')).every((item) => item['name'] === 'Target')).toBe(true);
    expect((options['legend'] as { data: unknown[] }).data).toContainEqual({ name: 'Target', icon: 'diamond', itemStyle: { color: '#765f00' } });
    expect((options['legend'] as { data: unknown[] }).data).toContainEqual({ name: 'Actual', icon: 'circle', itemStyle: { color: '#1e62d0' } });
  });

  it('fills only adjacent range intervals and retains whiskers with fill disabled', () => {
    const identityCoords = { coord: (value: number[]) => value };
    const rangeRenderer = (fillTarget: boolean) => {
      const series = build({ fillTarget }, {}, rangeData)['series'] as Array<Record<string, unknown>>;
      return series.find((item) => item['id'] === 'target-range')?.['renderItem'] as (parameters: { dataIndex: number }, api: typeof identityCoords) => { children: Array<Record<string, unknown>> } | undefined;
    };
    const render = rangeRenderer(true);
    expect(render({ dataIndex: 0 }, identityCoords)?.children[0]).toMatchObject({ type: 'polygon', shape: { points: [[0, -3], [1, -2], [1, 1], [0, -1]] } });
    expect(render({ dataIndex: 1 }, identityCoords)?.children.map((item) => item['type'])).toEqual(['line']);
    expect(render({ dataIndex: 2 }, identityCoords)).toBeUndefined();
    expect(render({ dataIndex: 3 }, identityCoords)).toBeUndefined();
    expect(render({ dataIndex: 4 }, identityCoords)?.children.map((item) => item['type'])).toEqual(['line']);
    expect(rangeRenderer(false)({ dataIndex: 0 }, identityCoords)?.children.map((item) => item['type'])).toEqual(['line']);
  });

  it('uses full range labels and matching tooltip status for both bounds', () => {
    const options = build({ showTargetValues: true, positiveDirection: 'below' }, {}, rangeData);
    const series = options['series'] as Array<Record<string, unknown>>;
    const label = series.find((item) => item['id'] === 'target-upper')?.['label'] as { formatter: (parameters: unknown) => string };
    expect(label.formatter({ dataIndex: 1, data: -2 })).toBe('-2% to 1%');
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    const within = formatter([{ seriesId: 'target-upper', seriesName: 'Target', dataIndex: 1 }]);
    expect(within).toContain('-2% to 1%');
    expect(within).toContain('Actual is within target range');
    expect(within).toContain('Target met');
    expect(within).toContain('class="perf-tooltip__status"');
    expect(within).not.toMatch(/style="[^"]*(?:color|background)/);
    const outside = formatter([{ seriesId: 'actual-main', dataIndex: 0 }]);
    expect(outside).toContain('below the lower bound');
    expect(outside).toContain('Target not met');
  });

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

  it('uses decimal-scale bounds when zooming tightly grouped percentage data', () => {
    const config = resolveConfig({ axisDecimalPlaces: 2, initialZoomY: true });
    const hawaiiData = [
      { x: 2018, actual: 0.85, target: 1.03 },
      { x: 2019, actual: 1, target: 0.97 },
      { x: 2020, actual: 0.03, target: 0.97 },
      { x: 2021, actual: 0.93, target: 0.97 },
      { x: 2022, actual: 1.03, target: 0.98 },
      { x: 2023, actual: 0.83, target: 0.99 },
      { x: 2024, actual: null, target: 1 },
      { x: 2025, actual: null, target: 1.1 }
    ];
    const formatValue = (value: number | null) => value === null ? 'Missing' : `${value}%`;
    const model = buildSemanticModel({
      baseline: { x: 2018, value: 0.85 },
      config,
      data: hawaiiData,
      formatDifference: ({ value }) => `${value} percentage points`,
      formatValue,
      formatXValue: String
    });
    const options = buildChartOptions({
      config,
      data: hawaiiData,
      formatValue,
      formatXValue: String,
      model,
      reducedMotion: false,
      theme: resolveTheme({})
    });

    expect(options['yAxis']).toMatchObject({ min: 0, max: 1.25 });
  });

  it('does not repeat baseline content in each tooltip card', () => {
    const config = resolveConfig({});
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
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    const tooltip = formatter([{ seriesName: 'Actual', dataIndex: 0 }, { seriesName: 'Target', dataIndex: 0 }]);

    expect(tooltip).not.toContain('Baseline');
    expect(tooltip).not.toContain('baseline');
    expect(tooltip).toContain('Actual:');
    expect(tooltip).toContain('Target:');
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

  it('keeps tooltip outcome wording independent of theme colors for enhanced contrast', () => {
    const options = build({ positiveDirection: 'below' });
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    const tooltip = formatter([{ seriesName: 'Actual', dataIndex: 0 }, { seriesName: 'Target', dataIndex: 0 }]);
    expect(tooltip).toContain('Target met');
    expect(tooltip).toContain('class="perf-tooltip__status"');
    expect(tooltip).not.toMatch(/style="[^"]*(?:color|background)/);
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

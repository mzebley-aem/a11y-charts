import { describe, expect, it } from 'vitest';
import { buildChartOptions } from '../src/chart-options.js';
import { resolveConfig, resolveTheme } from '../src/config.js';

const data = [
  { x: 2024, actual: 72.5, target: 80 },
  { x: 2025, actual: null, target: 82 }
];

function build(config = {}) {
  return buildChartOptions({
    config: resolveConfig(config),
    data,
    formatValue: (value) => (value === null ? 'Missing' : `${value}%`),
    formatXValue: String,
    reducedMotion: false,
    theme: resolveTheme({})
  });
}

describe('buildChartOptions', () => {
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

  it('removes hidden series from both the chart and legend', () => {
    const options = build({ showActualLine: false });
    const series = options['series'] as Array<Record<string, unknown>>;
    const legend = options['legend'] as Record<string, unknown>;

    expect(series.map((item) => item['id'])).toEqual(['target-area', 'target-outline', 'target-main']);
    expect(legend['data']).toEqual(['Actual', 'Target']);
    expect((legend['selected'] as Record<string, boolean>)['Actual']).toBe(false);
  });

  it('disables animation for reduced motion', () => {
    const options = buildChartOptions({
      config: resolveConfig({}),
      data,
      formatValue: (value) => String(value),
      formatXValue: String,
      reducedMotion: true,
      theme: resolveTheme({})
    });

    expect(options['animation']).toBe(false);
    expect(options['animationDuration']).toBe(0);
  });

  it('uses corrected high-contrast default target styling', () => {
    const theme = resolveTheme({});
    expect(theme.targetColor).toBe('#765f00');
    expect(theme.targetColor).not.toBe('#c1a100');
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

  it('retains the legacy custom tooltip hooks during migration', () => {
    const options = buildChartOptions({
      buildTooltipHtml: (context) => `<p>Custom ${context.year}: ${context.actualFormatted}</p>`,
      config: resolveConfig({ decimalPlaces: 1 }),
      data,
      formatValue: (value) => value === null ? 'Missing' : `${value.toFixed(1)}%`,
      formatXValue: String,
      reducedMotion: false,
      theme: resolveTheme({})
    });
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    expect(formatter([{ seriesName: 'Actual', dataIndex: 0 }])).toBe('<p>Custom 2024: 72.5%</p>');
  });

  it('resolves the complete theme surface from instance-scoped CSS variables', () => {
    const host = document.createElement('div');
    host.style.setProperty('--a11y-line-chart-line-width', '7');
    host.style.setProperty('--a11y-line-chart-actual-color', '#123456');
    document.body.append(host);
    const theme = resolveTheme({}, host);
    expect(theme.lineWidth).toBe(7);
    expect(theme.actualColor).toBe('#123456');
    expect(theme.actualLineOutlineWidth).toBe(6);
    expect(theme.trendUpSymbol).toBe('↑');
  });
});

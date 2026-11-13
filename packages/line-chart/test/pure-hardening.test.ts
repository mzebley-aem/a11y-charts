import { describe, expect, it } from 'vitest';
import { resolveConfig, resolveTheme } from '../src/config.js';
import { pluralLineMessage } from '../src/messages.js';
import { buildChartOptions } from '../src/chart-options.js';
import { buildSemanticModel } from '../src/semantic-model.js';

describe('line pure runtime hardening', () => {
  it('treats null config as defaults and ignores invalid runtime values', () => {
    expect(resolveConfig(null)).toMatchObject({ headingLevel: 2, decimalPlaces: 0, axisDecimalPlaces: 0 });
    const result = resolveConfig({
      showActions: undefined as unknown as boolean,
      decimalPlaces: 1000,
      axisDecimalPlaces: -1,
      headingLevel: 9 as never,
      dataView: 'invalid' as never,
      percentScale: 'invalid' as never,
      trendMode: 'invalid' as never,
      actualPattern: 'invalid' as never,
      minWidth: 1e100,
      perPointMinWidth: -10,
      yAxisBaseMin: 1e100,
      yAxisBaseMax: -1e100
    });
    expect(result).toMatchObject({
      showActions: true, decimalPlaces: 0, axisDecimalPlaces: 0, headingLevel: 2,
      dataView: 'dialog', percentScale: 'whole', trendMode: 'labels',
      actualPattern: 'none', minWidth: 1e100, perPointMinWidth: 70,
      yAxisBaseMin: 0, yAxisBaseMax: 100
    });
    expect(resolveConfig({ minWidth: 1e100, maxWidth: 2e100, perPointMinWidth: 2500, perPointMaxWidth: 5000,
      yAxisBaseMin: -1e100, yAxisBaseMax: 1e100 })).toMatchObject({
      minWidth: 1e100, maxWidth: 2e100, perPointMinWidth: 2500, perPointMaxWidth: 5000,
      yAxisBaseMin: -1e100, yAxisBaseMax: 1e100
    });
  });

  it('bounds numeric theme values and validates theme enums', () => {
    expect(resolveTheme({
      actualSymbolSize: Number.POSITIVE_INFINITY,
      targetSymbolSize: 5000,
      actualFillOpacity: 4,
      actualColor: 123 as never,
      actualPatternType: false as never,
      baselineLineWidth: 'large' as never,
      baselineLineType: 'invalid' as never,
      focusLineType: 'invalid' as never,
      targetPatternType: 'invalid' as never
    })).toMatchObject({
      actualSymbolSize: 12, targetSymbolSize: 5000, actualFillOpacity: 1, baselineLineWidth: 2, actualColor: '#1e62d0',
      actualPatternType: 'none', baselineLineType: 'dotted',
      focusLineType: 'dashed', targetPatternType: 'none'
    });
  });

  it('uses English singular fallback when the requested locale has no override', () => {
    expect(pluralLineMessage({}, 'dataUpdated', 1, 'en-US', { count: 1 }))
      .toBe('Chart data updated. 1 period is available.');
    expect(pluralLineMessage({}, 'differencePercent', 1, 'en-US', { value: '1' }))
      .toBe('1 percentage point');
  });

  it('gives tooltip callbacks defensive copies of model values', () => {
    const sourceDate = new Date('2025-01-01T00:00:00Z');
    const datum = { x: sourceDate, actual: 7, target: { min: 5, max: 8 } };
    const data = [datum];
    const config = resolveConfig({ initialZoomY: true });
    const formatValue = (value: number | null) => String(value);
    const baselineDate = new Date('2024-01-01T00:00:00Z');
    const model = buildSemanticModel({ config, data, baseline: { x: baselineDate, value: 4 }, formatDifference: ({ value }) => String(value), formatValue, formatXValue: String });
    const options = buildChartOptions({
      config, data, model, formatValue, formatXValue: String, reducedMotion: false, theme: resolveTheme({}),
      buildTooltipHtml: (context) => {
        if (context.datum.x instanceof Date) context.datum.x.setFullYear(1999);
        if (context.interpretation.x instanceof Date) context.interpretation.x.setFullYear(1998);
        if (context.interpretation.targetValue && typeof context.interpretation.targetValue === 'object') context.interpretation.targetValue.min = -100;
        if (context.interpretation.baseline?.x instanceof Date) context.interpretation.baseline.x.setFullYear(1997);
        context.theme.actualColor = '#000000';
        return 'ok';
      }
    });
    const formatter = (options['tooltip'] as { formatter: (parameters: unknown) => string }).formatter;
    formatter([{ seriesId: 'actual-main', dataIndex: 0 }]);
    expect(sourceDate.getUTCFullYear()).toBe(2025);
    expect(baselineDate.getUTCFullYear()).toBe(2024);
    expect(model.points[0]!.x).toBeInstanceOf(Date);
    expect(model.points[0]!.baseline?.x).toBeInstanceOf(Date);
    expect((model.points[0]!.baseline?.x as Date).getUTCFullYear()).toBe(2024);
    expect((model.points[0]!.targetValue as { min: number }).min).toBe(5);
  });
});

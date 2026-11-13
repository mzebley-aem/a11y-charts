import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildSegmentedBarModel, buildSegmentedBarCsv,
  validateSegmentedBarData, validateSegmentedBarTotal, resolveConfig,
  type A11ySegmentedBarChartDatum, type A11ySegmentedBarChartValueFormatter
} from '../src/core.js';
import * as segmentedPackage from '../src/index.js';

const part = (value: number | null, id = 'a'): A11ySegmentedBarChartDatum => ({ id, label: id, value });

describe('segmented canonical model integrity', () => {
  it('validates suppressed zeros as plain records', () => {
    const datum = { id: 'protected', label: 'Protected', value: 0 };
    expect(validateSegmentedBarData([datum])).toEqual({ valid: true, data: [{ id: 'protected', label: 'Protected', value: 0 }] });
    const formatter = vi.fn(() => 'formatted');
    const model = buildSegmentedBarModel([datum], { suppressed: true, formatValue: formatter });
    expect(model.rows[0]?.valueText).toBe('Suppressed');
    expect(model.total).toBeNull();
    expect(formatter).not.toHaveBeenCalled();
  });

  it('rejects invalid input and returns stable machine codes', () => {
    expect(validateSegmentedBarData(null).valid).toBe(false);
    for (const value of [-1, Infinity, NaN]) expect(validateSegmentedBarData([part(value)]).valid).toBe(false);
    expect(validateSegmentedBarData([part(1), part(2)])).toMatchObject({ valid: false, code: 'validationDuplicateId' });
    expect(validateSegmentedBarTotal(-1)).toMatchObject({ valid: false, code: 'validationInvalidTotal' });
    expect(buildSegmentedBarModel([part(1)], { total: -1 }).errorCode).toBe('validationInvalidTotal');
  });

  it('copies source records defensively and distinguishes missing from zero', () => {
    const source = [part(0), part(null, 'b')];
    const result = validateSegmentedBarData(source);
    expect(result.valid).toBe(true);
    if (result.valid) result.data[0]!.label = 'Changed';
    expect(source[0]!.label).toBe('a');
    const model = buildSegmentedBarModel(source);
    expect(model.rows.map(row => row.status)).toEqual(['reported', 'missing']);
    expect(model.rows[0]!.valueText).toBe('0');
    expect(model.rows[1]!.valueText).toBe('Not reported');
    expect(model.total).toBeNull();
  });

  it('suppresses zeros only under the chart flag and never infers a suppressed total', () => {
    const model = buildSegmentedBarModel([part(0), part(0, 'b')], { suppressed: true });
    expect(model.rows.map(row => row.status)).toEqual(['suppressed', 'suppressed']);
    expect(model.total).toBeNull();
    expect(model.rows.map(row => row.ratio)).toEqual([0, 0]);
  });

  it('does not renormalize incomplete or mismatching breakdowns', () => {
    const incomplete = buildSegmentedBarModel([part(43), part(null, 'b')], { total: 251 });
    expect(incomplete.rows.map(row => row.ratio)).toEqual([0, 0]);
    expect(incomplete.warning).toContain('missing');
    const mismatch = buildSegmentedBarModel([part(43), part(208, 'b')], { total: 300 });
    expect(mismatch.errorCode).toBe('mismatch');
    expect(mismatch.rows.every(row => row.ratio === 0)).toBe(true);
  });

  it('accepts floating point noise but rejects materially inconsistent tiny totals', () => {
    expect(buildSegmentedBarModel([part(.1), part(.2, 'b')], { total: .3 }).error).toBeNull();
    expect(buildSegmentedBarModel([part(1e-12)], { total: 2e-12 }).errorCode).toBe('mismatch');
  });

  it('requires one comparison value and explicit denominator without inventing a remainder', () => {
    expect(buildSegmentedBarModel([part(251)], { config: { mode: 'comparison' } }).errorCode).toBe('comparisonRequiresTotal');
    const model = buildSegmentedBarModel([part(251)], { total: 614, config: { mode: 'comparison', percentageDecimals: 1 } });
    expect(model.rows).toHaveLength(1);
    expect(model.rows[0]!.percentageText).toBe('40.9%');
    expect(model.summary).toContain('equivalent to');
    expect(model.summary).not.toContain('363');
  });

  it('caps above-reference geometry while retaining actual values and ratios', () => {
    const model = buildSegmentedBarModel([part(150)], { total: 100, config: { mode: 'comparison' } });
    expect(model.rows[0]).toMatchObject({ value: 150, percentage: 1.5, ratio: 1 });
    expect(model.warning).toContain('exceeds');
    expect(model.error).toBeNull();
  });

  it('handles zero denominators and overflow without nonfinite model values or formatter input', () => {
    const zero = buildSegmentedBarModel([part(0)], { total: 0, config: { mode: 'comparison' } });
    expect(zero.rows[0]!.percentage).toBeNull();
    expect(zero.warning).toContain('zero');
    const formatter = vi.fn((_context: { value: number }) => 'safe');
    const overflow = buildSegmentedBarModel([part(Number.MAX_VALUE)], { total: Number.MIN_VALUE, config: { mode: 'comparison' }, formatValue: formatter });
    expect(overflow.rows[0]!.percentage).toBeNull();
    expect(overflow.warning).toContain('numeric range');
    expect(formatter.mock.calls.every(([context]) => Number.isFinite(context.value))).toBe(true);
    const sum = buildSegmentedBarModel([part(Number.MAX_VALUE), part(Number.MAX_VALUE, 'b')]);
    expect(sum.total).toBeNull();
    expect(sum.warning).toContain('numeric range');
  });

  it('falls back for invalid formatter output, messages and configuration', () => {
    for (const output of [undefined, null, 42, '', '   ']) {
      const model = buildSegmentedBarModel([part(5)], { formatValue: (() => output) as A11ySegmentedBarChartValueFormatter });
      expect(model.rows[0]!.valueText).toBe('5');
    }
    const model = buildSegmentedBarModel([part(null)], { messages: { missingValue: null } as unknown as Record<string, string> });
    expect(model.rows[0]!.valueText).toBe('Not reported');
    expect(resolveConfig(null).locale).toBe('en-US');
    expect(resolveConfig({ locale: 'invalid_locale', countDecimals: -1, percentageDecimals: 50 }).percentageDecimals).toBe(2);
  });

  it('formats fixed decimals consistently and keeps highlighted ID valid', () => {
    const model = buildSegmentedBarModel([part(1), part(1, 'b')], { config: { percentageDecimals: 1 } });
    expect(model.rows[0]!.percentageText).toBe('50.0%');
    expect(buildSegmentedBarModel([part(1)], { config: { highlightedId: 'missing' } }).errorCode).toBe('validationInvalidHighlight');
  });

  it('exports source values and localized metadata without leaking protected numbers', () => {
    const model = buildSegmentedBarModel([part(0), { ...part(7, 'b'), label: '=SUM(1,2)' }], { suppressed: true });
    const options = { contextText: '=formula', explanationText: 'Authored explanation', dataNoteText: 'Data note' };
    const csv = buildSegmentedBarCsv(model, options);
    expect(csv).toContain("'=formula");
    expect(csv).toContain("'=SUM(1,2)");
    expect(csv).toContain('Authored explanation');
    expect(csv).toContain('a,Suppressed,Suppressed');
    expect(csv).not.toMatch(/\ba,0\b/);
    expect(csv).toContain('\r\n');
    // The DOM-free helper returns plain text; the element adds the UTF-8 byte-order mark when it creates the download.
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
  });
});

describe('segmented English catalog export', () => {
  it('exposes the English catalog under an unambiguous name while keeping ENGLISH_MESSAGES', () => {
    expect(segmentedPackage.ENGLISH_SEGMENTED_BAR_CHART_MESSAGES).toBe(segmentedPackage.ENGLISH_MESSAGES);
    expect(segmentedPackage.ENGLISH_SEGMENTED_BAR_CHART_MESSAGES.missingValue).toBe('Not reported');
    expect(segmentedPackage.ENGLISH_SEGMENTED_BAR_CHART_MESSAGES.detailsHelp).toContain('Use the arrow keys, Home and End to move between categories.');
  });
});

describe('percent scale and CSV contract', () => {
  const rows = [part(455, 'a'), part(545, 'b')];

  it('passes whole percentages to formatValue by default and fractions when configured', () => {
    const whole = vi.fn((context: { value: number; series: string }) => `W${context.value}`);
    const wholeModel = buildSegmentedBarModel(rows, { formatValue: whole });
    const wholePercents = whole.mock.calls.filter(([context]) => context.series === 'percentage').map(([context]) => context.value);
    expect(wholePercents).toContain(45.5);
    expect(wholeModel.rows[0]!.percentageText).toBe('W45.5');
    expect(whole.mock.calls.filter(([context]) => context.series === 'count').map(([context]) => context.value)).toContain(455);

    const fraction = vi.fn((context: { value: number; series: string }) => `F${context.value}`);
    const fractionModel = buildSegmentedBarModel(rows, { formatValue: fraction, config: { percentScale: 'fraction' } });
    expect(fraction.mock.calls.filter(([context]) => context.series === 'percentage').map(([context]) => context.value)).toContain(0.455);
    expect(fractionModel.rows[0]!.percentageText).toBe('F0.455');
  });

  it('keeps the model percentage and built-in fallback as fractions regardless of percentScale', () => {
    const model = buildSegmentedBarModel(rows, { formatValue: () => '', config: { percentScale: 'whole' } });
    expect(model.rows[0]).toMatchObject({ percentage: 0.455, ratio: 0.455 });
    expect(model.rows[0]!.percentageText).toBe('45.50%');
  });

  it('resolves percentScale to whole unless fraction is requested', () => {
    expect(resolveConfig(null).percentScale).toBe('whole');
    expect(resolveConfig({ percentScale: 'bogus' as 'whole' }).percentScale).toBe('whole');
    expect(resolveConfig({ percentScale: 'fraction' }).percentScale).toBe('fraction');
  });

  it('removes the tableVisibility and showTable options from the resolved config', () => {
    const resolved = resolveConfig({ dataView: 'none' });
    expect(resolved.dataView).toBe('none');
    expect(resolved).not.toHaveProperty('tableVisibility');
    expect(resolveConfig({ dataView: 'bogus' as 'dialog' }).dataView).toBe('dialog');
  });

  it('keeps the shared core free of imports from the bar-chart package', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/core.ts'), 'utf8');
    expect(source).not.toMatch(/from\s+['"][^'"]*bar-chart\//);
    expect(source).not.toMatch(/xlsx/i);
  });
});

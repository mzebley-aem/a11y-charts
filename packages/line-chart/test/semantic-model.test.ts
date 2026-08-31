import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { buildSemanticModel } from '../src/semantic-model.js';
import { validateBaseline } from '../src/validation.js';
import type {
  A11yLineChartBaseline,
  A11yLineChartDatum,
  A11yLineChartSeries
} from '../src/model.js';

function model(
  data: A11yLineChartDatum[],
  options: {
    baseline?: A11yLineChartBaseline;
    positiveDirection?: 'above' | 'below';
    valuePreset?: 'number' | 'percent';
  } = {}
) {
  const config = resolveConfig({
    decimalPlaces: 2,
    ...(options.positiveDirection ? { positiveDirection: options.positiveDirection } : {}),
    ...(options.valuePreset ? { valuePreset: options.valuePreset } : {})
  });
  const formatValue = (value: number | null, _series: A11yLineChartSeries) =>
    value === null ? 'Missing' : `${value.toFixed(2)}${config.valuePreset === 'percent' ? '%' : ''}`;
  return buildSemanticModel({
    ...(options.baseline ? { baseline: options.baseline } : {}),
    config,
    data,
    formatDifference: ({ value, valuePreset }) => valuePreset === 'percent'
      ? `${value.toFixed(2)} percentage points`
      : value.toFixed(2),
    formatValue,
    formatXValue: String
  });
}

describe('buildSemanticModel', () => {
  it('answers the latest reported-period question and includes baseline context', () => {
    const result = model([
      { x: 2015, actual: 40, target: 50 },
      { x: 2019, actual: 72.51, target: 80 },
      { x: 2020, actual: 83.92, target: 77.02 },
      { x: 2021, actual: null, target: 78.27 },
      { x: 2022, actual: null, target: 79.52 }
    ], {
      baseline: { x: 2015, value: 38, explanation: 'A reporting policy changed.' }
    });

    expect(result.summary.latestActualIndex).toBe(2);
    expect(result.summary.primary).toBe('Target met in 2020.');
    expect(result.summary.text).toContain('6.90 percentage points above target');
    expect(result.summary.text).toContain('45.92 percentage points above the 2015 baseline of 38.00%');
    expect(result.summary.text).toContain('1 of 3 comparable reported periods');
    expect(result.summary.text).toContain('No actual data has been reported after 2020');
    expect(result.points[2]?.narrative).toBe(
      '2020, 3 of 5. Target met. Actual 83.92%. Target 77.02%. 6.90 percentage points above target. 45.92 percentage points above the 2015 baseline.'
    );
  });

  it('treats equality as met in either positive direction', () => {
    for (const positiveDirection of ['above', 'below'] as const) {
      const result = model([{ x: 'Q1', actual: 80, target: 80 }], { positiveDirection });
      expect(result.points[0]?.outcome).toBe('met-equal');
      expect(result.summary.primary).toBe('Target met in Q1 — on target.');
    }
  });

  it('evaluates below as the positive direction when configured', () => {
    const result = model([{ x: 2026, actual: 70, target: 80 }], { positiveDirection: 'below' });
    expect(result.points[0]?.outcome).toBe('met');
    expect(result.points[0]?.targetDifference?.description).toBe('10.00 percentage points below target');
  });

  it('does not turn missing actual or target data into a failure', () => {
    const future = model([{ x: 2026, actual: null, target: 80 }]);
    expect(future.summary.primary).toBe('No reported result yet.');
    expect(future.points[0]?.outcome).toBe('unavailable');
    expect(future.points[0]?.narrative).toBe(
      '2026, 1 of 1. No actual value has been reported. Target 80.00%. Target outcome unavailable.'
    );

    const missingTarget = model([{ x: 2026, actual: 70, target: null }]);
    expect(missingTarget.summary.primary).toBe('Target outcome cannot be determined for 2026.');
    expect(missingTarget.summary.comparableCount).toBe(0);
  });

  it('uses generic numeric language without calling differences percentages', () => {
    const result = model([{ x: 'Week 1', actual: 12, target: 10 }], { valuePreset: 'number' });
    expect(result.points[0]?.targetDifference?.description).toBe('2.00 above target');
    expect(result.summary.text).not.toContain('percentage');
  });
});

describe('validateBaseline', () => {
  const data = [{ x: 2015, actual: 40, target: 50 }];

  it('accepts an independent value at the earliest displayed period', () => {
    const result = validateBaseline({ x: 2015, value: 38 }, data);
    expect(result).toMatchObject({ valid: true, baseline: { x: 2015, value: 38 } });
  });

  it('rejects non-finite values and periods outside the comparison boundary', () => {
    expect(validateBaseline({ x: 2015, value: Number.NaN }, data)).toMatchObject({ valid: false });
    expect(validateBaseline({ x: 2014, value: 38 }, data)).toEqual({
      valid: false,
      message: 'Chart baseline x must match the earliest displayed data period.'
    });
  });
});

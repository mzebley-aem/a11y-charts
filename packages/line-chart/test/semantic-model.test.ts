import { describe, expect, it, vi } from 'vitest';
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

const englishModel = (data: A11yLineChartDatum[], suppressed = false) => buildSemanticModel({
  config: resolveConfig({ valuePreset: 'number' }), data, suppressed,
  formatDifference: ({ value }) => String(value),
  formatValue: (value) => value === null ? 'Missing' : String(value),
  formatXValue: String
});

describe('buildSemanticModel', () => {
  it('uses English suppression defaults and identifies protected periods without mislabeling later missing values', () => {
    const unreported = englishModel([
      { x: 2024, actual: 70, target: 80 },
      { x: 2025, actual: 0, target: 80 },
      { x: 2026, actual: null, target: 80 }
    ], true);
    expect(unreported.points[1]).toMatchObject({ actualValue: null, actualSuppressed: true, actualFormatted: 'Suppressed', outcome: 'unavailable' });
    expect(unreported.points[1]?.narrative).toContain('actual value suppressed');
    expect(unreported.points[2]).toMatchObject({ actualValue: null, actualSuppressed: false, actualFormatted: 'Missing' });
    expect(unreported.points[2]?.narrative).not.toContain('suppressed');
    expect(unreported.summary.text).toContain('latest Actual value for 2025 is suppressed');

    const allProtected = englishModel([{ x: 2025, actual: 0, target: 80 }], true);
    expect(allProtected.summary.primary).toBe('Reported values are protected for 2025; the target outcome cannot be determined.');
  });

  it('keeps suppressed zeros distinct from missing, keeps target zero as a value, and reports zero when the flag is off', () => {
    const protectedModel = englishModel([
      { x: 'protected', actual: 0, target: 80 },
      { x: 'missing', actual: null, target: 80 },
      { x: 'target zero', actual: 2, target: 0 }
    ], true);
    expect(protectedModel.points[0]).toMatchObject({ actualValue: null, actualSuppressed: true, actualFormatted: 'Suppressed', outcome: 'unavailable', targetDifference: null });
    expect(protectedModel.points[1]).toMatchObject({ actualValue: null, actualSuppressed: false, actualFormatted: 'Missing' });
    expect(protectedModel.points[2]).toMatchObject({ actualValue: 2, actualSuppressed: false, targetValue: 0, targetFormatted: '0' });

    const plain = englishModel([{ x: 'reported zero', actual: 0, target: 0 }]);
    expect(plain.points[0]).toMatchObject({ actualValue: 0, actualSuppressed: false, actualFormatted: '0', outcome: 'met-equal' });
  });
  it('evaluates inclusive ranges independently of the scalar positive direction', () => {
    for (const positiveDirection of ['above', 'below'] as const) {
      const result = model([69, 70, 75, 80, 81].map((actual, x) => ({ x, actual, target: { min: 70, max: 80 } })), { positiveDirection });
      expect(result.points.map((point) => point.outcome)).toEqual(['not-met', 'met', 'met', 'met', 'not-met']);
      expect(result.points.map((point) => point.relation)).toEqual(['below', 'within', 'within', 'within', 'above']);
      expect(result.summary.metCount).toBe(3);
      expect(result.points[0]?.targetDifference).toMatchObject({ signedValue: -1, description: '1.00 percentage points below the lower bound of target range' });
      expect(result.points[4]?.targetDifference).toMatchObject({ signedValue: 1, description: '1.00 percentage points above the upper bound of target range' });
      expect(result.points[2]?.targetDifference).toMatchObject({ signedValue: 0, relation: 'within', description: 'within target range' });
      expect(result.points[2]?.targetFormatted).toBe('70.00% to 80.00%');
    }
  });

  it('keeps ranges, scalar targets, missing data, and baseline context consistent', () => {
    const result = model([
      { x: 'Q1', actual: 65, target: 60 },
      { x: 'Q2', actual: 75, target: { min: 70, max: 80 } },
      { x: 'Q3', actual: null, target: { min: 72, max: 82 } }
    ], { baseline: { x: 'Q1', value: 50 } });
    expect(result.summary.primary).toBe('Target met in Q2 — within range.');
    expect(result.summary.text).toContain('Target was 70.00% to 80.00%—within target range');
    expect(result.summary.text).toContain('2 of 2 comparable reported periods');
    expect(result.points[1]?.narrative).toContain('Target 70.00% to 80.00%. Actual is within target range.');
    expect(result.points[1]?.baseline?.difference?.signedValue).toBe(25);
    expect(result.points[2]?.outcome).toBe('unavailable');
    expect(result.points[2]?.narrative).toContain('Target 72.00% to 82.00%. Target outcome unavailable.');
  });

  it('supports negative, numeric, and zero-width ranges', () => {
    const result = model([
      { x: 'A', actual: -4, target: { min: -3, max: 0 } },
      { x: 'B', actual: 0, target: { min: 0, max: 0 } }
    ], { valuePreset: 'number' });
    expect(result.points[0]?.targetDifference?.description).toBe('1.00 below the lower bound of target range');
    expect(result.points[1]?.outcome).toBe('met');
    expect(result.points[1]?.targetFormatted).toBe('0.00 to 0.00');
    expect(result.summary.text).not.toContain('percentage');
  });

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
      '2020, 3 of 5. Target met. Actual 83.92%. Target 77.02%. 6.90 percentage points above target.'
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

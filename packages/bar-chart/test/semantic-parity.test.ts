import { describe, expect, it, vi } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { buildBarModel } from '../src/semantic-model.js';
import { validateBarData } from '../src/validation.js';

describe('replacement parity value status and shared scale', () => {
  it('redacts explicitly suppressed values in validated and semantic data without formatting them', () => {
    const valueGetter = vi.fn(() => 9876);
    const source = [Object.defineProperties({ id: 'secret', label: 'Secret', value: 0, valueSuppressed: true }, {
      value: { get: valueGetter, enumerable: true }
    })];
    const validated = validateBarData(source);
    expect(validated).toMatchObject({ valid: true, data: [{ value: null, valueSuppressed: true }] });
    expect(valueGetter).not.toHaveBeenCalled();
    const formatter = vi.fn(() => 'formatted');
    const model = buildBarModel(validated.valid ? validated.data : [], { formatValue: formatter });
    expect(model.rows[0]).toMatchObject({ value: null, status: 'suppressed', valueText: 'Suppressed', percentage: null });
    expect(model.total).toBeNull();
    expect(formatter).not.toHaveBeenCalled();
    expect(buildBarModel(source).rows[0]?.value).toBeNull();
  });

  it('keeps explicit zero reported under legacy global suppression and reports other suppressed rows', () => {
    const model = buildBarModel([
      { id: 'zero', label: 'Zero', value: 0, valueSuppressed: false },
      { id: 'hidden', label: 'Hidden', value: 13, valueSuppressed: true },
      { id: 'missing', label: 'Missing', value: null }
    ], { suppressed: true, total: 40 });
    expect(model.rows.map(({ status, value, percentage }) => ({ status, value, percentage }))).toEqual([
      { status: 'reported', value: 0, percentage: 0 },
      { status: 'suppressed', value: null, percentage: null },
      { status: 'missing', value: null, percentage: null }
    ]);
    expect(model.total).toBe(40);
    expect(model.indicators).toContain('Suppressed');
  });

  it('keeps omitted totals unknown when any explicit value is suppressed', () => {
    const model = buildBarModel([
      { id: 'shown', label: 'Shown', value: 7 },
      { id: 'hidden', label: 'Hidden', value: 99, valueSuppressed: true }
    ]);
    expect(model.rows[0]?.value).toBe(7);
    expect(model.total).toBeNull();
  });

  it('keeps omitted totals unknown in legacy global suppression mode even when every visible count is positive', () => {
    const model = buildBarModel([
      { id: 'a', label: 'A', value: 7 },
      { id: 'b', label: 'B', value: 3 }
    ], { suppressed: true });
    expect(model.rows.map((row) => row.status)).toEqual(['reported', 'reported']);
    expect(model.total).toBeNull();
    expect(model.totalText).toBe('Suppressed');
  });

  it('uses the selected total for percentages while retaining a shared count scale and warning on clipping', () => {
    const model = buildBarModel([
      { id: 'a', label: 'A', value: 40, target: { min: 45, max: 60 } },
      { id: 'b', label: 'B', value: 10 }
    ], { total: 80, config: { scaleMaximum: 50 } });
    expect(model.rows[0]).toMatchObject({ percentage: 0.5, barRatio: 0.8, targetStartRatio: 0.9, targetEndRatio: 1 });
    expect(model.rows[1]?.barRatio).toBe(0.2);
    expect(model.warnings.filter((warning) => warning.includes('shared scale maximum'))).toHaveLength(1);
    expect(resolveConfig({ scaleMaximum: 0 }).scaleMaximum).toBeUndefined();
    expect(resolveConfig({ scaleMaximum: Number.POSITIVE_INFINITY }).scaleMaximum).toBeUndefined();
    expect(resolveConfig({ scaleMaximum: 50 }).scaleMaximum).toBe(50);
  });

  it('preserves an explicitly unknown denominator when inference is disabled', () => {
    const data = [{ id: 'a', label: 'A', value: 40 }];
    const inferred = buildBarModel(data);
    expect(inferred.total).toBe(40);
    expect(inferred.rows[0]?.percentage).toBe(1);

    const unknown = buildBarModel(data, { total: null, config: { inferTotal: false } });
    expect(unknown.total).toBeNull();
    expect(unknown.totalText).toBe('Unavailable');
    expect(unknown.rows[0]?.percentage).toBeNull();
    expect(unknown.rows[0]?.percentageText).toBe('Unavailable');
  });
});

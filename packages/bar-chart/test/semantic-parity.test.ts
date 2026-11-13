import { describe, expect, it, vi } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { buildBarModel } from '../src/semantic-model.js';
import { validateBarData } from '../src/validation.js';

describe('replacement parity value status and shared scale', () => {
  it('redacts suppressed zeros in validated and semantic data without formatting them', () => {
    const source = [{ id: 'secret', label: 'Secret', value: 0 }];
    const validated = validateBarData(source);
    expect(validated).toMatchObject({ valid: true, data: [{ value: 0 }] });
    const formatter = vi.fn(() => 'formatted');
    const model = buildBarModel(validated.valid ? validated.data : [], { suppressed: true, formatValue: formatter });
    expect(model.rows[0]).toMatchObject({ value: null, status: 'suppressed', valueText: 'Suppressed', percentage: null });
    expect(model.total).toBeNull();
    expect(formatter).not.toHaveBeenCalled();
  });

  it('suppresses zeros but keeps other reported values and missing values distinct when the flag is on', () => {
    const model = buildBarModel([
      { id: 'zero', label: 'Zero', value: 0 },
      { id: 'shown', label: 'Shown', value: 13 },
      { id: 'missing', label: 'Missing', value: null }
    ], { suppressed: true, total: 40 });
    expect(model.rows.map(({ status, value, percentage }) => ({ status, value, percentage }))).toEqual([
      { status: 'suppressed', value: null, percentage: null },
      { status: 'reported', value: 13, percentage: 0.325 },
      { status: 'missing', value: null, percentage: null }
    ]);
    expect(model.total).toBe(40);
    expect(model.indicators).toContain('Suppressed');
  });

  it('keeps omitted totals unknown when a zero is suppressed and infers them otherwise', () => {
    const suppressed = buildBarModel([
      { id: 'shown', label: 'Shown', value: 7 },
      { id: 'zero', label: 'Zero', value: 0 }
    ], { suppressed: true });
    expect(suppressed.total).toBeNull();
    expect(suppressed.totalText).toBe('Suppressed');
    const plain = buildBarModel([
      { id: 'shown', label: 'Shown', value: 7 },
      { id: 'zero', label: 'Zero', value: 0 }
    ]);
    expect(plain.total).toBe(7);
    expect(plain.rows[1]).toMatchObject({ status: 'reported', value: 0, valueText: '0' });
  });

  it('infers omitted totals under the flag when no zero is suppressed', () => {
    const model = buildBarModel([
      { id: 'a', label: 'A', value: 7 },
      { id: 'b', label: 'B', value: 3 }
    ], { suppressed: true });
    expect(model.rows.map((row) => row.status)).toEqual(['reported', 'reported']);
    expect(model.total).toBe(10);
    expect(model.totalText).toBe('10');
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

import { describe, expect, it } from 'vitest';
import { validateData } from '../src/validation.js';

describe('target range validation', () => {
  it('accepts mixed targets, legacy periods, missing data, and zero-width ranges', () => {
    expect(validateData([
      { x: 'A', actual: 0, target: { min: -2, max: 2 } },
      { year: 2025, target: { min: 0, max: 0 } },
      { x: 'C', actual: 3, target: 2 },
      { x: 'D' }
    ])).toEqual({ valid: true, data: [
      { x: 'A', actual: 0, target: { min: -2, max: 2 } },
      { x: 2025, actual: null, target: { min: 0, max: 0 } },
      { x: 'C', actual: 3, target: 2 },
      { x: 'D', actual: null, target: null }
    ] });
  });

  it.each([
    { min: 80, max: 70 }, { min: 70 }, { max: 80 },
    { min: null, max: 80 }, { min: '70', max: 80 },
    { min: NaN, max: 80 }, { min: 70, max: Infinity },
    [70, 80], '70–80', Infinity
  ])('rejects malformed target %j with an actionable message', (target) => {
    expect(validateData([{ x: 2025, actual: 75, target }])).toEqual({
      valid: false,
      message: 'Chart data item 1 requires a finite numeric target, null, or a range with finite min and max bounds where min <= max.'
    });
  });

  it('copies range inputs so later consumer mutations cannot change validated data', () => {
    const target = { min: 70, max: 80 };
    const result = validateData([{ x: 2025, actual: 75, target }]);
    target.min = 100;
    expect(result).toMatchObject({ data: [{ target: { min: 70, max: 80 } }] });
  });
});

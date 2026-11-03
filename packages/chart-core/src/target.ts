export interface NumericRange { min: number; max: number }
export type NumericOrRange = number | NumericRange;

export function isNumericRange<T extends NumericRange>(value: number | T | null | undefined): value is T {
  return value !== null && value !== undefined && typeof value === 'object';
}

export function copyNumericOrRange<T extends NumericOrRange>(value: T | null | undefined): T | null {
  return isNumericRange(value) ? { min: value.min, max: value.max } as T : value ?? null;
}

export function compareToNumericOrRange(actual: number, target: NumericOrRange): 'below' | 'within' | 'equal' | 'above' {
  if (isNumericRange(target)) return actual < target.min ? 'below' : actual > target.max ? 'above' : 'within';
  return actual === target ? 'equal' : actual < target ? 'below' : 'above';
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function canonicalLocaleOrDefault(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try { return Intl.getCanonicalLocales(value.trim())[0] ?? fallback; }
  catch { return fallback; }
}

export function isFiniteRange(value: unknown, allowNegative = true): value is { min: number; max: number } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const range = value as Record<string, unknown>;
  return isFiniteNumber(range.min) && isFiniteNumber(range.max)
    && (allowNegative || (range.min >= 0 && range.max >= 0))
    && range.min <= range.max;
}

export function isFiniteScalarOrRange(value: unknown, allowNegative = true): value is number | { min: number; max: number } {
  return (isFiniteNumber(value) && (allowNegative || value >= 0)) || isFiniteRange(value, allowNegative);
}

export function sameScalarOrDate(left: string | number | Date, right: string | number | Date): boolean {
  if (left instanceof Date || right instanceof Date) {
    return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
  }
  return typeof left === typeof right && left === right;
}

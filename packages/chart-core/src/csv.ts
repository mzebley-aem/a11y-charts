export interface CsvCellPolicy {
  /** Quote every cell, as required by the line-chart CSV contract. */
  alwaysQuote?: boolean;
  /** Treat negative numeric literals as safe from formula protection. */
  preserveNegativeNumericLiteral?: boolean;
}

/** Encode one CSV cell while applying the chart-specific spreadsheet-formula policy. */
export function encodeCsvCell(value: string, policy: CsvCellPolicy = {}): string {
  const numeric = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value);
  const formulaPattern = policy.preserveNegativeNumericLiteral
    ? /^[\s\u0000-\u001f]*[=+\-@]/
    : /^[\s\u0000-\u001f]*[=+@-]/;
  const safe = formulaPattern.test(value) && !(policy.preserveNegativeNumericLiteral && numeric) ? `'${value}` : value;
  return policy.alwaysQuote || /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * UTF-8 byte-order mark. Spreadsheet applications use it to detect UTF-8, so
 * accented text opens correctly. Chart elements prepend it to downloaded CSV
 * files; the pure CSV builders return text without it.
 */
export const CSV_BYTE_ORDER_MARK = '﻿';

/** Scale applied to percent values that cross the public API. */
export type PercentScale = 'whole' | 'fraction';

export function resolvePercentScale(value: unknown, fallback: PercentScale = 'whole'): PercentScale {
  return value === 'whole' || value === 'fraction' ? value : fallback;
}

/** Converts a fraction (0.455) to a whole percent (45.5) without floating-point residue. */
export function fractionToWholePercent(value: number): number {
  return Number((value * 100).toPrecision(15));
}

/** Converts a whole percent (45.5) to a fraction (0.455) without floating-point residue. */
export function wholePercentToFraction(value: number): number {
  return Number((value / 100).toPrecision(15));
}

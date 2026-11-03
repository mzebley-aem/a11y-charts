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

import type { A11yLineChartDatum } from './model.js';

export type DataValidationResult =
  | { data: A11yLineChartDatum[]; valid: true }
  | { message: string; valid: false };

function isValidXValue(value: unknown): value is A11yLineChartDatum['x'] {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isValidSeriesValue(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value));
}

export function validateData(value: unknown): DataValidationResult {
  if (!Array.isArray(value)) {
    return { valid: false, message: 'Chart data must be an array.' };
  }

  const data: A11yLineChartDatum[] = [];

  for (const [index, candidate] of value.entries()) {
    if (candidate === null || typeof candidate !== 'object') {
      return {
        valid: false,
        message: `Chart data item ${index + 1} must be an object.`
      };
    }

    const item = candidate as Record<string, unknown>;
    const xValue = item['x'] ?? item['year'];
    if (!isValidXValue(xValue)) {
      return {
        valid: false,
        message: `Chart data item ${index + 1} requires a valid x or year value.`
      };
    }

    if (!isValidSeriesValue(item['actual']) || !isValidSeriesValue(item['target'])) {
      return {
        valid: false,
        message: `Chart data item ${index + 1} requires finite numeric or null actual and target values.`
      };
    }

    data.push({
      x: xValue instanceof Date ? new Date(xValue.getTime()) : xValue,
      actual: item['actual'] ?? null,
      target: item['target'] ?? null
    });
  }

  return { valid: true, data };
}

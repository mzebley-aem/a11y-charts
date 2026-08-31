import type {
  A11yLineChartBaseline,
  A11yLineChartDatum,
  A11yLineChartXValue
} from './model.js';

export type DataValidationResult =
  | { data: A11yLineChartDatum[]; valid: true }
  | { message: string; valid: false };

export type BaselineValidationResult =
  | { baseline: A11yLineChartBaseline | undefined; valid: true }
  | { message: string; valid: false };

function isValidXValue(value: unknown): value is A11yLineChartDatum['x'] {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isValidSeriesValue(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value));
}

function sameXValue(left: A11yLineChartXValue, right: A11yLineChartXValue): boolean {
  if (left instanceof Date || right instanceof Date) {
    return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
  }
  return typeof left === typeof right && left === right;
}

export function validateBaseline(
  value: unknown,
  data: A11yLineChartDatum[]
): BaselineValidationResult {
  if (value === undefined || value === null) {
    return { baseline: undefined, valid: true };
  }
  if (typeof value !== 'object') {
    return { valid: false, message: 'Chart baseline must be an object with x and value properties.' };
  }

  const candidate = value as Record<string, unknown>;
  if (!isValidXValue(candidate['x'])) {
    return { valid: false, message: 'Chart baseline requires a valid x value.' };
  }
  if (typeof candidate['value'] !== 'number' || !Number.isFinite(candidate['value'])) {
    return { valid: false, message: 'Chart baseline requires a finite numeric value.' };
  }
  if (candidate['explanation'] !== undefined && typeof candidate['explanation'] !== 'string') {
    return { valid: false, message: 'Chart baseline explanation must be text when provided.' };
  }
  if (data[0] && !sameXValue(candidate['x'], data[0].x)) {
    return {
      valid: false,
      message: 'Chart baseline x must match the earliest displayed data period.'
    };
  }

  const baseline: A11yLineChartBaseline = {
    value: candidate['value'],
    x: candidate['x'] instanceof Date
      ? new Date(candidate['x'].getTime())
      : candidate['x']
  };
  const explanation = (candidate['explanation'] as string | undefined)?.trim();
  if (explanation) baseline.explanation = explanation;
  return { baseline, valid: true };
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

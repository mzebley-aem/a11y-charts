import type {
  A11yLineChartBaseline,
  A11yLineChartDatum,
  A11yLineChartXValue
} from './model.js';
import { copyTarget } from './target.js';
import { ENGLISH_LINE_CHART_MESSAGES, formatLineMessage } from './messages.js';
import { isFiniteNumber, isFiniteRange, sameScalarOrDate } from '../../chart-core/src/validation.js';

type Translate = (key: keyof typeof ENGLISH_LINE_CHART_MESSAGES, values?: Record<string, unknown>) => string;
const english: Translate = (key, values = {}) => formatLineMessage(ENGLISH_LINE_CHART_MESSAGES[key], values);

export type DataValidationResult =
  | { data: A11yLineChartDatum[]; valid: true }
  | { message: string; valid: false };

export type BaselineValidationResult =
  | { baseline: A11yLineChartBaseline | undefined; valid: true }
  | { message: string; valid: false };

function isValidXValue(value: unknown): value is A11yLineChartDatum['x'] {
  if (typeof value === 'string') return value.trim().length > 0;
  if (isFiniteNumber(value)) return true;
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isValidSeriesValue(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || isFiniteNumber(value);
}

function sameXValue(left: A11yLineChartXValue, right: A11yLineChartXValue): boolean {
  return sameScalarOrDate(left, right);
}

export function validateBaseline(
  value: unknown,
  data: A11yLineChartDatum[],
  translate: Translate = english
): BaselineValidationResult {
  if (value === undefined || value === null) {
    return { baseline: undefined, valid: true };
  }
  if (typeof value !== 'object') {
    return { valid: false, message: translate('validationBaselineObject') };
  }

  const candidate = value as Record<string, unknown>;
  if (!isValidXValue(candidate['x'])) {
    return { valid: false, message: translate('validationBaselineX') };
  }
  if (typeof candidate['value'] !== 'number' || !Number.isFinite(candidate['value'])) {
    return { valid: false, message: translate('validationBaselineValue') };
  }
  if (candidate['explanation'] !== undefined && typeof candidate['explanation'] !== 'string') {
    return { valid: false, message: translate('validationBaselineExplanation') };
  }
  if (data[0] && !sameXValue(candidate['x'], data[0].x)) {
    return {
      valid: false,
      message: translate('validationBaselinePeriod')
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

export function validateData(value: unknown, translate: Translate = english): DataValidationResult {
  if (!Array.isArray(value)) {
    return { valid: false, message: translate('validationDataArray') };
  }

  const data: A11yLineChartDatum[] = [];

  for (const [index, candidate] of value.entries()) {
    if (candidate === null || typeof candidate !== 'object') {
      return {
        valid: false,
        message: translate('validationDataItemObject', { index: index + 1 })
      };
    }

    const item = candidate as Record<string, unknown>;
    if ((item['actualSuppressed'] !== undefined && typeof item['actualSuppressed'] !== 'boolean')
      || (item['targetSuppressed'] !== undefined && typeof item['targetSuppressed'] !== 'boolean')) {
      return { valid: false, message: translate('validationSuppressionFlag', { index: index + 1 }) };
    }
    const xValue = item['x'] ?? item['year'];
    if (!isValidXValue(xValue)) {
      return {
        valid: false,
        message: translate('validationDataX', { index: index + 1 })
      };
    }

    if (!isValidSeriesValue(item['actual'])) {
      return {
        valid: false,
        message: translate('validationDataActual', { index: index + 1 })
      };
    }

    const target = item['target'];
    if (!isValidSeriesValue(target)) {
      const range = target as Record<string, unknown> | null;
      if (!isFiniteRange(range)) {
        return {
          valid: false,
          message: translate('validationDataTarget', { index: index + 1 })
        };
      }
    }

    const normalized: A11yLineChartDatum = {
      x: xValue instanceof Date ? new Date(xValue.getTime()) : xValue,
      actual: item['actualSuppressed'] === true ? null : item['actual'] ?? null,
      target: item['targetSuppressed'] === true ? null : copyTarget(target as A11yLineChartDatum['target'])
    };
    if (item['actualSuppressed'] === true) normalized.actualSuppressed = true;
    if (item['targetSuppressed'] === true) normalized.targetSuppressed = true;
    data.push(normalized);
  }

  return { valid: true, data };
}

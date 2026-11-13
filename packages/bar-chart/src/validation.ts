import type { A11yBarChartDatum, BarValidationResult } from './model.js';
import { message } from './messages.js';
import { copyTarget } from './target.js';
import { isFiniteNumber, isFiniteScalarOrRange } from '../../chart-core/src/validation.js';

export function validateBarData(input: unknown): BarValidationResult {
  if (!Array.isArray(input)) {
    return { valid: false, code: 'validationInvalidData', message: message('validationInvalidData') };
  }
  const ids = new Set<string>();
  const data: A11yBarChartDatum[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const item: unknown = input[index];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, code: 'validationInvalidRecord', message: message('validationInvalidRecord', undefined, { position: index + 1 }), params: { position: index + 1 } };
    }
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || !record.id.trim()) {
      return { valid: false, code: 'validationEmptyId', message: message('validationEmptyId') };
    }
    if (ids.has(record.id)) {
      return { valid: false, code: 'validationDuplicateId', message: message('validationDuplicateId', undefined, { id: record.id }), params: { id: record.id } };
    }
    if (typeof record.label !== 'string') {
      return { valid: false, code: 'validationInvalidLabel', message: message('validationInvalidLabel', undefined, { id: record.id }), params: { id: record.id } };
    }
    const value = record.value;
    if (value !== null && (!isFiniteNumber(value) || value < 0)) {
      return { valid: false, code: 'validationInvalidValue', message: message('validationInvalidValue', undefined, { id: record.id }), params: { id: record.id } };
    }
    if (record.definition !== undefined && typeof record.definition !== 'string') {
      return { valid: false, code: 'validationInvalidRecord', message: message('validationInvalidRecord', undefined, { position: index + 1 }), params: { position: index + 1 } };
    }
    const target = record.target;
    if (target != null && !isFiniteScalarOrRange(target, false)) {
      return { valid: false, code: 'validationInvalidTarget', message: message('validationInvalidTarget', undefined, { id: record.id }), params: { id: record.id } };
    }
    ids.add(record.id);
    data.push({
      id: record.id,
      label: record.label,
      value: value as number | null,
      ...(target !== undefined ? { target: copyTarget(target as A11yBarChartDatum['target']) } : {}),
      ...(typeof record.definition === 'string' ? { definition: record.definition } : {})
    });
  }
  return { valid: true, data };
}

export function validateBarTotal(total: unknown): { valid: true; total: number | null } | { valid: false; code: string; message: string } {
  if (total === undefined || total === null) return { valid: true, total: null };
  if (typeof total === 'number' && Number.isFinite(total) && total >= 0) return { valid: true, total };
  return { valid: false, code: 'validationInvalidTotal', message: message('validationInvalidTotal') };
}

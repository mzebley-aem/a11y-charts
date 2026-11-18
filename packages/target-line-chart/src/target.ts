import type { A11yTargetLineChartTarget, A11yTargetLineChartTargetRange } from './model.js';
import { copyNumericOrRange, isNumericRange } from '../../chart-core/src/target.js';

export function isTargetRange(target: A11yTargetLineChartTarget | null | undefined): target is A11yTargetLineChartTargetRange {
  return isNumericRange<A11yTargetLineChartTargetRange>(target);
}

export function copyTarget(target: A11yTargetLineChartTarget | null | undefined): A11yTargetLineChartTarget | null {
  return copyNumericOrRange(target);
}

export function formatTarget(
  target: A11yTargetLineChartTarget | null | undefined,
  format: (value: number | null) => string,
  rangeSeparator = 'to'
): string {
  return isTargetRange(target) ? `${format(target.min)} ${rangeSeparator} ${format(target.max)}` : format(target ?? null);
}

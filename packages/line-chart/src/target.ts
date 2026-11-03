import type { A11yLineChartTarget, A11yLineChartTargetRange } from './model.js';
import { copyNumericOrRange, isNumericRange } from '../../chart-core/src/target.js';

export function isTargetRange(target: A11yLineChartTarget | null | undefined): target is A11yLineChartTargetRange {
  return isNumericRange<A11yLineChartTargetRange>(target);
}

export function copyTarget(target: A11yLineChartTarget | null | undefined): A11yLineChartTarget | null {
  return copyNumericOrRange(target);
}

export function formatTarget(
  target: A11yLineChartTarget | null | undefined,
  format: (value: number | null) => string,
  rangeSeparator = 'to'
): string {
  return isTargetRange(target) ? `${format(target.min)} ${rangeSeparator} ${format(target.max)}` : format(target ?? null);
}

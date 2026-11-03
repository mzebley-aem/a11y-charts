import type { A11yBarChartTarget, A11yBarChartTargetRange } from './model.js';
import { copyNumericOrRange, isNumericRange } from '../../chart-core/src/target.js';

export function isTargetRange(target: A11yBarChartTarget | null | undefined): target is A11yBarChartTargetRange {
  return isNumericRange<A11yBarChartTargetRange>(target);
}

export function copyTarget(target: A11yBarChartTarget | null | undefined): A11yBarChartTarget | null {
  return copyNumericOrRange(target);
}

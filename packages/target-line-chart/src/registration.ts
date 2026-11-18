import { A11yTargetLineChartElement } from './a11y-target-line-chart-element.js';

export const A11Y_TARGET_LINE_CHART_TAG_NAME = 'a11y-target-line-chart';

export function defineA11yTargetLineChart(): void {
  if (!customElements.get(A11Y_TARGET_LINE_CHART_TAG_NAME)) {
    customElements.define(A11Y_TARGET_LINE_CHART_TAG_NAME, A11yTargetLineChartElement);
  }
}

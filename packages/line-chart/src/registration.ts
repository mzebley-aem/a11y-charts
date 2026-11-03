import { A11yLineChartElement } from './a11y-line-chart-element.js';

export const A11Y_LINE_CHART_TAG_NAME = 'a11y-line-chart';

export function defineA11yLineChart(): void {
  if (!customElements.get(A11Y_LINE_CHART_TAG_NAME)) {
    customElements.define(A11Y_LINE_CHART_TAG_NAME, A11yLineChartElement);
  }
}

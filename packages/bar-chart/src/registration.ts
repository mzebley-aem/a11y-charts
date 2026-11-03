import { A11yBarChartElement } from './a11y-bar-chart-element.js';

export const A11Y_BAR_CHART_TAG_NAME = 'a11y-bar-chart';

export function defineA11yBarChart(): void {
  if (!customElements.get(A11Y_BAR_CHART_TAG_NAME)) {
    customElements.define(A11Y_BAR_CHART_TAG_NAME, A11yBarChartElement);
  }
}

import { A11yBarChartGroupElement } from './a11y-bar-chart-group-element.js';
export const A11Y_BAR_CHART_GROUP_TAG_NAME = 'a11y-bar-chart-group';
export function defineA11yBarChartGroup(): void {
  defineA11yBarChart();
  if (!customElements.get(A11Y_BAR_CHART_GROUP_TAG_NAME)) {
    customElements.define(A11Y_BAR_CHART_GROUP_TAG_NAME, A11yBarChartGroupElement);
  }
}

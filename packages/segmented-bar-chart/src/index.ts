export * from './core.js';
export { A11ySegmentedBarChartElement } from './element.js';
import { A11ySegmentedBarChartElement } from './element.js';
export const A11Y_SEGMENTED_BAR_CHART_TAG_NAME = 'a11y-segmented-bar-chart';
export function defineA11ySegmentedBarChart(): void {
  if (!customElements.get(A11Y_SEGMENTED_BAR_CHART_TAG_NAME))
    customElements.define(
      A11Y_SEGMENTED_BAR_CHART_TAG_NAME,
      A11ySegmentedBarChartElement,
    );
}

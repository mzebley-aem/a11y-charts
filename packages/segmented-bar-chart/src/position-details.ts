import { positionFloatingCard } from '../../chart-core/src/ui/position-floating-card.js';

/** Namespaced in-flow class; the shared positioner only adds or removes the class it is given. */
export const SEGMENTED_IN_FLOW_CLASS = 'a11y-segmented-bar-chart__in-flow';

export function positionSegmentDetails(card: HTMLElement, anchor: DOMRect, preferredSide: 'above' | 'below' = 'below'): void {
  positionFloatingCard(card, anchor, preferredSide, SEGMENTED_IN_FLOW_CLASS);
}

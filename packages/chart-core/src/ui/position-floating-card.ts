/** Position a desktop detail card beside its active hover or focus anchor.
 * Retain ordinary flow on small screens or when a tall card cannot fit safely.
 */
export function positionFloatingCard(card: HTMLElement, anchor: DOMRect, preferredSide: 'above' | 'below' = 'below', inFlowClass = 'in-flow'): void {
  card.classList.remove('above', inFlowClass);
  for (const property of ['left', 'right', 'top', 'bottom', 'inset-inline-start', 'inset-inline-end', 'inset-block-start', 'inset-block-end']) card.style.removeProperty(property);
  if (window.matchMedia('(max-width: 36rem)').matches) return;

  const gap = 8;
  const size = card.getBoundingClientRect();
  const below = window.innerHeight - anchor.bottom - gap;
  const above = anchor.top - gap;
  if (size.height > window.innerHeight - 2 * gap || (size.height > below && size.height > above)) {
    card.classList.add(inFlowClass);
    return;
  }
  const parent = card.offsetParent as HTMLElement | null;
  if (!parent) return;
  const bounds = parent.getBoundingClientRect();
  // Stay within both the containing row/legend and the viewport.
  const minimumLeft = Math.max(gap, bounds.left);
  const maximumLeft = Math.max(minimumLeft, Math.min(window.innerWidth - gap, bounds.right) - size.width);
  const left = Math.max(minimumLeft, Math.min(anchor.left, maximumLeft));
  const placeAbove = size.height <= above && (preferredSide === 'above' || size.height > below);
  const top = placeAbove ? anchor.top - gap - size.height : anchor.bottom + gap;
  card.style.insetInlineStart = 'auto';
  card.style.insetInlineEnd = 'auto';
  card.style.insetBlockStart = 'auto';
  card.style.insetBlockEnd = 'auto';
  card.style.right = 'auto';
  card.style.bottom = 'auto';
  card.style.left = `${left - bounds.left - parent.clientLeft + parent.scrollLeft}px`;
  card.style.top = `${top - bounds.top - parent.clientTop + parent.scrollTop}px`;
}

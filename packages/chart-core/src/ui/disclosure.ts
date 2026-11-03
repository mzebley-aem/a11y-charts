/** Synchronizes a disclosure button and its controlled content. */
export function setDisclosure(button: HTMLButtonElement, content: HTMLElement, expanded: boolean): void {
  button.setAttribute('aria-expanded', String(expanded));
  content.hidden = !expanded;
}

export function toggleDisclosure(button: HTMLButtonElement, content: HTMLElement): boolean {
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  setDisclosure(button, content, expanded);
  return expanded;
}

export type ModalOpenResult = 'opened' | 'already-open' | 'unsupported' | 'failed';
export type ModalCloseResult = 'closed' | 'already-closed' | 'failed';
export interface ModalControllerOptions {
  dialog: HTMLDialogElement;
  host: HTMLElement;
  getOpener: () => HTMLElement | undefined;
  onStateChange?: (open: boolean) => void;
}

/** Owns one native modal's open state, focus containment, and reconnect lifecycle. */
export class ModalController {
  #options: ModalControllerOptions;
  #abort = new AbortController();
  #reopenOnConnect = false;
  #suppressClose = false;
  #open = false;

  constructor(options: ModalControllerOptions) {
    this.#options = options;
    const { dialog } = options;
    const { signal } = this.#abort;
    dialog.addEventListener('close', () => {
      // Native close is queued. Ignore an old close notification after reconnect/showModal.
      if (this.#suppressClose || dialog.open || this.#reopenOnConnect) return;
      if (!this.#open) return;
      this.#open = false; options.onStateChange?.(false);
      if (options.host.isConnected) this.#focusOpener();
    }, { signal });
    // Capture at document level as some engines can let focus fall to the
    // document when dialog contents are replaced. A dialog-local listener
    // cannot recover focus once Tab is already outside the dialog.
    document.addEventListener('keydown', (event) => this.#trapFocus(event), { capture: true, signal });
  }

  get isOpen(): boolean { return this.#open; }

  open(focusTarget?: HTMLElement): ModalOpenResult {
    const { dialog } = this.#options;
    if (dialog.open) {
      this.#reopenOnConnect = false;
      if (!this.#open) this.#publish(true);
      if (focusTarget && dialog.contains(focusTarget) && this.#isVisible(focusTarget)) focusTarget.focus();
      return 'already-open';
    }
    if (typeof dialog.showModal !== 'function') return 'unsupported';
    try { dialog.showModal(); } catch { return 'failed'; }
    this.#reopenOnConnect = false;
    this.#publish(true);
    if (focusTarget && dialog.contains(focusTarget) && this.#isVisible(focusTarget)) focusTarget.focus();
    return 'opened';
  }

  close(restoreFocus = true): ModalCloseResult {
    const { dialog } = this.#options;
    if (!dialog.open && !this.#open) return 'already-closed';
    this.#reopenOnConnect = false;
    if (dialog.open && !this.#closeNative()) return 'failed';
    if (this.#open) this.#publish(false);
    if (restoreFocus && this.#options.host.isConnected) this.#focusOpener();
    return dialog.open ? 'failed' : 'closed';
  }

  /** Call before detaching the chart host; state changes immediately despite queued native close. */
  disconnect(reopenOnConnect = this.#open): void {
    this.#reopenOnConnect = reopenOnConnect;
    if (this.#options.dialog.open) this.#closeNative();
    if (this.#open) this.#publish(false);
  }

  reconnect(focusTarget?: HTMLElement): ModalOpenResult | 'not-requested' {
    if (!this.#reopenOnConnect) return 'not-requested';
    const result = this.open(focusTarget);
    if (result === 'opened' || result === 'already-open') this.#reopenOnConnect = false;
    return result;
  }

  destroy(): void { this.disconnect(false); this.#abort.abort(); }

  #publish(open: boolean): void { this.#open = open; this.#options.onStateChange?.(open); }

  #closeNative(): boolean {
    this.#suppressClose = true;
    try {
      this.#options.dialog.close();
      return !this.#options.dialog.open;
    } catch {
      return false;
    } finally {
      this.#suppressClose = false;
    }
  }

  #focusOpener(): void {
    const opener = this.#options.getOpener();
    if (opener && this.#isVisible(opener)) opener.focus({ preventScroll: true });
  }

  #isVisible(element: HTMLElement): boolean {
    if (!element.isConnected || element.matches(':disabled') || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    for (let current: Element | null = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    }
    return true;
  }

  #trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const { dialog } = this.#options;
    if (!dialog.open || !dialog.isConnected || !this.#isCurrentModal(dialog)) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]')]
      .filter((element) => this.#isVisible(element) && (element.tabIndex >= 0));
    const active = document.activeElement;
    if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
    // Advance explicitly instead of delegating to native Tab traversal. WebKit
    // can skip dialog buttons under its full-keyboard-access preference, and
    // after content replacement it can move focus outside the native dialog.
    // The candidate list follows DOM order and visibility/disabled state.
    event.preventDefault();
    const activeIndex = focusable.indexOf(active as HTMLElement);
    const nextIndex = activeIndex < 0
      ? (event.shiftKey ? focusable.length - 1 : 0)
      : (activeIndex + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
    focusable[nextIndex]?.focus({ preventScroll: true });
  }

  #isCurrentModal(dialog: HTMLDialogElement): boolean {
    const openDialogs = [...document.querySelectorAll<HTMLDialogElement>('dialog')].filter((candidate) => {
      if (!candidate.open) return false;
      try { return candidate.matches(':modal'); } catch { return candidate.open; }
    });
    if (openDialogs.length === 0) return dialog.open;
    return openDialogs[openDialogs.length - 1] === dialog;
  }
}

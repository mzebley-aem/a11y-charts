export interface FloatingCardClassNames {
  activeRoot?: string;
  above?: string;
  inFlow?: string;
}

export interface FloatingCardEntry {
  root: HTMLElement;
  card: HTMLElement;
  status?: HTMLElement;
  trigger?: HTMLButtonElement;
  /** Virtual positioning for chart points that have no focusable trigger. */
  anchor?: () => DOMRect | undefined;
  onDismiss?: () => void;
}

export interface FloatingCardControllerOptions {
  previewText: string;
  pinnedText: string;
  classNames?: FloatingCardClassNames;
  closeDelayMs?: number;
  /** Set false for noninteractive chart tooltips. */
  allowPin?: boolean;
}

/** Owns transient and pinned nonmodal cards for one chart instance. */
export class FloatingCardController {
  #entries = new Set<FloatingCardEntry>();
  #entryAborts = new Map<FloatingCardEntry, AbortController>();
  #active: FloatingCardEntry | undefined;
  #pointer: FloatingCardEntry | undefined;
  #dismissed: FloatingCardEntry | undefined;
  #pinned = false;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #abort = new AbortController();
  #options: FloatingCardControllerOptions;

  constructor(options: FloatingCardControllerOptions) {
    this.#options = options;
    const { signal } = this.#abort;
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !this.#active || document.activeElement?.closest('dialog[open]')) return;
      event.preventDefault(); event.stopPropagation(); this.hide(true);
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (this.#active && event.target instanceof Node && !this.#active.root.contains(event.target)) this.hide();
    }, { signal });
    window.addEventListener('resize', () => this.reposition(), { signal });
    document.addEventListener('scroll', () => this.reposition(), { signal, capture: true });
  }

  register(entry: FloatingCardEntry): () => void {
    this.#entries.add(entry);
    entry.card.hidden = true;
    const entryAbort = new AbortController();
    this.#entryAborts.set(entry, entryAbort);
    const signal = entryAbort.signal;
    entry.root.addEventListener('pointerenter', (event) => {
      if ((event as PointerEvent).pointerType === 'touch') return;
      this.#pointer = entry; this.#cancelTimer();
      if (this.#dismissed !== entry) this.show(entry);
    }, { signal });
    entry.root.addEventListener('pointerleave', () => {
      if (this.#pointer === entry) this.#pointer = undefined;
      if (this.#dismissed === entry && !entry.root.contains(document.activeElement)) this.#dismissed = undefined;
      this.#scheduleClose();
    }, { signal });
    entry.root.addEventListener('focusin', () => {
      this.#cancelTimer();
      if (this.#active !== entry && this.#pinned) this.hide();
      if (this.#dismissed !== entry) this.show(entry);
    }, { signal });
    entry.root.addEventListener('focusout', (event) => {
      if (event.relatedTarget instanceof Node && entry.root.contains(event.relatedTarget)) return;
      // Dismissal lasts only while the original focus stays inside. Once it
      // leaves, a later deliberate keyboard entry is a new preview request,
      // even if the pointer has not yet left this root.
      if (this.#dismissed === entry) this.#dismissed = undefined;
      if (this.#active === entry && this.#pinned) this.hide(); else this.#scheduleClose();
    }, { signal });
    if (entry.trigger && this.#options.allowPin !== false) entry.trigger.addEventListener('click', () => this.togglePinned(entry), { signal });
    return () => {
      if (this.#active === entry) this.hide();
      this.#entries.delete(entry);
      this.#entryAborts.get(entry)?.abort();
      this.#entryAborts.delete(entry);
      if (this.#pointer === entry) this.#pointer = undefined;
      if (this.#dismissed === entry) this.#dismissed = undefined;
    };
  }

  show(entry: FloatingCardEntry, pinned = false): boolean {
    if (!this.#entries.has(entry)) return false;
    if (this.#active === entry && this.#pinned && !pinned) return true;
    if (this.#active !== entry) {
      if (this.#pinned && this.#active) return false;
      if (this.#active?.root.contains(document.activeElement)) return false;
      this.hide();
      this.#active = entry; this.#dismissed = undefined;
    }
    this.#pinned = pinned;
    entry.card.hidden = false;
    if (this.#options.classNames?.activeRoot) entry.root.classList.add(this.#options.classNames.activeRoot);
    entry.trigger?.setAttribute('aria-expanded', 'true');
    entry.trigger?.setAttribute('aria-pressed', String(pinned));
    if (entry.status) entry.status.textContent = pinned ? this.#options.pinnedText : this.#options.previewText;
    this.reposition();
    return true;
  }

  hide(dismiss = false): void {
    this.#cancelTimer();
    const entry = this.#active;
    if (!entry) return;
    if (dismiss) { this.#dismissed = entry; entry.onDismiss?.(); }
    this.#active = undefined; this.#pinned = false;
    entry.card.hidden = true;
    if (this.#options.classNames?.activeRoot) entry.root.classList.remove(this.#options.classNames.activeRoot);
    for (const name of [this.#options.classNames?.above, this.#options.classNames?.inFlow]) if (name) entry.card.classList.remove(name);
    entry.trigger?.setAttribute('aria-expanded', 'false'); entry.trigger?.setAttribute('aria-pressed', 'false');
  }

  togglePinned(entry: FloatingCardEntry): void {
    if (this.#active === entry && this.#pinned) { this.hide(true); return; }
    if (this.#active !== entry) this.hide();
    this.#dismissed = undefined;
    this.show(entry, true);
  }

  reposition(): void {
    const entry = this.#active;
    const anchor = entry?.anchor?.() ?? (entry?.root.isConnected ? entry.root.getBoundingClientRect() : undefined);
    if (!entry || !anchor) return;
    const above = this.#options.classNames?.above;
    const inFlow = this.#options.classNames?.inFlow;
    if (above) entry.card.classList.remove(above);
    if (inFlow) entry.card.classList.remove(inFlow);
    if (window.matchMedia?.('(max-width: 36rem)').matches) return;
    const height = entry.card.getBoundingClientRect().height;
    if (window.innerHeight - anchor.bottom < height + 16) {
      if (anchor.top >= height + 16 && above) entry.card.classList.add(above);
      else if (inFlow) entry.card.classList.add(inFlow);
    }
  }

  destroy(): void {
    this.#cancelTimer(); this.#abort.abort(); this.hide();
    for (const abort of this.#entryAborts.values()) abort.abort();
    this.#entryAborts.clear(); this.#entries.clear();
  }

  #scheduleClose(): void {
    this.#cancelTimer();
    this.#timer = setTimeout(() => {
      const entry = this.#active;
      if (entry && !this.#pinned && this.#pointer !== entry && !entry.root.contains(document.activeElement)) this.hide();
    }, this.#options.closeDelayMs ?? 180);
  }
  #cancelTimer(): void { if (this.#timer !== undefined) clearTimeout(this.#timer); this.#timer = undefined; }
}

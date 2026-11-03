import type { A11yBarChartConfig, A11yBarChartDatum, A11yBarChartTheme, A11yBarChartValueFormatter } from './model.js';
import type { MessageDictionary } from './messages.js';
import { validateBarData, validateBarTotal } from './validation.js';
import { renderRichContent } from './rich-content.js';
import type { A11yBarChartElement } from './a11y-bar-chart-element.js';
import type { A11yBarChartGroupMessages, A11yBarChartGroupSelectionChangeDetail, A11yBarChartPreparedView, A11yBarChartViewSection } from './grouped-model.js';

const DEFAULT_GROUP_MESSAGES: Required<A11yBarChartGroupMessages> = {
  selectorLabel: 'Choose a population view',
  collapseSection: 'Collapse {label}',
  expandSection: 'Expand {label}',
  empty: 'No population views are available.',
  invalid: 'The population views are invalid. Check section IDs, view IDs, totals, and chart data.',
  selectionStatus: 'Showing {label}.'
};

function copyView(view: A11yBarChartPreparedView): A11yBarChartPreparedView {
  const validation = validateBarData(view.data);
  return { ...view, data: validation.valid ? validation.data : [] };
}

function safeText(value: unknown): string { return typeof value === 'string' ? value : ''; }
function interpolate(template: string, label: string): string { return template.replaceAll('{label}', label); }

export class A11yBarChartGroupElement extends HTMLElement {
  static #nextId = 1;
  readonly instanceId: string;
  #sections: A11yBarChartViewSection[] = [];
  #selectedSectionId = '';
  #selectedViewId = '';
  #config: A11yBarChartConfig = {};
  #messages: MessageDictionary = {};
  #groupMessages: A11yBarChartGroupMessages = {};
  #theme: A11yBarChartTheme = {};
  #formatValue: A11yBarChartValueFormatter | undefined;
  #expanded = new Map<string, boolean>();
  #error = false;
  #root?: HTMLElement;
  #chart?: A11yBarChartElement;
  #status?: HTMLElement;

  constructor() {
    super();
    this.instanceId = `a11y-bar-chart-group-${A11yBarChartGroupElement.#nextId++}`;
  }

  get sections(): A11yBarChartViewSection[] { return this.#sections.map((section) => ({ ...section, views: section.views.map(copyView) })); }
  set sections(value: readonly A11yBarChartViewSection[]) {
    const result = this.#validateSections(value);
    this.#error = !result.valid;
    if (result.valid) {
      this.#sections = result.sections;
      const surviving = this.#sections.some((section) => section.id === this.#selectedSectionId && section.views.some((view) => view.id === this.#selectedViewId));
      if (!surviving) this.#selectFallback();
      for (const id of [...this.#expanded.keys()]) if (!this.#sections.some((section) => section.id === id)) this.#expanded.delete(id);
    }
    this.#render();
  }
  get selectedSectionId(): string { return this.#selectedSectionId; }
  set selectedSectionId(value: string) {
    const section = this.#sections.find((item) => item.id === value);
    if (!section || section.id === this.#selectedSectionId) return;
    this.#selectedSectionId = section.id;
    this.#selectedViewId = section.allViewId;
    this.#render();
    this.#emit('property');
  }
  get selectedViewId(): string { return this.#selectedViewId; }
  set selectedViewId(value: string) {
    const view = this.#sections.find((section) => section.id === this.#selectedSectionId)?.views.find((item) => item.id === value);
    if (!view || view.id === this.#selectedViewId) return;
    this.#selectedViewId = view.id;
    this.#render();
    this.#emit('property');
  }
  get config(): A11yBarChartConfig { return { ...this.#config }; }
  set config(value: A11yBarChartConfig) { this.#config = value && typeof value === 'object' ? { ...value } : {}; this.#syncChart(); }
  get messages(): MessageDictionary { return { ...this.#messages }; }
  set messages(value: MessageDictionary) { this.#messages = value && typeof value === 'object' ? { ...value } : {}; this.#syncChart(); }
  get groupMessages(): A11yBarChartGroupMessages { return { ...this.#groupMessages }; }
  set groupMessages(value: A11yBarChartGroupMessages) { this.#groupMessages = this.#validGroupMessages(value); this.#render(); }
  get theme(): A11yBarChartTheme { return { ...this.#theme }; }
  set theme(value: A11yBarChartTheme) { this.#theme = value && typeof value === 'object' ? { ...value } : {}; this.#syncChart(); }
  get formatValue(): A11yBarChartValueFormatter | undefined { return this.#formatValue; }
  set formatValue(value: A11yBarChartValueFormatter | undefined) { this.#formatValue = typeof value === 'function' ? value : undefined; this.#syncChart(); }

  connectedCallback(): void { this.#render(); }

  #validGroupMessages(value: unknown): A11yBarChartGroupMessages {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result: A11yBarChartGroupMessages = {};
    for (const key of Object.keys(DEFAULT_GROUP_MESSAGES) as Array<keyof A11yBarChartGroupMessages>) {
      const message = (value as Record<string, unknown>)[key];
      if (typeof message === 'string' && message.trim()) result[key] = message;
    }
    return result;
  }

  #validateSections(input: unknown): { valid: true; sections: A11yBarChartViewSection[] } | { valid: false } {
    if (!Array.isArray(input)) return { valid: false };
    const sectionIds = new Set<string>();
    const result: A11yBarChartViewSection[] = [];
    for (const section of input) {
      if (!section || typeof section !== 'object' || typeof section.id !== 'string' || !section.id.trim() || sectionIds.has(section.id) || typeof section.label !== 'string' || (section.description !== undefined && typeof section.description !== 'string') || !Array.isArray(section.views)) return { valid: false };
      sectionIds.add(section.id);
      const views: A11yBarChartPreparedView[] = [];
      const viewIds = new Set<string>();
      for (const raw of section.views) {
        if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim() || viewIds.has(raw.id) || typeof raw.label !== 'string' || typeof raw.chartTitle !== 'string' || typeof raw.filtered !== 'boolean' || typeof raw.suppressed !== 'boolean' || (raw.total !== null && (typeof raw.total !== 'number' || !Number.isFinite(raw.total) || raw.total < 0))) return { valid: false };
        if (['definition', 'context', 'dataNote', 'explanation', 'emptyMessage'].some((key) => raw[key] !== undefined && typeof raw[key] !== 'string')) return { valid: false };
        const validData = validateBarData(raw.data);
        const validTotal = validateBarTotal(raw.total);
        if (!validData.valid || !validTotal.valid || (raw.scaleMaximum !== undefined && (typeof raw.scaleMaximum !== 'number' || !Number.isFinite(raw.scaleMaximum) || raw.scaleMaximum < 0))) return { valid: false };
        viewIds.add(raw.id);
        views.push({ ...raw, data: validData.data, total: validTotal.total });
      }
      if (!views.some((view) => view.id === section.allViewId)) return { valid: false };
      result.push({ id: section.id, label: section.label, ...(typeof section.description === 'string' ? { description: section.description } : {}), allViewId: section.allViewId, views });
    }
    return { valid: true, sections: result };
  }

  #selectFallback(): void {
    const hadSelection = Boolean(this.#selectedSectionId || this.#selectedViewId);
    const section = this.#sections.find((item) => item.id === this.#selectedSectionId) ?? this.#sections[0];
    this.#selectedSectionId = section?.id ?? '';
    this.#selectedViewId = section?.allViewId ?? '';
    if (section && hadSelection) this.#emit('fallback');
  }

  #emit(origin: A11yBarChartGroupSelectionChangeDetail['origin']): void {
    if (!this.#selectedSectionId || !this.#selectedViewId) return;
    this.dispatchEvent(new CustomEvent<A11yBarChartGroupSelectionChangeDetail>('a11y-bar-chart-group-selection-change', {
      bubbles: true, composed: true,
      detail: { sectionId: this.#selectedSectionId, viewId: this.#selectedViewId, origin }
    }));
  }

  #text(key: keyof typeof DEFAULT_GROUP_MESSAGES): string { return this.#groupMessages[key] ?? DEFAULT_GROUP_MESSAGES[key]; }

  #ensureStructure(): void {
    if (this.#root) return;
    const root = document.createElement('div'); root.className = 'a11y-bar-chart-group';
    const selector = document.createElement('nav'); selector.className = 'a11y-bar-chart-group__selector';
    selector.setAttribute('aria-label', this.#text('selectorLabel'));
    const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
    const status = document.createElement('p'); status.className = 'a11y-bar-chart-group__status';
    root.append(selector, status, chart);
      this.append(root);
    this.#root = root; this.#chart = chart; this.#status = status;
    root.addEventListener('click', (event) => this.#onClick(event));
    root.addEventListener('change', (event) => this.#onChange(event));
  }

  #render(): void {
    if (!this.isConnected) return;
    this.#ensureStructure();
    const root = this.#root!;
    const selector = root.querySelector('nav')!;
    const activeElement = document.activeElement as HTMLElement | null;
    const ownsFocus = Boolean(activeElement && root.contains(activeElement));
    const focused = ownsFocus ? activeElement?.dataset?.groupFocus : undefined;
    if (this.#error) {
      selector.innerHTML = '';
      const error = document.createElement('p'); error.className = 'a11y-bar-chart-group__error'; error.setAttribute('role', 'alert'); error.textContent = this.#text('invalid');
      error.tabIndex = -1;
      selector.append(error);
      this.#status!.textContent = '';
      this.#clearChart();
      if (ownsFocus) queueMicrotask(() => { if (this.#error && error.isConnected) error.focus({ preventScroll: true }); });
      return;
    }
    if (!this.#sections.length) {
      selector.innerHTML = '';
      const empty = document.createElement('p'); empty.className = 'a11y-bar-chart-group__empty'; empty.textContent = this.#text('empty'); empty.tabIndex = -1;
      selector.append(empty); this.#status!.textContent = ''; this.#clearChart();
      if (ownsFocus) queueMicrotask(() => { if (this.#sections.length === 0 && empty.isConnected) empty.focus({ preventScroll: true }); });
      return;
    }
    selector.setAttribute('aria-label', this.#text('selectorLabel'));
    const sectionMarkup = this.#sections.map((section) => {
      const active = section.id === this.#selectedSectionId;
      const expanded = active && (this.#expanded.get(section.id) ?? true);
      const optionsId = `${this.instanceId}-${this.#safeId(section.id)}-options`;
      const headingId = `${optionsId}-heading`;
      const heading = `<button class="a11y-bar-chart-group__section-toggle" type="button" data-section="${this.#escape(section.id)}" data-group-focus="section:${optionsId}" aria-expanded="${expanded}" aria-controls="${optionsId}"><span>${this.#escape(interpolate(this.#text(expanded ? 'collapseSection' : 'expandSection'), section.label))}</span><span class="a11y-bar-chart-group__chevron" aria-hidden="true"></span></button>`;
      const options = section.views.map((view) => {
          const checked = active && view.id === this.#selectedViewId;
          const radioId = `${optionsId}-${this.#safeId(view.id)}`;
          const descriptionId = view.definition ? `${radioId}-definition` : '';
          return `<div class="a11y-bar-chart-group__option"><input type="radio" id="${radioId}" name="${this.instanceId}-${this.#safeId(section.id)}-view" value="${this.#escape(view.id)}" data-view="${this.#escape(view.id)}" data-group-focus="view:${radioId}"${checked ? ' checked' : ''}${descriptionId ? ` aria-describedby="${descriptionId}"` : ''}><label for="${radioId}">${this.#escape(view.label)}</label>${descriptionId ? `<div class="a11y-bar-chart-group__definition" id="${descriptionId}"></div>` : ''}</div>`;
      }).join('');
      const desc = section.description ? `<p class="a11y-bar-chart-group__description">${this.#escape(section.description)}</p>` : '';
      const fieldset = `<fieldset id="${optionsId}" class="a11y-bar-chart-group__fieldset"${expanded && active ? '' : ' hidden'}><legend id="${headingId}">${this.#escape(section.label)}</legend>${desc}${options}</fieldset>`;
      return `<div class="a11y-bar-chart-group__section${active ? ' is-active' : ''}">${heading}${fieldset}</div>`;
    }).join('');
    selector.innerHTML = sectionMarkup;
    for (const section of this.#sections) {
      for (const view of section.views) {
        if (!view.definition) continue;
        const description = root.querySelector<HTMLElement>(`#${this.instanceId}-${this.#safeId(section.id)}-options-${this.#safeId(view.id)}-definition`);
        description?.append(renderRichContent(view.definition));
      }
    }
    const view = this.#activeView();
    this.#status!.textContent = view ? interpolate(this.#text('selectionStatus'), view.label) : '';
    this.#syncChart();
    if (focused) {
      const priorControl = [...root.querySelectorAll<HTMLElement>('[data-group-focus]')].find((element) => element.dataset.groupFocus === focused);
      const nextControl = priorControl ?? [...root.querySelectorAll<HTMLInputElement>('input[data-view]')].find((element) => element.checked && element.dataset.view === this.#selectedViewId) ?? [...root.querySelectorAll<HTMLElement>('[data-section]')].find((element) => element.dataset.section === this.#selectedSectionId);
      nextControl?.focus({ preventScroll: true });
    }
  }

  #activeView(): A11yBarChartPreparedView | undefined { return this.#sections.find((section) => section.id === this.#selectedSectionId)?.views.find((view) => view.id === this.#selectedViewId); }
  #clearChart(): void {
    if (!this.#chart) return;
    this.#chart.config = { ...this.#config, inferTotal: false, tableVisibility: 'hidden' } as A11yBarChartConfig;
    this.#chart.hidden = true;
    this.#chart.data = [];
    this.#chart.total = null;
    this.#chart.chartTitle = '';
    this.#chart.subtitle = '';
    this.#chart.context = '';
    this.#chart.dataNote = '';
    this.#chart.filtered = false;
    this.#chart.suppressed = false;
    const chart = this.#chart as A11yBarChartElement & { explanation?: string };
    if ('explanation' in chart) chart.explanation = '';
  }
  #syncChart(): void {
    if (!this.#chart) return;
    if (this.#error) { this.#clearChart(); return; }
    const view = this.#activeView();
    if (!view) { this.#clearChart(); return; }
    this.#chart.hidden = false;
    const chart = this.#chart as A11yBarChartElement & { explanation?: string; scaleMaximum?: number };
    chart.data = view.data.map((datum) => ({ ...datum }));
    chart.total = view.total;
    chart.chartTitle = view.chartTitle;
    chart.context = view.context ?? '';
    chart.dataNote = view.dataNote ?? '';
    chart.filtered = view.filtered;
    chart.suppressed = view.suppressed;
    chart.config = { ...this.#config, inferTotal: false, ...(view.scaleMaximum !== undefined ? { scaleMaximum: view.scaleMaximum } : {}) } as A11yBarChartConfig;
    chart.messages = { ...this.#messages, ...(view.emptyMessage !== undefined ? { empty: view.emptyMessage } : {}) };
    chart.theme = { ...this.#theme };
    chart.formatValue = this.#formatValue;
    if ('explanation' in chart) chart.explanation = view.explanation ?? '';
  }

  #onClick(event: Event): void {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-section]');
    if (!button) return;
    const id = button.dataset.section!;
    const wasExpanded = button.getAttribute('aria-expanded') === 'true';
    const changedSection = id !== this.#selectedSectionId;
    if (changedSection) {
      this.#selectedSectionId = id;
      this.#selectedViewId = this.#sections.find((section) => section.id === id)?.allViewId ?? '';
    }
    this.#expanded.set(id, !wasExpanded);
    this.#render();
    if (changedSection) this.#emit('user');
  }

  #onChange(event: Event): void {
    const input = (event.target as Element | null)?.closest<HTMLInputElement>('input[data-view]');
    if (!input || !input.checked || input.value === this.#selectedViewId) return;
    this.#selectedViewId = input.value;
    this.#render();
    this.#emit('user');
  }

  #safeId(value: string): string { return Array.from(value, (char) => char.codePointAt(0)!.toString(16)).join('-') || 'id'; }
  #escape(value: unknown): string { return safeText(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
}

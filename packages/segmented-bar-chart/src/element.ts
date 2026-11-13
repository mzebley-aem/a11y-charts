import { positionSegmentDetails, SEGMENTED_IN_FLOW_CLASS } from './position-details.js';
import { CSV_BYTE_ORDER_MARK } from '../../chart-core/src/csv.js';
import {
  buildSegmentedBarModel,
  buildSegmentedBarCsv,
  formatMessage,
  validateSegmentedBarData,
  type MessageKey,
  type SegmentedValidationFailure,
  resolveConfig,
  type A11ySegmentedBarChartDatum,
  type A11ySegmentedBarChartConfig,
  type A11ySegmentedBarChartTheme,
  type A11ySegmentedBarChartValueFormatter,
  type MessageDictionary,
} from './core.js';
import { FloatingCardController } from '../../chart-core/src/ui/floating-card-controller.js';
import { ModalController } from '../../chart-core/src/ui/modal-controller.js';
import {
  setDisclosure,
  toggleDisclosure,
} from '../../chart-core/src/ui/disclosure.js';
import {
  renderSafeHtml,
  safeHtmlToText,
} from '../../chart-core/src/content.js';
let serial = 0;
const DATA_VIEW_VALUES = ['dialog', 'inline', 'none'];
const PERCENT_SCALE_VALUES = ['whole', 'fraction'];
export class A11ySegmentedBarChartElement extends HTMLElement {
  static readonly observedAttributes = [
    'chart-title',
    'subtitle',
    'locale',
    'filtered',
    'suppressed',
    'heading-level',
    'data-view',
    'percent-scale',
    'messages',
    'href',
  ];
  #data: A11ySegmentedBarChartDatum[] = [];
  #dataError: SegmentedValidationFailure | null = null;
  #total: number | null = null;
  #config: A11ySegmentedBarChartConfig = {};
  #messages: MessageDictionary = {};
  #theme: A11ySegmentedBarChartTheme = {};
  #formatValue: A11ySegmentedBarChartValueFormatter | undefined;
  #context = '';
  #explanation = '';
  #dataNote = '';
  #valueLabel = '';
  #totalLabel = '';
  #card: FloatingCardController | undefined;
  #modal: ModalController | undefined;
  #dialog: HTMLDialogElement | undefined;
  #dialogLayer = document.createElement('div');
  #opener: HTMLButtonElement | undefined;
  #resetExplanation = false;
  #resetGlossary = false;
  #inlineDataOpen = false;
  #messagesInvalid = false;
  #queued = false;
  #reopenDialog = false;
  #hasRendered = false;
  #dirtyData = false;
  #id = ++serial;
  readonly instanceId = `a11y-segmented-bar-chart-${this.#id}`;
  #live = document.createElement('div');
  #themeProperties = new Set<string>();
  #root = document.createElement('div');
  constructor() {
    super();
    this.#root.className = 'a11y-segmented-bar-chart__root';
    this.#dialogLayer.className = 'a11y-segmented-bar-chart__dialog-layer';
    this.#live.className = 'a11y-segmented-bar-chart__visually-hidden';
    this.#live.setAttribute('role', 'status');
    this.#live.setAttribute('aria-live', 'polite');
  }
  get chartTitle() {
    return this.getAttribute('chart-title') ?? '';
  }
  set chartTitle(v: string) {
    this.setAttribute('chart-title', v ?? '');
  }
  get subtitle() {
    return this.getAttribute('subtitle') ?? '';
  }
  set subtitle(v: string) {
    this.setAttribute('subtitle', v ?? '');
  }
  get locale() {
    return this.getAttribute('locale')?.trim() || this.#config.locale || 'en-US';
  }
  set locale(value: string) {
    if (value) this.setAttribute('locale', value);
    else this.removeAttribute('locale');
  }
  get filtered() {
    return this.hasAttribute('filtered');
  }
  set filtered(v: boolean) {
    this.toggleAttribute('filtered', !!v);
  }
  get suppressed() {
    return this.hasAttribute('suppressed');
  }
  set suppressed(v: boolean) {
    this.toggleAttribute('suppressed', !!v);
  }
  get data() {
    return this.#data.map((d) => ({
      ...d,
      value: this.suppressed && d.value === 0 ? null : d.value,
    }));
  }
  set data(v: A11ySegmentedBarChartDatum[]) {
    const result = validateSegmentedBarData(v);
    if (
      result.valid &&
      !this.#dataError &&
      JSON.stringify(result.data) === JSON.stringify(this.#data)
    )
      return;
    this.#dirtyData = true;
    if (result.valid) {
      this.#data = result.data;
      this.#dataError = null;
    } else {
      this.#data = [];
      this.#dataError = result;
      this.#dispatchError(result.code, result.message);
    }
    this.#queue();
  }
  #dispatchError(code: string, message: string) {
    this.dispatchEvent(
      new CustomEvent('a11y-segmented-bar-chart-error', {
        bubbles: true,
        detail: { code, message },
      }),
    );
  }
  get total() {
    return this.#total;
  }
  set total(v: number | null) {
    if (Object.is(this.#total, v)) return;
    this.#dirtyData = true;
    this.#total = v;
    this.#queue();
  }
  get config() {
    return { ...this.#config, ...(Array.isArray(this.#config.separateCategoryIds) ? { separateCategoryIds: [...this.#config.separateCategoryIds] } : {}) };
  }
  set config(v: A11ySegmentedBarChartConfig) {
    this.#resetExplanation =
      v?.explanationExpanded !== this.#config.explanationExpanded;
    this.#resetGlossary = v?.glossaryExpanded !== this.#config.glossaryExpanded;
    this.#config = v && typeof v === 'object' ? { ...v, ...(Array.isArray(v.separateCategoryIds) ? { separateCategoryIds: [...v.separateCategoryIds] } : {}) } : {};
    this.#queue();
  }
  get messages() {
    return { ...this.#messages };
  }
  set messages(v: MessageDictionary) {
    this.#messagesInvalid = false;
    this.#messages = v && typeof v === 'object' ? { ...v } : {};
    this.#queue();
  }
  get theme() {
    return structuredClone(this.#theme);
  }
  set theme(v: A11ySegmentedBarChartTheme) {
    this.#theme = v && typeof v === 'object' ? structuredClone(v) : {};
    this.#queue();
  }
  get formatValue() {
    return this.#formatValue;
  }
  set formatValue(v: A11ySegmentedBarChartValueFormatter | undefined) {
    this.#formatValue = v;
    this.#queue();
  }
  get context() {
    return this.#context;
  }
  set context(v: string) {
    this.#context = v ?? '';
    this.#queue();
  }
  get explanation() {
    return this.#explanation;
  }
  set explanation(v: string) {
    this.#explanation = v ?? '';
    this.#queue();
  }
  get dataNote() {
    return this.#dataNote;
  }
  set dataNote(v: string) {
    this.#dataNote = v ?? '';
    this.#queue();
  }
  get valueLabel() {
    return this.#valueLabel;
  }
  set valueLabel(v: string) {
    this.#valueLabel = v ?? '';
    this.#queue();
  }
  get totalLabel() {
    return this.#totalLabel;
  }
  set totalLabel(v: string) {
    this.#totalLabel = v ?? '';
    this.#queue();
  }
  get href() {
    return this.getAttribute('href') ?? '';
  }
  set href(v: string) {
    if (v) this.setAttribute('href', v);
    else this.removeAttribute('href');
  }
  connectedCallback() {
    if (!this.#root.isConnected)
      this.append(this.#root, this.#dialogLayer, this.#live);
    this.#queue();
  }
  disconnectedCallback() {
    this.#reopenDialog = this.#modal?.isOpen ?? false;
    this.#card?.destroy();
    this.#modal?.destroy();
  }
  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null,
  ) {
    if (_old === value) return;
    if (name === 'suppressed') this.#dirtyData = true;
    if (name === 'messages') {
      try {
        const parsed: unknown = value ? JSON.parse(value) : {};
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          Array.isArray(parsed) ||
          Object.values(parsed).some((v) => typeof v !== 'string')
        )
          throw new Error('Invalid messages');
        this.#messages = parsed as MessageDictionary;
        this.#messagesInvalid = false;
      } catch {
        this.#messages = {};
        this.#messagesInvalid = true;
        this.#dispatchError(
          'invalid-messages',
          formatMessage('invalidMessages', this.#messages),
        );
      }
    }
    this.#queue();
  }
  #queue() {
    if (!this.isConnected || this.#queued) return;
    this.#queued = true;
    queueMicrotask(() => {
      this.#queued = false;
      if (this.isConnected) this.#render();
    });
  }
  #render() {
    const root = this.#root;
    const active = this.contains(document.activeElement)
      ? (document.activeElement as HTMLElement)
      : null;
    const wasOpen = this.#reopenDialog || !!this.#modal?.isOpen;
    const explanationOpen =
      root
        .querySelector('[data-focus-key=explanation]')
        ?.getAttribute('aria-expanded') === 'true';
    const glossaryOpen =
      root
        .querySelector('[data-focus-key=glossary]')
        ?.getAttribute('aria-expanded') === 'true';
    const hadExplanation = !!root.querySelector('[data-focus-key=explanation]');
    const hadGlossary = !!root.querySelector('[data-focus-key=glossary]');
    this.#reopenDialog = false;
    const focusedGroupMembers = active?.closest<HTMLElement>('[data-group-members]')?.dataset.groupMembers;
    const focusedRowId = active?.closest<HTMLElement>('[data-row-id]')?.dataset.rowId;
    const focusKey =
      active?.dataset.focusKey ??
      active?.closest<HTMLElement>('.a11y-segmented-bar-chart__legend-item')?.querySelector<HTMLElement>('[data-focus-key]')?.dataset.focusKey ??
      (active?.closest('dialog') ? 'data' : undefined);
    this.#card?.destroy();
    if (!wasOpen) {
      this.#modal?.destroy();
      this.#modal = undefined;
      this.#dialog = undefined;
      this.#dialogLayer.replaceChildren();
    }
    root.replaceChildren();
    const c = resolveConfig({
      ...this.#config,
      ...(this.hasAttribute('locale')
        ? { locale: this.getAttribute('locale')! }
        : {}),
      ...(this.hasAttribute('heading-level')
        ? {
            headingLevel: Number(this.getAttribute('heading-level')) as
              1 | 2 | 3 | 4 | 5 | 6,
          }
        : {}),
      // A valid attribute takes precedence over config; invalid values fall through to config.
      ...(DATA_VIEW_VALUES.includes(this.getAttribute('data-view') ?? '')
        ? { dataView: this.getAttribute('data-view') as 'dialog' | 'inline' | 'none' }
        : {}),
      ...(PERCENT_SCALE_VALUES.includes(this.getAttribute('percent-scale') ?? '')
        ? { percentScale: this.getAttribute('percent-scale') as 'whole' | 'fraction' }
        : {}),
    });
    const t = (key: MessageKey) => formatMessage(key, this.#messages);
    const opts = {
      total: this.#total,
      config: { ...c, ...(this.#config.separateCategoryIds !== undefined ? { separateCategoryIds: this.#config.separateCategoryIds } : {}) },
      messages: this.#messages,
      suppressed: this.suppressed,
      filtered: this.filtered,
      ...(this.#formatValue ? { formatValue: this.#formatValue } : {}),
    };
    const model = buildSegmentedBarModel(this.#data, opts);
    const el = <K extends keyof HTMLElementTagNameMap>(
      tag: K,
      text?: string,
    ) => {
      const x = document.createElement(tag);
      if (text !== undefined) x.textContent = text;
      return x;
    };
    for (const name of this.#themeProperties) this.style.removeProperty(name);
    this.#themeProperties.clear();
    const wrap = el('section');
    wrap.className = `a11y-segmented-bar-chart__chart a11y-segmented-bar-chart__${c.presentation}`;
    for (const [key, value] of Object.entries(this.#theme)) {
      if (key !== 'segments' && typeof value === 'string') {
        const cssName = key.replace(
          /[A-Z]/g,
          (letter) => `-${letter.toLowerCase()}`,
        );
        const property = `--a11y-segmented-bar-chart-${cssName}`;
        this.style.setProperty(property, value);
        this.#themeProperties.add(property);
      }
    }
    root.append(wrap);
    const heading = el(`h${c.headingLevel}` as 'h2');
    heading.tabIndex = -1;
    heading.className = 'a11y-segmented-bar-chart__title';
    let safeHref = '';
    try {
      const url = new URL(this.href, document.baseURI);
      if (['http:', 'https:', 'mailto:'].includes(url.protocol))
        safeHref = this.href;
    } catch {}
    if (safeHref) {
      const a = el('a', this.chartTitle || t('title'));
      a.href = safeHref;
      if (
        c.presentation === 'compact' &&
        !c.showActions &&
        !c.showDetails &&
        c.dataView !== 'inline'
      )
        a.className = 'a11y-segmented-bar-chart__card-link';
      a.append(' →');
      heading.append(a);
    } else heading.textContent = this.chartTitle || t('title');
    if (this.chartTitle) wrap.append(heading);
    if (this.#messagesInvalid) {
      const messageError = el('p', t('invalidMessages'));
      messageError.setAttribute('role', 'alert');
      wrap.append(messageError);
    }
    if (this.subtitle) {
      const subtitle = el('p', this.subtitle);
      subtitle.className = 'a11y-segmented-bar-chart__subtitle';
      wrap.append(subtitle);
    }
    const toolbar = el('div');
    toolbar.className = 'a11y-segmented-bar-chart__toolbar';
    wrap.append(toolbar);
    if (this.filtered) wrap.append(el('p', t('filtered')));
    if (this.suppressed) wrap.append(el('p', t('suppressed')));
    if (c.showContext && this.#context) {
      const node = el('div');
      node.append(renderSafeHtml(this.#context));
      wrap.append(node);
    }
    if (this.#dataError || model.error) {
      this.#modal?.close(false);
      this.#modal?.destroy();
      this.#modal = undefined;
      this.#dialog = undefined;
      this.#dialogLayer.replaceChildren();
      const error = el(
        'p',
        this.#dataError
          ? formatMessage(
              this.#dataError.code,
              this.#messages,
              this.#dataError.params,
            )
          : model.error!,
      );
      if (model.errorCode) this.#dispatchError(model.errorCode, model.error!);
      error.setAttribute('role', 'alert');
      error.tabIndex = -1;
      wrap.append(error);
      if (active) error.focus();
      if (this.#hasRendered && this.#dirtyData) this.dispatchEvent(new CustomEvent('a11y-segmented-bar-chart-data-change', {
        bubbles: true, detail: { data: this.data, model: null }
      }));
      this.#dirtyData = false;
      return;
    }
    if (!model.rows.length && !c.showSummary) wrap.append(el('p', t('empty')));
    if (c.showSummary && model.summary) {
      const summary = el('p', model.summary);
      summary.className = 'a11y-segmented-bar-chart__summary';
      wrap.append(summary);
    }
    const visual = el('div');
    visual.className = 'a11y-segmented-bar-chart__visual';
    wrap.append(visual);
    const breakdown = el('div');
    breakdown.className = 'a11y-segmented-bar-chart__breakdown';
    if (c.showTotal) {
      const total = el('p');
      total.className = 'a11y-segmented-bar-chart__total';
      const highlighted =
        model.rows.find((row) => row.id === c.highlightedId) ??
        (c.mode === 'comparison' ? model.rows[0] : undefined);
      const metric =
        c.presentation === 'compact'
          ? model.totalText
          : (highlighted?.valueText ?? model.totalText);
      total.append(el('strong', metric));
      const label = el(
        'span',
        c.presentation === 'compact'
          ? this.#totalLabel || t('total')
          : highlighted
            ? formatMessage('metricOf', this.#messages, {
                total: model.totalText,
                label: this.#totalLabel || t('total'),
              })
            : this.#totalLabel || t('total'),
      );
      total.append(label);
      visual.append(total);
    }
    const indexFor = (id: string) =>
      model.rows.findIndex((row) => row.id === id) % 6;
    const bar = el('div');
    bar.className = 'a11y-segmented-bar-chart__bar';
    bar.setAttribute('aria-hidden', 'true');
    const segments = new Map<object, HTMLElement>();
    for (const display of model.displaySegments) {
      const row = display.kind === 'category' ? display.row : display;
      if (row.ratio <= 0) continue;
      const segment = el('span');
      segment.className = 'a11y-segmented-bar-chart__segment';
      segment.style.width = `${row.ratio * 100}%`;
      if (display.kind === 'other') segment.dataset.other = '';
      else segment.dataset.index = String(indexFor(display.row.id));
      const theme = display.kind === 'other' ? this.#theme.other : this.#theme.segments?.[display.row.id];
      if (theme?.color && CSS.supports('color', theme.color))
        segment.style.backgroundColor = theme.color;
      if (theme?.pattern && theme.pattern !== 'none')
        segment.dataset.pattern = theme.pattern;
      if (theme?.patternColor && CSS.supports('color', theme.patternColor))
        segment.style.setProperty('--pattern-color', theme.patternColor);
      if (display.kind === 'category' && display.row.id === c.highlightedId) segment.classList.add('a11y-segmented-bar-chart__highlighted');
      bar.append(segment);
      segments.set(display, segment);
    }
    breakdown.append(bar);
    if (model.warning) breakdown.append(el('p', model.warning));
    const legend = el('ul');
    legend.className = 'a11y-segmented-bar-chart__legend';
    const detailTriggers: HTMLButtonElement[] = [];
    this.#card = new FloatingCardController({
      previewText: t('detailsPreview'),
      pinnedText: t('detailsPinned'),
      classNames: { above: 'a11y-segmented-bar-chart__above', inFlow: SEGMENTED_IN_FLOW_CLASS },
    });
    for (const [index, display] of model.displaySegments.entries()) {
      const row = display.kind === 'category' ? display.row : display;
      const li = el('li');
      li.className = 'a11y-segmented-bar-chart__legend-item';
      if (display.kind === 'other') li.dataset.groupMembers = JSON.stringify(display.members.map(member => member.id));
      else li.dataset.rowId = display.row.id;
      const swatch = el('span');
      swatch.className = 'a11y-segmented-bar-chart__swatch';
      swatch.setAttribute('aria-hidden', 'true');
      if (display.kind === 'other') swatch.dataset.other = '';
      else swatch.dataset.index = String(indexFor(display.row.id));
      const theme = display.kind === 'other' ? this.#theme.other : this.#theme.segments?.[display.row.id];
      if (theme?.color && CSS.supports('color', theme.color))
        swatch.style.backgroundColor = theme.color;
      if (theme?.pattern && theme.pattern !== 'none')
        swatch.dataset.pattern = theme.pattern;
      if (theme?.patternColor && CSS.supports('color', theme.patternColor))
        swatch.style.setProperty('--pattern-color', theme.patternColor);
      li.append(swatch);
      const label = `${row.label}${c.showCounts || (row.status !== 'reported' && (!c.showPercentages || row.valueText !== row.percentageText)) ? `: ${row.valueText}` : ''}${c.showPercentages ? ` (${row.percentageText})` : ''}`;
      if (c.showDetails) {
        const button = el('button', label);
        button.type = 'button';
        button.dataset.focusKey = display.kind === 'other' ? 'group:other' : `row:${display.row.id}`;
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-pressed', 'false');
        const card = el('div');
        card.className = 'a11y-segmented-bar-chart__card';
        card.id = `segmented-detail-${this.#id}-${index}`;
        button.setAttribute('aria-controls', card.id);
        card.append(el('strong', row.label));
        if (c.showCounts || (row.status !== 'reported' && (!c.showPercentages || row.valueText !== row.percentageText)))
          card.append(el('p', `${this.#valueLabel || t('countHeader')}: ${row.valueText}`));
        if (c.showPercentages)
          card.append(el('p', `${t('percentageHeader')}: ${row.percentageText}`));
        if (display.kind === 'other') {
          const members = el('ul');
          members.className = 'a11y-segmented-bar-chart__group-members';
          for (const member of display.members) {
            const text = `${member.label}${c.showCounts || (member.status !== 'reported' && (!c.showPercentages || member.valueText !== member.percentageText)) ? `: ${member.valueText}` : ''}${c.showPercentages ? ` (${member.percentageText})` : ''}`;
            const item = el('li', text);
            if (member.definition) {
              const definition = el('div');
              definition.append(renderSafeHtml(member.definition));
              item.append(definition);
            }
            members.append(item);
          }
          card.append(members);
        }
        if (display.kind === 'category' && display.row.definition) {
          const definition = el('div');
          definition.append(renderSafeHtml(display.row.definition));
          card.append(definition);
        }
        const status = el('p');
        status.className = 'a11y-segmented-bar-chart__status';
        card.append(status);
        li.append(button, card);
        detailTriggers.push(button);
        button.addEventListener('keydown', (event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          const currentIndex = detailTriggers.indexOf(button);
          const destination = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? currentIndex + 1
            : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? currentIndex - 1
              : event.key === 'Home' ? 0
                : event.key === 'End' ? detailTriggers.length - 1
                  : currentIndex;
          if (destination === currentIndex || destination < 0 || destination >= detailTriggers.length) return;
          event.preventDefault();
          detailTriggers[destination]?.focus();
        });
        let anchor: HTMLElement = button;
        const entry = { root: li, card, trigger: button, status,
          anchor: () => anchor.getBoundingClientRect(),
          position: (rect: DOMRect) => positionSegmentDetails(card, rect, anchor === button ? 'below' : 'above'),
          onDismiss: () => { if (card.contains(document.activeElement)) button.focus(); }
        };
        // Set the anchor before the shared controller opens/repositions a card.
        // Entering the card itself must not change the original hover anchor.
        li.addEventListener('pointerenter', event => {
          if (event.target instanceof Node && !card.contains(event.target) && !card.matches(':hover') &&
              button.getAttribute('aria-pressed') !== 'true') anchor = button;
        });
        li.addEventListener('focusin', event => {
          if (event.target === button) anchor = button;
        });
        this.#card.register(entry);
        const segment = segments.get(display);
        segment?.addEventListener('pointerenter', (event) => {
          if (event.pointerType !== 'touch') {
            if (button.getAttribute('aria-pressed') !== 'true') anchor = segment;
            this.#card?.show(entry);
          }
        });
        segment?.addEventListener('pointerleave', () => {
          // Use the controller's delayed close so the pointer can enter the card.
          li.dispatchEvent(new Event('pointerleave'));
        });
      } else li.append(el('span', label));
      legend.append(li);
    }
    breakdown.append(legend);
    visual.append(breakdown);
    if (c.showActions && c.showExplanation) {
      const button = el('button', t('explain'));
      button.type = 'button';
      button.dataset.focusKey = 'explanation';
      const content = el('div');
      content.id = `segmented-explanation-${this.#id}`;
      if (this.#explanation) content.append(renderSafeHtml(this.#explanation));
      else
        content.textContent = [model.summary, model.warning]
          .filter(Boolean)
          .join(' ');
      button.setAttribute('aria-controls', content.id);
      setDisclosure(
        button,
        content,
        hadExplanation && !this.#resetExplanation
          ? explanationOpen
          : c.explanationExpanded,
      );
      button.addEventListener('click', () => {
        const expanded = toggleDisclosure(button, content);
        this.dispatchEvent(
          new CustomEvent('a11y-segmented-bar-chart-disclosure-change', {
            bubbles: true,
            detail: { disclosure: 'explanation', expanded },
          }),
        );
      });
      toolbar.append(button);
      wrap.append(content);
    }
    if (
      c.showActions &&
      c.showGlossary &&
      model.rows.some((row) => row.definition)
    ) {
      const button = el('button', t('glossary'));
      button.type = 'button';
      button.dataset.focusKey = 'glossary';
      const definitions = el('dl');
      definitions.id = `segmented-glossary-${this.#id}`;
      for (const row of model.rows) {
        if (row.definition) {
          const definition = el('dd');
          definition.append(renderSafeHtml(row.definition));
          definitions.append(el('dt', row.label), definition);
        }
      }
      button.setAttribute('aria-controls', definitions.id);
      setDisclosure(
        button,
        definitions,
        hadGlossary && !this.#resetGlossary ? glossaryOpen : c.glossaryExpanded,
      );
      button.addEventListener('click', () => {
        const expanded = toggleDisclosure(button, definitions);
        this.dispatchEvent(
          new CustomEvent('a11y-segmented-bar-chart-disclosure-change', {
            bubbles: true,
            detail: { disclosure: 'glossary', expanded },
          }),
        );
      });
      toolbar.append(button);
      wrap.append(definitions);
    }
    if (this.#dataNote) {
      const note = el('div');
      note.append(renderSafeHtml(this.#dataNote));
      wrap.append(note);
    }
    const table = el('table');
    const caption = el(
      'caption',
      formatMessage('dataTableCaption', this.#messages, {
        title: this.chartTitle || t('title'),
      }),
    );
    table.append(caption);
    const head = el('thead');
    const hr = el('tr');
    for (const v of [
      t('categoryHeader'),
      this.#valueLabel || t('countHeader'),
      t('percentageHeader'),
    ]) {
      const th = el('th', v);
      th.scope = 'col';
      hr.append(th);
    }
    head.append(hr);
    table.append(head);
    const body = el('tbody');
    for (const r of model.rows) {
      const tr = el('tr');
      const th = el('th', r.label);
      th.scope = 'row';
      tr.append(th, el('td', r.valueText), el('td', r.percentageText));
      body.append(tr);
    }
    const tr = el('tr');
    const th = el('th', this.#totalLabel || t('total'));
    th.scope = 'row';
    tr.append(th, el('td', model.totalText), el('td', ''));
    body.append(tr);
    table.append(body);
    const dataContent = el('div');
    dataContent.className = 'a11y-segmented-bar-chart__data-content';
    for (const [label, authored] of [
      [t('contextLabel'), this.#context],
      [t('explanationLabel'), this.#explanation],
      [t('dataNoteLabel'), this.#dataNote],
    ]) {
      if (authored) {
        const section = el('div');
        section.append(el('strong', label));
        section.append(renderSafeHtml(authored));
        dataContent.append(section);
      }
    }
    if (this.suppressed) {
      const suppressionNote = el('p', t('suppressionNote'));
      suppressionNote.className = 'a11y-segmented-bar-chart__suppression-note';
      dataContent.append(suppressionNote);
    }
    dataContent.append(table);
    if (c.showExport && c.dataView !== 'none') {
      const tools = el('div');
      tools.className = 'a11y-segmented-bar-chart__data-tools';
      dataContent.append(tools);
      const b = el('button', t('exportCsv'));
      b.type = 'button';
      b.dataset.focusKey = 'export:csv';
      b.addEventListener('click', () => {
        const contents = buildSegmentedBarCsv(model, {
          chartTitle: this.chartTitle,
          messages: this.#messages,
          locale: c.locale,
          contextText: safeHtmlToText(this.#context),
          explanationText: safeHtmlToText(this.#explanation),
          dataNoteText: safeHtmlToText(this.#dataNote),
          countHeader: this.#valueLabel || t('countHeader'),
          totalHeader: this.#totalLabel || t('total'),
          categoryHeader: t('categoryHeader'),
          percentageHeader: t('percentageHeader'),
        });
        // The byte-order mark lets spreadsheet apps detect UTF-8 when the file is opened.
        const url = URL.createObjectURL(
          new Blob([CSV_BYTE_ORDER_MARK + contents], { type: 'text/csv;charset=utf-8' }),
        );
        const a = el('a');
        a.href = url;
        a.download = 'chart.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      });
      tools.append(b);
    }
    if (c.dataView !== 'none') {
      const hiddenTable = table.cloneNode(true) as HTMLTableElement;
      const hiddenTableContainer = el('div');
      hiddenTableContainer.className = 'a11y-segmented-bar-chart__visually-hidden';
      hiddenTableContainer.append(hiddenTable);
      wrap.append(hiddenTableContainer);
    }
    if (c.dataView !== 'inline') {
      if (this.#inlineDataOpen) this.dispatchEvent(new CustomEvent('a11y-segmented-bar-chart-data-view-change', {
        bubbles: true, detail: { open: false, dataView: 'inline' }
      }));
      this.#inlineDataOpen = false;
    }
    if (c.dataView !== 'none') {
      if (c.dataView === 'inline') {
        const details = el('details');
        details.className = 'a11y-segmented-bar-chart__inline-data';
        details.open = this.#inlineDataOpen;
        const summary = el('summary', t('dataInlineSummary'));
        summary.dataset.focusKey = 'inline-summary';
        details.append(summary, dataContent);
        details.addEventListener('toggle', () => {
          if (this.#inlineDataOpen === details.open) return;
          this.#inlineDataOpen = details.open;
          this.dispatchEvent(
            new CustomEvent('a11y-segmented-bar-chart-data-view-change', {
              bubbles: true,
              detail: { open: details.open, dataView: 'inline' },
            }),
          );
        });
        wrap.append(details);
      } else if (c.dataView === 'dialog' && c.showActions) {
        const opener = el('button', t('showData'));
        opener.type = 'button';
        opener.dataset.focusKey = 'data';
        this.#opener = opener;
        toolbar.append(opener);
        if (this.#dialog && this.#modal?.isOpen) {
          this.#dialog.setAttribute(
            'aria-label',
            formatMessage('dataDialogTitle', this.#messages, {
              title: this.chartTitle || t('title'),
            }),
          );
          const close =
            this.#dialog.querySelector<HTMLElement>('.a11y-segmented-bar-chart__close-dialog');
          if (close) close.textContent = t('close');
          this.#dialog.querySelector('.a11y-segmented-bar-chart__data-content')?.replaceWith(dataContent);
        } else {
          this.#dialogLayer.replaceChildren();
          const dialog = el('dialog');
          dialog.setAttribute(
            'aria-label',
            formatMessage('dataDialogTitle', this.#messages, {
              title: this.chartTitle || t('title'),
            }),
          );
          const close = el('button', t('close'));
          close.type = 'button';
          close.className = 'a11y-segmented-bar-chart__close-dialog';
          dialog.append(close, dataContent);
          this.#dialogLayer.append(dialog);
          this.#dialog = dialog;
          this.#modal = new ModalController({
            dialog,
            host: this,
            getOpener: () => this.#opener,
            onStateChange: (open) =>
              this.dispatchEvent(
                new CustomEvent('a11y-segmented-bar-chart-data-view-change', {
                  bubbles: true,
                  detail: { open, dataView: 'dialog' },
                }),
              ),
          });
          close.addEventListener('click', () => this.#modal?.close());
          if (wasOpen) this.#modal.open(close);
        }
        opener.addEventListener('click', () => {
          const result = this.#modal?.open(
            this.#dialog?.querySelector<HTMLButtonElement>('.a11y-segmented-bar-chart__close-dialog') ??
              undefined,
          );
          if (result === 'unsupported' || result === 'failed') {
            const code = result === 'unsupported' ? 'dialogUnsupported' : 'dialogUnavailable';
            this.#dispatchError(code, t(code));
            wrap.querySelector('.a11y-segmented-bar-chart__modal-error')?.remove();
            const alert = el('p', t(code));
            alert.className = 'a11y-segmented-bar-chart__modal-error';
            alert.setAttribute('role', 'alert');
            toolbar.after(alert);
          }
        });
      }
    }
    if (this.#modal?.isOpen && (c.dataView !== 'dialog' || !c.showActions)) {
      this.#modal.close(false);
      this.#modal.destroy();
      this.#modal = undefined;
      this.#dialog = undefined;
      this.#dialogLayer.replaceChildren();
    }
    this.#resetExplanation = false;
    this.#resetGlossary = false;
    const cardLink = wrap.querySelector<HTMLAnchorElement>('.a11y-segmented-bar-chart__card-link');
    if (
      cardLink &&
      Array.from(wrap.querySelectorAll('a[href]')).some(
        (link) => link !== cardLink,
      )
    )
      cardLink.classList.remove('a11y-segmented-bar-chart__card-link');
    const wasRendered = this.#hasRendered;
    if (!this.#hasRendered) {
      this.#hasRendered = true;
      this.dispatchEvent(
        new CustomEvent('a11y-segmented-bar-chart-ready', {
          bubbles: true,
          detail: { instanceId: this.instanceId },
        }),
      );
    } else {
      if (this.#dirtyData)
        this.dispatchEvent(
          new CustomEvent('a11y-segmented-bar-chart-data-change', {
            bubbles: true,
            detail: { data: this.data, model: structuredClone(model) },
          }),
        );
    }
    if (this.#dirtyData && c.announceChanges && wasRendered) {
      this.#live.textContent = '';
      queueMicrotask(() => {
        if (this.isConnected)
          this.#live.textContent = t('announcementDataUpdated');
      });
    }
    this.#dirtyData = false;
    if (focusKey && !(wasOpen && this.#modal?.isOpen && active?.isConnected)) {
      const found = Array.from(
        this.querySelectorAll<HTMLElement>('[data-focus-key]'),
      ).find((e) => e.dataset.focusKey === focusKey);
      let fallback: HTMLElement | undefined;
      if (!found && focusedRowId) {
        const group = model.displaySegments.find(segment => segment.kind === 'other' && segment.members.some(member => member.id === focusedRowId));
        if (group) fallback = wrap.querySelector<HTMLElement>('[data-focus-key="group:other"]') ?? undefined;
      }
      if (!found && !fallback && focusedGroupMembers) {
        const ids: string[] = JSON.parse(focusedGroupMembers);
        fallback = Array.from(wrap.querySelectorAll<HTMLElement>('[data-row-id]')).find(node => ids.includes(node.dataset.rowId ?? ''))?.querySelector<HTMLElement>('button') ?? undefined;
      }
      if (found || fallback) (found ?? fallback)!.focus();
      else if (heading.isConnected) heading.focus();
      else {
        this.tabIndex = -1;
        this.focus();
      }
    }
  }
}

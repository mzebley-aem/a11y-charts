import type {
  A11yBarChartConfig,
  A11yBarChartDatum,
  A11yBarChartRow,
  A11yBarChartSemanticModel,
  A11yBarChartTheme,
  A11yBarChartValueFormatter,
  ResolvedA11yBarChartConfig
} from './model.js';
import { buildBarCsv } from './csv.js';
import { ENGLISH_MESSAGES, message, type MessageDictionary, type MessageKey } from './messages.js';
import { resolveConfig } from './config.js';
import { buildBarModel } from './semantic-model.js';
import { validateBarData } from './validation.js';
import { renderRichContent, richContentToText } from './rich-content.js';
import { themeToCssVariables } from './theme.js';
import { copyTarget } from './target.js';
import { BarDetailsController } from './details-controller.js';
import { createCardContent } from '../../chart-core/src/ui/card-content.js';
import { ModalController, type ModalOpenResult } from '../../chart-core/src/ui/modal-controller.js';
import { setDisclosure } from '../../chart-core/src/ui/disclosure.js';
import { CSV_BYTE_ORDER_MARK } from '../../chart-core/src/csv.js';

export interface A11yBarChartErrorDetail {
  code: string;
  message: string;
  data?: A11yBarChartDatum[];
}

export interface A11yBarChartDataChangeDetail {
  data: A11yBarChartDatum[];
  model: A11yBarChartSemanticModel | null;
}

export interface A11yBarChartDataViewChangeDetail {
  open: boolean;
  dataView: 'dialog' | 'inline';
}

export interface A11yBarChartDisclosureChangeDetail {
  disclosure: 'explanation' | 'glossary';
  expanded: boolean;
}

const OWNED_ROOT_ATTRIBUTE = 'data-a11y-bar-chart-owned';
const SVG_NS = 'http://www.w3.org/2000/svg';
let nextInstanceId = 0;

function actionIcon(kind: 'toggle' | 'table', active = false): SVGSVGElement {
  const icon = document.createElementNS(SVG_NS, 'svg');
  icon.classList.add('a11y-bar-chart__action-icon', `a11y-bar-chart__action-icon--${kind}`);
  if (active) icon.classList.add('a11y-bar-chart__action-icon--active');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  if (kind === 'toggle') {
    const track = document.createElementNS(SVG_NS, 'rect');
    track.setAttribute('x', '2'); track.setAttribute('y', '6');
    track.setAttribute('width', '20'); track.setAttribute('height', '12');
    track.setAttribute('rx', '6'); track.setAttribute('fill', active ? 'currentColor' : 'none');
    track.setAttribute('stroke', 'currentColor'); track.setAttribute('stroke-width', '2');
    const knob = document.createElementNS(SVG_NS, 'circle');
    knob.setAttribute('cx', active ? '16' : '8'); knob.setAttribute('cy', '12');
    knob.setAttribute('r', '4'); knob.setAttribute('fill', active ? 'var(--a11y-bar-chart-surface, white)' : 'currentColor');
    icon.append(track, knob);
  } else {
    const outline = document.createElementNS(SVG_NS, 'rect');
    outline.setAttribute('x', '3'); outline.setAttribute('y', '4');
    outline.setAttribute('width', '18'); outline.setAttribute('height', '16');
    outline.setAttribute('rx', '1'); outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', 'currentColor'); outline.setAttribute('stroke-width', '2');
    const grid = document.createElementNS(SVG_NS, 'path');
    grid.setAttribute('d', 'M3 9h18M3 14h18M9 9v11M15 9v11');
    grid.setAttribute('fill', 'none'); grid.setAttribute('stroke', 'currentColor'); grid.setAttribute('stroke-width', '1.5');
    icon.append(outline, grid);
  }
  return icon;
}

/** Copy data for consumers. While suppression is on, zeros are redacted so the raw count never leaks. */
function copyData(data: A11yBarChartDatum[], suppressed = false): A11yBarChartDatum[] {
  return data.map((datum) => ({
    ...datum,
    ...(suppressed && datum.value === 0 ? { value: null } : {}),
    ...(datum.target !== undefined ? { target: copyTarget(datum.target) } : {})
  }));
}

function copyModel(model: A11yBarChartSemanticModel): A11yBarChartSemanticModel {
  return {
    ...model,
    rows: model.rows.map((row) => ({ ...row, target: copyTarget(row.target) })),
    explanation: [...model.explanation],
    indicators: [...model.indicators],
    warnings: [...model.warnings]
  };
}

function booleanAttribute(host: Element, name: string): boolean {
  return host.hasAttribute(name);
}

function validHeading(value: number): value is 1 | 2 | 3 | 4 | 5 | 6 {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

export class A11yBarChartElement extends HTMLElement {
  static readonly observedAttributes = ['chart-title', 'subtitle', 'locale', 'filtered', 'suppressed', 'heading-level', 'data-view', 'percent-scale', 'messages'];

  readonly instanceId: string;
  #data: A11yBarChartDatum[] = [];
  #total: number | null | undefined;
  #config: A11yBarChartConfig = {};
  #messages: Partial<Record<MessageKey, string>> = {};
  #messageError = false;
  #dataErrorCode = '';
  #dataErrorParams: Record<string, string | number> | undefined;
  #totalInvalid = false;
  #context = '';
  #authoredExplanation = '';
  #dataNote = '';
  #theme: A11yBarChartTheme = {};
  #formatValue: A11yBarChartValueFormatter | undefined;
  #glossaryOpen = false;
  #explanationOpen = false;
  #inlineDataOpen = false;
  #renderQueued = false;
  #renderGeneration = 0;
  #hasRendered = false;
  #ownedRoot: HTMLElement | undefined;
  #dialog: HTMLDialogElement | undefined;
  #modal: ModalController | undefined;
  #live: HTMLElement | undefined;
  #dialogClose: HTMLButtonElement | undefined;
  #showDataButton: HTMLButtonElement | undefined;
  #model: A11yBarChartSemanticModel | undefined;
  #lastDataSignature = '';
  #wasDialogOpen = false;
  #lastExpansionInput: { explanationExpanded: boolean | null; glossaryExpanded: boolean | null } = { explanationExpanded: null, glossaryExpanded: null };
  #dataViewState = { open: false, dataView: 'dialog' as 'dialog' | 'inline' };
  #dialogFailureKey: 'dialogUnsupported' | 'dialogUnavailable' | '' = '';
  #appliedThemeVariables: string[] = [];
  #details: BarDetailsController | undefined;

  constructor() {
    super();
    nextInstanceId += 1;
    this.instanceId = `a11y-bar-chart-${nextInstanceId}`;
  }

  get chartTitle(): string { return this.getAttribute('chart-title')?.trim() || this.#text('title'); }
  set chartTitle(value: string) { this.setAttribute('chart-title', value); }
  get subtitle(): string { return this.getAttribute('subtitle')?.trim() || ''; }
  set subtitle(value: string) { value ? this.setAttribute('subtitle', value) : this.removeAttribute('subtitle'); }
  get locale(): string { return this.getAttribute('locale')?.trim() || this.#config.locale || 'en-US'; }
  set locale(value: string) { value ? this.setAttribute('locale', value) : this.removeAttribute('locale'); }
  get filtered(): boolean { return booleanAttribute(this, 'filtered'); }
  set filtered(value: boolean) { this.toggleAttribute('filtered', Boolean(value)); }
  /** While true, zero values read as Suppressed. The host replaces protected values with 0 upstream. */
  get suppressed(): boolean { return booleanAttribute(this, 'suppressed'); }
  set suppressed(value: boolean) { this.toggleAttribute('suppressed', Boolean(value)); }
  get data(): A11yBarChartDatum[] { return copyData(this.#data, this.suppressed); }
  set data(value: A11yBarChartDatum[]) {
    const result = validateBarData(value);
    if (result.valid) {
      this.#data = copyData(result.data);
      this.#dataErrorCode = '';
      this.#dataErrorParams = undefined;
    } else {
      this.#data = [];
      this.#dataErrorCode = result.code;
      this.#dataErrorParams = result.params;
      this.#dispatchError(result.code, this.#localizedValidation(result.code, result.message, result.params));
    }
    this.#queueRender();
  }
  get total(): number | null | undefined { return this.#total; }
  set total(value: number | null | undefined) {
    if (value === undefined || value === null) { this.#total = value; this.#totalInvalid = false; }
    else if (typeof value === 'number' && Number.isFinite(value) && value >= 0) { this.#total = value; this.#totalInvalid = false; }
    else {
      this.#total = undefined;
      this.#totalInvalid = true;
      this.#dispatchError('validationInvalidTotal', this.#text('validationInvalidTotal'));
    }
    this.#queueRender();
  }
  get config(): A11yBarChartConfig { return { ...this.#config }; }
  set config(value: A11yBarChartConfig) {
    const next: A11yBarChartConfig = value && typeof value === 'object' ? { ...value } : {};
    for (const key of ['explanationExpanded', 'glossaryExpanded'] as const) {
      const nextValue = next[key] ?? null;
      if (nextValue !== this.#lastExpansionInput[key]) {
        if (key === 'explanationExpanded') this.#explanationOpen = next[key] === true;
        else this.#glossaryOpen = next[key] === true;
        this.#lastExpansionInput[key] = nextValue;
      }
    }
    this.#config = next;
    this.#queueRender();
  }
  get messages(): Partial<Record<MessageKey, string>> { return { ...this.#messages }; }
  set messages(value: Partial<Record<MessageKey, string>>) {
    this.#messages = this.#validMessages(value);
    this.#messageError = false;
    this.#queueRender();
  }
  get context(): string { return this.#context; }
  set context(value: string) { this.#context = typeof value === 'string' ? value : ''; this.#queueRender(); }
  /** Authored safe rich HTML shown in Explain instead of the generated explanation list. */
  get explanation(): string { return this.#authoredExplanation; }
  set explanation(value: string) { this.#authoredExplanation = typeof value === 'string' ? value : ''; this.#queueRender(); }
  get dataNote(): string { return this.#dataNote; }
  set dataNote(value: string) { this.#dataNote = typeof value === 'string' ? value : ''; this.#queueRender(); }
  get theme(): A11yBarChartTheme { return { ...this.#theme }; }
  set theme(value: A11yBarChartTheme) { this.#theme = value && typeof value === 'object' ? { ...value } : {}; this.#queueRender(); }
  get formatValue(): A11yBarChartValueFormatter | undefined { return this.#formatValue; }
  set formatValue(value: A11yBarChartValueFormatter | undefined) { this.#formatValue = typeof value === 'function' ? value : undefined; this.#queueRender(); }

  connectedCallback(): void { this.#queueRender(); }

  disconnectedCallback(): void {
    this.#details?.destroy();
    this.#details = undefined;
    this.#renderGeneration += 1;
    this.#renderQueued = false;
    this.#wasDialogOpen = this.#modal?.isOpen ?? Boolean(this.#dialog?.open);
    this.#modal?.disconnect(this.#wasDialogOpen);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (name === 'messages') this.#readMessagesAttribute(newValue);
    this.#queueRender();
  }

  #validMessages(input: unknown): Partial<Record<MessageKey, string>> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    const valid: Partial<Record<MessageKey, string>> = {};
    for (const [key, value] of Object.entries(input)) {
      const isCatalogKey = Object.prototype.hasOwnProperty.call(ENGLISH_MESSAGES, key);
      const isPluralVariant = /^(summaryAllZero|announcementDataUpdated)\.(zero|one|two|few|many|other)$/.test(key);
      if ((isCatalogKey || isPluralVariant) && typeof value === 'string' && value.trim()) valid[key as MessageKey] = value;
    }
    return valid;
  }

  #readMessagesAttribute(value: string | null): void {
    if (!value) { this.#messages = {}; this.#messageError = false; return; }
    try {
      const parsed: unknown = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('Messages must be a JSON object.');
      this.#messages = this.#validMessages(parsed);
      this.#messageError = false;
    } catch {
      this.#messageError = true;
      this.#dispatchError('invalid-messages', this.#text('invalidMessages'));
    }
  }

  #resolvedConfig() {
    const level = Number(this.getAttribute('heading-level'));
    const dataView = this.getAttribute('data-view');
    const percentScale = this.getAttribute('percent-scale');
    return resolveConfig({
      ...this.#config,
      locale: this.locale,
      ...(validHeading(level) ? { headingLevel: level } : {}),
      ...(dataView === 'dialog' || dataView === 'inline' || dataView === 'none' ? { dataView } : {}),
      ...(percentScale === 'whole' || percentScale === 'fraction' ? { percentScale } : {})
    });
  }

  #text(key: MessageKey, params: Record<string, string | number> = {}): string {
    return message(key, this.#messages, params, this.locale);
  }

  #localizedValidation(code: string, fallback: string, params?: Record<string, string | number>): string {
    const keys: Record<string, MessageKey> = {
      validationInvalidData: 'validationInvalidData',
      validationInvalidRecord: 'validationInvalidRecord',
      validationDuplicateId: 'validationDuplicateId',
      validationEmptyId: 'validationEmptyId',
      validationInvalidLabel: 'validationInvalidLabel',
      validationInvalidValue: 'validationInvalidValue',
      validationInvalidTarget: 'validationInvalidTarget',
      validationInvalidTotal: 'validationInvalidTotal'
    };
    const key = keys[code];
    return key ? this.#text(key, params) : this.#text('validationInvalidData', { detail: fallback });
  }

  #queueRender(): void {
    if (!this.isConnected || this.#renderQueued) return;
    this.#renderQueued = true;
    const generation = this.#renderGeneration;
    queueMicrotask(() => {
      if (generation !== this.#renderGeneration) return;
      this.#renderQueued = false;
      if (this.isConnected) this.#render();
    });
  }

  #createRoot(): HTMLElement {
    const root = document.createElement('section');
    root.className = 'a11y-bar-chart__root';
    root.setAttribute(OWNED_ROOT_ATTRIBUTE, this.instanceId);
    root.setAttribute('role', 'group');
    this.append(root);
    this.#ownedRoot = root;
    return root;
  }

  #ensureDialog(): HTMLDialogElement {
    if (this.#dialog) return this.#dialog;
    const dialog = document.createElement('dialog');
    dialog.className = 'a11y-bar-chart__dialog';
    dialog.id = `${this.instanceId}-dialog`;
    // The dialog exists in inline mode too, before its title/content is built.
    // Give that empty shell a valid name instead of a dangling ID reference.
    dialog.setAttribute('aria-label', this.#text('dataDialogTitle', { title: this.chartTitle }));
    this.#modal = new ModalController({
      dialog,
      host: this,
      getOpener: () => this.#dataAction(),
      onStateChange: (open) => this.#dispatchDataViewChange(open, 'dialog')
    });
    this.#dialog = dialog;
    this.#dialogClose = document.createElement('button');
    this.#dialogClose.type = 'button';
    this.#dialogClose.className = 'a11y-bar-chart__dialog-close';
    this.#dialogClose.textContent = this.#text('close');
    this.#dialogClose.addEventListener('click', () => this.#closeDialog(true));
    this.#live = document.createElement('div');
    this.#live.className = 'a11y-bar-chart__visually-hidden';
    this.#live.id = `${this.instanceId}-live`;
    this.#live.setAttribute('aria-live', 'polite');
    this.#live.setAttribute('aria-atomic', 'true');
    return dialog;
  }

  #render(): void {
    const reconnectDialog = this.#wasDialogOpen;
    const dialogWasOpen = Boolean(this.#modal?.isOpen || this.#dialog?.open || reconnectDialog);
    this.#wasDialogOpen = false;
    const existingInlineData = this.#ownedRoot?.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data');
    if (existingInlineData && existingInlineData.open !== this.#inlineDataOpen) {
      this.#inlineDataOpen = existingInlineData.open;
      this.#dispatchDataViewChange(existingInlineData.open, 'inline');
    }
    const activeKey = this.#activeKey();
    this.#details?.destroy();
    this.#details = undefined;
    const root = this.#ownedRoot?.parentElement === this ? this.#ownedRoot : this.#createRoot();
    const dialog = this.#ensureDialog();
    const config = this.#resolvedConfig();
    this.#applyTheme(root, dialog);
    root.replaceChildren();
    root.setAttribute('aria-labelledby', `${this.instanceId}-title`);

    const header = document.createElement('header');
    header.className = 'a11y-bar-chart__header';
    const title = document.createElement(`h${config.headingLevel}`);
    title.className = 'a11y-bar-chart__title';
    title.id = `${this.instanceId}-title`;
    title.textContent = this.chartTitle;
    header.append(title);
    if (this.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'a11y-bar-chart__subtitle';
      subtitle.textContent = this.subtitle;
      header.append(subtitle);
    }
    root.append(header);

    let model: A11yBarChartSemanticModel | undefined;
    const validationMessage = this.#dataErrorCode
      ? this.#localizedValidation(this.#dataErrorCode, '', this.#dataErrorParams)
      : this.#totalInvalid ? this.#text('validationInvalidTotal') : '';
    const errorMessage = this.#messageError ? this.#text('invalidMessages') : validationMessage;
    if (this.#dataViewState.open && this.#dataViewState.dataView === 'inline' && (config.dataView !== 'inline' || Boolean(errorMessage) || !this.#data.length)) {
      // Closing for no-data/invalid/empty content clears the preference. A
      // temporary data-view mode switch closes the public view but preserves
      // the user's inline disclosure preference for a later return to inline.
      if (config.dataView === 'none' || Boolean(errorMessage) || !this.#data.length) this.#inlineDataOpen = false;
      this.#dispatchDataViewChange(false, 'inline');
    }
    if (errorMessage) {
      root.append(this.#message(errorMessage, true));
      this.#model = undefined;
    } else if (!this.#data.length) {
      root.append(this.#message(this.#text('empty')));
      this.#model = undefined;
    } else {
      model = buildBarModel(this.#data, {
        ...(this.#total !== undefined ? { total: this.#total } : {}),
        suppressed: this.suppressed,
        filtered: this.filtered,
        config,
        messages: { ...ENGLISH_MESSAGES, ...this.#messages },
        ...(this.#formatValue ? { formatValue: this.#formatValue } : {})
      });
      this.#model = model;
      const context = document.createElement('div');
      context.className = 'a11y-bar-chart__context';
      if (config.showContext && this.#context) context.append(renderRichContent(this.#context));
      if (context.childNodes.length) root.append(context);
      const indicators = [...model.indicators];
      if (indicators.length) {
        const wrap = document.createElement('div');
        wrap.className = 'a11y-bar-chart__indicators';
        wrap.setAttribute('role', 'group');
        wrap.setAttribute('aria-label', this.#text('categoryHeader'));
        for (const label of indicators) wrap.append(Object.assign(document.createElement('span'), { className: 'a11y-bar-chart__indicator', textContent: label }));
        root.append(wrap);
      }
      if (config.showSummary) {
        const summary = document.createElement('p');
        summary.className = 'a11y-bar-chart__summary';
        summary.textContent = model.summary;
        root.append(summary);
      }
      if (config.showDetails) {
        const help = document.createElement('p');
        help.id = `${this.instanceId}-details-help`;
        help.className = 'a11y-bar-chart__details-help';
        help.textContent = this.#text('detailsHelp');
        root.append(help);
        this.#details = new BarDetailsController(this.#text('detailsPreview'), this.#text('detailsPinned'));
      }
      if (config.scaleMode === 'largest' && config.scaleMaximum !== undefined) {
        const scale = document.createElement('p');
        scale.className = 'a11y-bar-chart__scale-description';
        let maximum: string;
        try { maximum = new Intl.NumberFormat(config.locale, { maximumFractionDigits: 20 }).format(config.scaleMaximum); }
        catch { maximum = String(config.scaleMaximum); }
        scale.textContent = this.#text('scaleShared', { maximum });
        root.append(scale);
      }
      root.append(this.#rows(model, config));
      if (config.showTotal) {
        const total = document.createElement('div');
        total.className = 'a11y-bar-chart__total';
        total.append(Object.assign(document.createElement('span'), { textContent: this.#text('total') }));
        total.append(Object.assign(document.createElement('span'), { textContent: model.totalText }));
        root.append(total);
      }
      if (model.warnings.length) root.append(this.#message(model.warnings.join(' ')));
      if (config.dataView !== 'none') root.append(this.#backgroundData(model));
    }

    const actions = document.createElement('div');
    actions.className = 'a11y-bar-chart__actions';
    const explain = document.createElement('button');
    explain.type = 'button';
    explain.className = 'a11y-bar-chart__action';
    explain.dataset.focusKey = 'explain';
    explain.append(actionIcon('toggle', this.#explanationOpen), document.createTextNode(this.#text(this.#explanationOpen ? 'hideExplanation' : 'explain')));
    explain.setAttribute('aria-expanded', String(this.#explanationOpen));
    explain.setAttribute('aria-controls', `${this.instanceId}-explanation`);
    explain.addEventListener('click', () => {
      this.#explanationOpen = !this.#explanationOpen;
      const region = this.querySelector<HTMLElement>(`#${this.instanceId}-explanation`);
      if (region) setDisclosure(explain, region, this.#explanationOpen);
      else explain.setAttribute('aria-expanded', String(this.#explanationOpen));
      this.#dispatchDisclosureChange('explanation', this.#explanationOpen);
      this.#queueRender();
    });
    if (config.showExplanation && model) actions.append(explain);
    if (config.showGlossary && model?.rows.some((row) => row.definition)) {
      const glossary = document.createElement('button');
      glossary.type = 'button';
      glossary.className = 'a11y-bar-chart__action';
      glossary.dataset.focusKey = 'glossary';
      glossary.append(actionIcon('toggle', this.#glossaryOpen), document.createTextNode(this.#text(this.#glossaryOpen ? 'hideGlossary' : 'glossary')));
      glossary.setAttribute('aria-expanded', String(this.#glossaryOpen));
      glossary.addEventListener('click', () => {
        this.#glossaryOpen = !this.#glossaryOpen;
        this.#dispatchDisclosureChange('glossary', this.#glossaryOpen);
        this.#queueRender();
      });
      actions.append(glossary);
    }
    this.#showDataButton = undefined;
    if (config.dataView === 'dialog' && !this.#messageError && config.showActions) {
        const show = document.createElement('button');
        show.type = 'button';
        show.className = 'a11y-bar-chart__action';
        show.dataset.focusKey = 'data';
        show.append(actionIcon('table'), document.createTextNode(this.#text('showData')));
        show.setAttribute('aria-haspopup', 'dialog');
        show.setAttribute('aria-controls', dialog.id);
        show.addEventListener('click', () => this.#openDialog());
        actions.append(show);
        this.#showDataButton = show;
    } else if (model) {
      // Inline data is presented below the chart.
    }
    if (model) {
      if (config.showGlossary && !this.#hasDefinitions()) {
        const noDefs = document.createElement('span');
        noDefs.className = 'a11y-bar-chart__visually-hidden';
        noDefs.textContent = this.#text('noDefinitions');
        actions.append(noDefs);
      }
    } else this.#showDataButton = undefined;
    if (config.showActions) root.append(actions);
    if (this.#dialogFailureKey) {
      const failure = this.#message(this.#text(this.#dialogFailureKey), true);
      failure.dataset.dialogFailure = '';
      root.append(failure);
    }

    if (model && config.dataView === 'inline') {
      if (dialogWasOpen) this.#inlineDataOpen = true;
      const details = this.#inlineData(model, config);
      root.append(details);
    }

    if (actions.parentElement === root) root.insertBefore(actions, root.querySelector('.a11y-bar-chart__rows'));
    if (model && config.showExplanation) {
      const explanation = this.#explanation(model, config);
      const rows = root.querySelector('.a11y-bar-chart__rows');
      if (actions.parentElement === root) actions.after(explanation);
      else if (rows) root.insertBefore(explanation, rows);
      else root.append(explanation);
    }
    if (config.dataView === 'dialog') this.#updateDialog(dialog, model, errorMessage, config);
    else {
      if (dialog.open) this.#closeDialog(true);
      else this.#modal?.disconnect(false);
      if (config.dataView === 'none') {
        dialog.replaceChildren();
        dialog.removeAttribute('aria-labelledby');
        dialog.setAttribute('aria-label', this.#text('dataDialogTitle', { title: this.chartTitle }));
      }
    }
    if (dialog.parentElement !== this) this.append(dialog);
    if (this.#live!.parentElement !== this) this.append(this.#stableLive());

    if (dialogWasOpen && dialog.isConnected && config.dataView === 'dialog') {
      if (reconnectDialog) this.#handleDialogOpenResult(this.#modal?.reconnect() ?? 'not-requested');
      else if (!this.#modal?.isOpen) this.#openDialog(false);
    }
    if (config.dataView === 'inline' && root.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')?.open) {
      this.#dispatchDataViewChange(true, 'inline');
    }
    const dataSignature = JSON.stringify({ data: this.#data, total: this.#total, dataError: this.#dataErrorCode, totalInvalid: this.#totalInvalid, messageError: this.#messageError });
    if (this.#hasRendered && dataSignature !== this.#lastDataSignature) {
      if (config.announceChanges) this.#announce(errorMessage ? this.#text('announcementDataError') : this.#text('announcementDataUpdated', { count: this.#data.length }));
      this.dispatchEvent(new CustomEvent<A11yBarChartDataChangeDetail>('a11y-bar-chart-data-change', {
        bubbles: true,
        detail: { data: copyData(this.#data, this.suppressed), model: model ? copyModel(model) : null }
      }));
    }
    this.#lastDataSignature = dataSignature;
    if (!this.#hasRendered) this.dispatchEvent(new CustomEvent('a11y-bar-chart-ready', { bubbles: true, detail: { instanceId: this.instanceId } }));
    this.#hasRendered = true;
    if (activeKey) this.#focusKey(activeKey);
  }

  #rows(model: A11yBarChartSemanticModel, config: ResolvedA11yBarChartConfig): HTMLUListElement {
    const list = document.createElement('ul');
    list.className = 'a11y-bar-chart__rows';
    list.setAttribute('aria-label', this.chartTitle);
    model.rows.forEach((row, index) => {
      const item = document.createElement('li');
      item.className = 'a11y-bar-chart__row';
      const heading = document.createElement('div');
      heading.className = 'a11y-bar-chart__row-heading';
      const label = document.createElement('span');
      label.className = 'a11y-bar-chart__label';
      label.id = `${this.instanceId}-category-${index}-label`;
      label.textContent = row.label;
      heading.append(label);
      if (config.showDetails) {
        const hint = document.createElement('label');
        hint.htmlFor = `${this.instanceId}-details-trigger-${index}`;
        hint.className = 'a11y-bar-chart__details-hint';
        hint.setAttribute('aria-hidden', 'true');
        hint.textContent = this.#text('detailsHint');
        heading.append(hint);
      }
      item.append(heading);
      const value = document.createElement(config.showDetails ? 'button' : 'div');
      value.className = 'a11y-bar-chart__bar-line';
      const trackWrap = document.createElement('span');
      trackWrap.className = 'a11y-bar-chart__track-wrap';
      trackWrap.style.setProperty('--a11y-bar-chart-row-ratio', `${Math.max(0, Math.min(1, row.barRatio)) * 100}%`);
      if (value instanceof HTMLButtonElement) {
        value.type = 'button';
        value.id = `${this.instanceId}-details-trigger-${index}`;
        value.classList.add('a11y-bar-chart__details-trigger');
        value.dataset.focusKey = `details:${row.id}`;
        if (index === 0) value.setAttribute('aria-describedby', `${this.instanceId}-details-help`);
        value.setAttribute('aria-expanded', 'false');
        value.setAttribute('aria-pressed', 'false');
        value.setAttribute('aria-controls', `${this.instanceId}-details-${index}`);
        value.addEventListener('keydown', (event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          const triggers = Array.from(list.querySelectorAll<HTMLButtonElement>('.a11y-bar-chart__details-trigger'));
          const currentIndex = triggers.indexOf(value);
          const destination = event.key === 'ArrowDown' ? currentIndex + 1
            : event.key === 'ArrowUp' ? currentIndex - 1
              : event.key === 'Home' ? 0
                : event.key === 'End' ? triggers.length - 1
                  : currentIndex;
          if (destination === currentIndex || destination < 0 || destination >= triggers.length) return;
          event.preventDefault();
          triggers[destination]?.focus();
        });
      }
      const track = document.createElement('span');
      track.className = 'a11y-bar-chart__track';
      track.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('span');
      bar.className = 'a11y-bar-chart__bar';
      if (config.targetStyle !== 'none' && row.targetOutcome !== 'unavailable') {
        const state = row.targetOutcome === 'met' ? 'positive' : 'negative';
        if (config.targetStyle !== 'texture') bar.classList.add(`a11y-bar-chart__bar--${state}-color`);
        if (config.targetStyle !== 'color') bar.classList.add(`a11y-bar-chart__bar--${state}-texture`);
      }
      bar.style.setProperty('--a11y-bar-chart-ratio', `${Math.max(0, Math.min(1, row.barRatio)) * 100}%`);
      track.append(bar);
      if (row.targetStartRatio !== null && row.targetEndRatio !== null) {
        track.classList.add('a11y-bar-chart__track--target');
        const target = document.createElement('span');
        target.className = `a11y-bar-chart__target${row.targetStartRatio === row.targetEndRatio ? ' a11y-bar-chart__target--point' : ''}`;
        target.style.setProperty('--a11y-bar-chart-target-start', `${row.targetStartRatio * 100}%`);
        target.style.setProperty('--a11y-bar-chart-target-width', `${(row.targetEndRatio - row.targetStartRatio) * 100}%`);
        track.append(target);
      }
      const valueText = document.createElement('span');
      valueText.className = 'a11y-bar-chart__value';
      if (config.showDetails) valueText.setAttribute('aria-hidden', 'true');
      let statusValue: HTMLElement | undefined;
      let percentageValue: HTMLElement | undefined;
      let countValue: HTMLElement | undefined;
      if (row.status === 'suppressed' || row.status === 'missing') {
        // Status text carries meaning independent of whether numeric annotations are shown.
        statusValue = Object.assign(document.createElement('span'), { className: 'a11y-bar-chart__status', textContent: row.valueText });
        valueText.append(statusValue);
      } else {
        if (config.showPercentages && row.percentageText) {
          percentageValue = Object.assign(document.createElement('span'), {
            className: 'a11y-bar-chart__percentage',
            textContent: config.showDetails ? `${this.#text('percentageHeader')}: ${row.percentageText}` : row.percentageText
          });
          valueText.append(percentageValue);
        }
        if (config.showPercentages && config.showCounts && row.percentageText) valueText.append(' ');
        if (config.showCounts) {
          countValue = Object.assign(document.createElement('strong'), {
            className: 'a11y-bar-chart__count',
            textContent: config.showDetails ? `${this.#text('countHeader')}: ${row.valueText}` : row.valueText
          });
          valueText.append(countValue);
        }
      }
      if (value instanceof HTMLButtonElement) {
        valueText.id = `${this.instanceId}-details-value-${index}`;
        if (statusValue) statusValue.id = `${this.instanceId}-details-status-${index}`;
        if (percentageValue) percentageValue.id = `${this.instanceId}-details-percentage-${index}`;
        if (countValue) countValue.id = `${this.instanceId}-details-count-${index}`;
      }
      trackWrap.append(track);
      if (valueText.childNodes.length) trackWrap.append(valueText);
      value.append(trackWrap);
      item.append(value);
      if (row.target !== null) {
        const targetText = document.createElement('p');
        targetText.className = 'a11y-bar-chart__target-text';
        targetText.textContent = row.targetNarrative;
        if (config.targetStyle !== 'none' && row.targetOutcomeLabel) {
          const outcome = document.createElement('strong');
          outcome.className = 'a11y-bar-chart__outcome-label';
          outcome.textContent = row.targetOutcomeLabel;
          targetText.prepend(outcome, ' · ');
        }
        // The interactive bar already includes this sentence in its accessible name.
        if (config.showDetails) targetText.setAttribute('aria-hidden', 'true');
        item.append(targetText);
      }
      if (row.definition && this.#glossaryOpen && config.showGlossary) {
        const definition = document.createElement('div');
        definition.className = 'a11y-bar-chart__definition';
        definition.id = `${this.instanceId}-category-${index}-definition`;
        definition.append(renderRichContent(row.definition));
        item.append(definition);
      }
      if (value instanceof HTMLButtonElement) {
        const definitionText = richContentToText(row.definition);
        const omittedValues = row.status === 'reported' ? [
          ...(!config.showCounts ? [`${this.#text('countHeader')}: ${row.valueText}`] : []),
          ...(!config.showPercentages ? [`${this.#text('percentageHeader')}: ${row.percentageText}`] : [])
        ] : [];
        const detailsReading = document.createElement('span');
        detailsReading.id = `${this.instanceId}-details-reading-${index}`;
        detailsReading.className = 'a11y-bar-chart__visually-hidden';
        detailsReading.setAttribute('aria-hidden', 'true');
        const labelledParts: string[] = [label.id, valueText.id];
        if (statusValue) labelledParts.push(statusValue.id);
        const remainingReading = document.createElement('span');
        remainingReading.id = `${this.instanceId}-details-rest-${index}`;
        remainingReading.textContent = [
          ...omittedValues,
          row.targetNarrative,
          row.targetOutcomeLabel,
          ...(definitionText ? [`${this.#text('definitionToggle', { label: row.label })}: ${definitionText}`] : []),
          this.#text('detailsAction', { label: row.label })
        ].filter(Boolean).join(' ');
        detailsReading.append(remainingReading);
        labelledParts.push(remainingReading.id);
        value.append(detailsReading);
        // Keep the category's visible text verbatim in its accessible name;
        // the value annotations identify their meaning visually and to AT.
        value.setAttribute('aria-labelledby', labelledParts.join(' '));
      }
      if (value instanceof HTMLButtonElement) this.#appendDetails(item, value, row, index);
      list.append(item);
    });
    return list;
  }

  #appendDetails(item: HTMLElement, trigger: HTMLButtonElement, row: A11yBarChartRow, index: number): void {
    const cardId = `${this.instanceId}-details-${index}`;
    const content = createCardContent(document, {
      heading: row.label,
      ariaLabel: row.label,
      role: 'region',
      headingId: `${cardId}-title`,
      titleTag: 'strong',
      valuesAsDefinitionList: true,
      rows: [
        { label: this.#text('countHeader'), value: row.valueText },
        { label: this.#text('percentageHeader'), value: row.percentageText },
        ...(row.target !== null ? [{ label: this.#text('targetHeader'), value: row.targetText }] : [])
      ],
      ...(row.targetNarrative ? { description: row.targetNarrative } : {}),
      ...(row.targetOutcome !== 'unavailable' ? {
        status: {
          text: row.targetOutcomeLabel,
          className: `a11y-bar-chart__details-outcome--${row.targetOutcome}`
        }
      } : {})
    }, {
      root: 'a11y-bar-chart__details',
      header: 'a11y-bar-chart__details-header',
      heading: 'a11y-bar-chart__details-heading',
      title: 'a11y-bar-chart__details-title',
      status: 'a11y-bar-chart__details-outcome',
      values: 'a11y-bar-chart__details-values',
      label: 'a11y-bar-chart__details-label',
      value: 'a11y-bar-chart__details-value',
      description: 'a11y-bar-chart__details-target'
    });
    const card = content.root;
    card.id = cardId;
    card.hidden = true;
    const status = document.createElement('p');
    status.className = 'a11y-bar-chart__details-status';
    card.append(status);
    const definitionText = richContentToText(row.definition);
    if (definitionText) {
      const definition = document.createElement('p');
      definition.className = 'a11y-bar-chart__details-definition';
      definition.textContent = `${this.#text('definitionToggle', { label: row.label })}: ${definitionText}`;
      card.append(definition);
    }
    item.append(card);
    this.#details?.register(item, trigger, card, status);
  }

  #explanation(model: A11yBarChartSemanticModel, config: ResolvedA11yBarChartConfig): HTMLElement {
    const region = document.createElement('div');
    region.className = 'a11y-bar-chart__plain-language';
    region.id = `${this.instanceId}-explanation`;
    region.hidden = !this.#explanationOpen;
    if (this.#explanationOpen) {
      const heading = document.createElement(`h${Math.min(6, config.headingLevel + 1)}`);
      heading.className = 'a11y-bar-chart__plain-language-title';
      heading.id = `${this.instanceId}-explanation-title`;
      heading.textContent = this.#text('plainLanguageSummary');
      region.setAttribute('aria-labelledby', heading.id);
      region.append(heading);
      if (this.#authoredExplanation.trim()) {
        const authored = document.createElement('div');
        authored.className = 'a11y-bar-chart__authored-explanation';
        authored.append(renderRichContent(this.#authoredExplanation));
        region.append(authored);
      } else {
        const list = document.createElement('ul');
        list.className = 'a11y-bar-chart__explanation';
        for (const item of model.explanation) list.append(Object.assign(document.createElement('li'), { textContent: item }));
        region.append(list);
        if (config.showContext && this.#context) {
          const context = document.createElement('div');
          context.className = 'a11y-bar-chart__context';
          context.append(renderRichContent(this.#context));
          region.append(context);
        }
      }
    }
    return region;
  }

  #inlineData(model: A11yBarChartSemanticModel, config: ResolvedA11yBarChartConfig): HTMLDetailsElement {
    const details = document.createElement('details');
    details.className = 'a11y-bar-chart__inline-data';
    details.open = this.#inlineDataOpen;
    details.addEventListener('toggle', () => {
      if (this.#inlineDataOpen === details.open) return;
      this.#inlineDataOpen = details.open;
      this.#dispatchDataViewChange(details.open, 'inline');
    });
    const summary = document.createElement('summary');
    summary.textContent = this.#text('dataInlineSummary');
    summary.dataset.focusKey = 'inline-summary';
    details.append(summary, this.#dataViewContent(model, config, 'inline'));
    if (config.showExport) details.append(this.#exportButtons(model));
    return details;
  }

  #dataViewContent(model: A11yBarChartSemanticModel, config: ResolvedA11yBarChartConfig, suffix: 'background' | 'dialog' | 'inline'): HTMLElement {
    const content = document.createElement('div');
    content.className = 'a11y-bar-chart__data-content';
    if (config.showContext && this.#context) {
      const context = document.createElement('div');
      context.className = 'a11y-bar-chart__context';
      context.append(Object.assign(document.createElement('strong'), { textContent: this.#text('contextLabel') }));
      context.append(renderRichContent(this.#context));
      content.append(context);
    }
    if (this.#dataNote) {
      const note = document.createElement('div');
      note.className = 'a11y-bar-chart__data-note';
      const label = document.createElement('strong');
      label.textContent = this.#text('dataNoteLabel');
      const body = document.createElement('div');
      body.append(renderRichContent(this.#dataNote));
      note.append(label, body);
      content.append(note);
    }
    if (this.#authoredExplanation.trim()) {
      const explanation = document.createElement('div');
      explanation.className = 'a11y-bar-chart__authored-explanation';
      const label = document.createElement('strong');
      label.textContent = this.#text('explanationLabel');
      const body = document.createElement('div');
      body.append(renderRichContent(this.#authoredExplanation));
      explanation.append(label, body);
      content.append(explanation);
    }
    if (this.suppressed) {
      const note = document.createElement('p');
      note.className = 'a11y-bar-chart__suppression-note';
      note.textContent = this.#text('suppressionNote');
      content.append(note);
    }
    content.append(this.#table(model, suffix));
    return content;
  }

  #backgroundData(model: A11yBarChartSemanticModel): HTMLElement {
    const region = document.createElement('div');
    region.className = 'a11y-bar-chart__background-data a11y-bar-chart__visually-hidden';
    // The always-present accessible fallback stays table-only so authored rich
    // content (which may contain links) cannot create invisible keyboard stops.
    region.append(this.#table(model, 'background'));
    return region;
  }

  #table(model: A11yBarChartSemanticModel, suffix: 'background' | 'dialog' | 'inline'): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'a11y-bar-chart__table-wrap';
    if (suffix !== 'background') {
      // Visible tables can overflow horizontally at narrow widths. Give the
      // viewport a name and keyboard access so users can scroll it deliberately.
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', this.#text('dataTableCaption', { title: this.chartTitle }));
    }
    const table = document.createElement('table');
    table.className = 'a11y-bar-chart__table';
    table.id = `${this.instanceId}-data-${suffix}`;
    const caption = document.createElement('caption');
    caption.textContent = this.#text('dataTableCaption', { title: this.chartTitle });
    table.append(caption);
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const hasTargets = model.rows.some((row) => row.target !== null);
    for (const key of ['categoryHeader', 'countHeader', 'percentageHeader', ...(hasTargets ? ['targetHeader'] : [])] as MessageKey[]) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = this.#text(key);
      headerRow.append(th);
    }
    head.append(headerRow);
    const body = document.createElement('tbody');
    for (const row of model.rows) {
      const tr = document.createElement('tr');
      tr.append(Object.assign(document.createElement('th'), { scope: 'row', textContent: row.label }));
      tr.append(Object.assign(document.createElement('td'), { textContent: row.valueText }));
      tr.append(Object.assign(document.createElement('td'), { textContent: row.percentageText }));
      if (hasTargets) tr.append(Object.assign(document.createElement('td'), { textContent: row.targetText }));
      body.append(tr);
    }
    const foot = document.createElement('tfoot');
    const totalRow = document.createElement('tr');
    totalRow.append(Object.assign(document.createElement('th'), { scope: 'row', textContent: this.#text('total') }));
    totalRow.append(Object.assign(document.createElement('td'), { textContent: model.totalText }));
    totalRow.append(Object.assign(document.createElement('td'), { textContent: '' }));
    if (hasTargets) totalRow.append(Object.assign(document.createElement('td'), { textContent: '' }));
    foot.append(totalRow);
    table.append(head, body, foot);
    wrap.append(table);
    return wrap;
  }

  #updateDialog(dialog: HTMLDialogElement, model: A11yBarChartSemanticModel | undefined, errorMessage: string, config: ResolvedA11yBarChartConfig): void {
    let inner = dialog.querySelector<HTMLElement>('.a11y-bar-chart__dialog-inner');
    let title = dialog.querySelector<HTMLHeadingElement>('.a11y-bar-chart__dialog-title');
    if (!inner || !title) {
      inner = document.createElement('div');
      inner.className = 'a11y-bar-chart__dialog-inner';
      const header = document.createElement('header');
      header.className = 'a11y-bar-chart__dialog-header';
      title = document.createElement('h2');
      title.className = 'a11y-bar-chart__dialog-title';
      title.id = `${this.instanceId}-dialog-title`;
      header.append(title, this.#dialogClose!);
      inner.append(header);
      dialog.replaceChildren(inner);
    }
    title.textContent = this.#text('dataDialogTitle', { title: this.chartTitle });
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.removeAttribute('aria-label');
    this.#dialogClose!.textContent = this.#text('close');
    const oldContent = inner.querySelector('[data-dialog-content]');
    const content = document.createElement('div');
    content.dataset.dialogContent = '';
    if (errorMessage) content.append(this.#message(errorMessage, true));
    else if (model) {
      content.append(this.#dataViewContent(model, config, 'dialog'));
      if (config.showExport) content.append(this.#exportButtons(model));
    }
    else content.append(this.#message(this.#text('empty')));
    if (oldContent) oldContent.replaceWith(content); else inner.append(content);
  }

  #exportButtons(model: A11yBarChartSemanticModel): DocumentFragment {
    const buttons = document.createDocumentFragment();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'a11y-bar-chart__action';
    button.dataset.focusKey = 'export';
    button.textContent = this.#text('exportCsv');
    button.addEventListener('click', () => {
      const metadata = {
        messages: { ...ENGLISH_MESSAGES, ...this.#messages },
        locale: this.#resolvedConfig().locale,
        contextText: richContentToText(this.#context),
        explanationText: richContentToText(this.#authoredExplanation),
        dataNoteText: richContentToText(this.#dataNote),
        suppressed: this.suppressed,
        chartTitle: this.chartTitle
      };
      // The byte-order mark lets spreadsheet applications detect UTF-8.
      const blob = new Blob([CSV_BYTE_ORDER_MARK + buildBarCsv(model, metadata)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${this.#safeId(this.chartTitle)}.csv`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    });
    buttons.append(button);
    return buttons;
  }

  #message(message: string, error = false): HTMLElement {
    const element = document.createElement('p');
    element.className = `a11y-bar-chart__message${error ? ' a11y-bar-chart__message--error' : ''}`;
    if (error) element.setAttribute('role', 'alert');
    element.textContent = message;
    return element;
  }

  #stableLive(): HTMLElement { return this.#live!; }
  #hasDefinitions(): boolean { return this.#model?.rows.some((row) => Boolean(row.definition)) ?? false; }
  #safeId(value: string): string { return value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || 'item'; }
  #applyTheme(root: HTMLElement, dialog: HTMLDialogElement): void {
    const variables = themeToCssVariables(this.#theme);
    for (const variable of this.#appliedThemeVariables) {
      root.style.removeProperty(variable);
      dialog.style.removeProperty(variable);
    }
    for (const [variable, value] of Object.entries(variables)) {
      if (!value) continue;
      root.style.setProperty(variable, value);
      dialog.style.setProperty(variable, value);
    }
    this.#appliedThemeVariables = Object.keys(variables);
  }
  #dispatchDataViewChange(open: boolean, dataView: 'dialog' | 'inline'): void {
    const previous = this.#dataViewState;
    if (previous.open === open && previous.dataView === dataView) return;
    if (!open && !previous.open) return;
    this.#dataViewState = { open, dataView };
    this.dispatchEvent(new CustomEvent<A11yBarChartDataViewChangeDetail>('a11y-bar-chart-data-view-change', {
      bubbles: true, detail: { open, dataView }
    }));
  }
  #dispatchDisclosureChange(disclosure: 'explanation' | 'glossary', expanded: boolean): void {
    this.dispatchEvent(new CustomEvent<A11yBarChartDisclosureChangeDetail>('a11y-bar-chart-disclosure-change', {
      bubbles: true, detail: { disclosure, expanded }
    }));
  }
  #activeKey(): string | undefined {
    const active = document.activeElement;
    return active instanceof HTMLElement && this.contains(active) ? active.dataset.focusKey : undefined;
  }
  #focusKey(key: string): void {
    const target = Array.from(this.querySelectorAll<HTMLElement>('[data-focus-key]')).find((item) => item.dataset.focusKey === key);
    if (!target || target.closest('[hidden]') || (target.closest('dialog') && !this.#dialog?.open) ||
      (target.tagName !== 'SUMMARY' && target.closest('details:not([open])'))) {
      this.#focusDataAction();
      return;
    }
    target.focus({ preventScroll: true });
  }
  #dataAction(): HTMLElement | undefined {
    return this.#showDataButton?.isConnected
      ? this.#showDataButton
      : this.querySelector<HTMLElement>('.a11y-bar-chart__inline-data > summary')
        ?? this.querySelector<HTMLElement>('[data-focus-key="explain"]')
        ?? this.querySelector<HTMLElement>('.a11y-bar-chart__root')
        ?? undefined;
  }
  #focusDataAction(): void {
    const target = this.#dataAction();
    if (target && !target.hasAttribute('tabindex') && target === this.querySelector('.a11y-bar-chart__root')) target.setAttribute('tabindex', '-1');
    target?.focus({ preventScroll: true });
  }
  #announce(message: string): void {
    const live = this.#stableLive();
    live.textContent = '';
    queueMicrotask(() => { if (live.isConnected) live.textContent = message; });
  }
  #openDialog(focus = true): void {
    if (!this.#modal) return;
    const result = this.#modal.open(focus ? this.#dialogClose : undefined);
    this.#handleDialogOpenResult(result);
  }
  #closeDialog(restore: boolean): void {
    this.#modal?.close(restore);
  }
  #handleDialogOpenResult(result: ModalOpenResult | 'not-requested'): void {
    const code = result === 'unsupported' ? 'dialogUnsupported'
      : result === 'failed' ? 'dialogUnavailable' : '';
    if (code) {
      const message = this.#text(code);
      this.#dialogFailureKey = code;
      this.#dispatchError(code, message);
      this.#queueRender();
      return;
    }
    if (this.#dialogFailureKey) {
      this.#dialogFailureKey = '';
      this.querySelector('[data-dialog-failure]')?.remove();
    }
  }
  #dispatchError(code: string, message: string): void {
    this.dispatchEvent(new CustomEvent<A11yBarChartErrorDetail>('a11y-bar-chart-error', {
      bubbles: true,
      detail: { code, message, data: copyData(this.#data, this.suppressed) }
    }));
  }
}

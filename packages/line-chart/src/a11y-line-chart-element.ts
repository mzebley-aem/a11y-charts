import type {
  A11yLineChartMessages,
  A11yLineChartConfig,
  A11yLineChartDataView,
  A11yLineChartBaseline,
  A11yLineChartDatum,
  A11yLineChartDefinition,
  A11yLineChartDataChangeDetail,
  A11yLineChartSettingsChangeDetail,
  A11yLineChartDataViewChangeDetail,
  A11yLineChartDisclosureChangeDetail,
  A11yLineChartDifferenceFormatter,
  A11yLineChartErrorDetail,
  A11yLineChartLegacyDatum,
  A11yLineChartPattern,
  A11yLineChartPercentScale,
  A11yLineChartPointChangeDetail,
  A11yLineChartSemanticModel,
  A11yLineChartSeries,
  A11yLineChartTarget,
  A11yLineChartTheme,
  A11yLineChartTooltipAriaLabelBuilder,
  A11yLineChartTooltipHtmlBuilder,
  A11yLineChartTooltipRenderer,
  A11yLineChartValueFormatter,
  A11yLineChartValuePreset,
  A11yLineChartXFormatter,
  A11yLineChartXValue
} from './model.js';
import { ENGLISH_LINE_CHART_MESSAGES, formatLineMessage, isLineChartMessageKey, pluralLineMessage } from './messages.js';
import { buildChartOptions, shouldSuggestYAxisZoom } from './chart-options.js';
import { resolveConfig, resolveTheme, type ResolvedA11yLineChartConfig } from './config.js';
import { EchartsAdapter } from './echarts-adapter.js';
import { buildSemanticModel } from './semantic-model.js';
import { copyTarget, formatTarget } from './target.js';
import { validateBaseline, validateData } from './validation.js';
import { buildLineCsv } from './csv.js';
import { CSV_BYTE_ORDER_MARK, fractionToWholePercent, wholePercentToFraction } from '../../chart-core/src/csv.js';
import { renderLineRichContent, lineRichContentToText } from './rich-content.js';
import { ModalController } from '../../chart-core/src/ui/modal-controller.js';
import { setDisclosure, toggleDisclosure } from '../../chart-core/src/ui/disclosure.js';

const OWNED_ROOT_ATTRIBUTE = 'data-a11y-line-chart-owned';
let nextInstanceId = 0;

function nextId(): string {
  nextInstanceId += 1;
  return `a11y-line-chart-${nextInstanceId}`;
}

function isHeadingLevel(value: number): value is 1 | 2 | 3 | 4 | 5 | 6 {
  return value >= 1 && value <= 6;
}

/** Applies a percent-scale conversion to one series value; null and undefined pass through unchanged. */
function scaleSeriesValue<T extends number | null | undefined>(value: T, scale: (value: number) => number): T {
  return (typeof value === 'number' ? scale(value) : value) as T;
}

/** Applies a percent-scale conversion to a numeric target or range; absent targets pass through unchanged. */
function scaleTarget<T extends A11yLineChartTarget | null | undefined>(target: T, scale: (value: number) => number): T {
  if (typeof target === 'number') return scale(target) as T;
  if (target && typeof target === 'object') return { min: scale(target.min), max: scale(target.max) } as T;
  return target;
}

function copyX(value: A11yLineChartXValue): A11yLineChartXValue {
  return value instanceof Date ? new Date(value.getTime()) : value;
}

function typedX(value: A11yLineChartXValue): { type: 'date' | 'number' | 'string'; value: string | number } {
  if (value instanceof Date) return { type: 'date', value: value.toISOString() };
  return { type: typeof value as 'number' | 'string', value };
}

interface StepperElements {
  next: HTMLButtonElement;
  previous: HTMLButtonElement;
  root: HTMLDivElement;
  status: HTMLSpanElement;
}

export class A11yLineChartElement extends HTMLElement {
  static readonly observedAttributes = ['chart-title', 'data-view', 'heading-level', 'locale', 'messages', 'percent-scale', 'subtitle', 'value-preset', 'filtered', 'suppressed'];

  readonly instanceId = nextId();

  #buildTooltipAriaLabel: A11yLineChartTooltipAriaLabelBuilder | undefined;
  #buildTooltipHtml: A11yLineChartTooltipHtmlBuilder | undefined;
  #baselineInput: unknown;
  #baselineErrorMessage = '';
  #chartAdapter: EchartsAdapter | undefined;
  #chartUpdate: (() => void) | undefined;
  #config: A11yLineChartConfig = {};
  #context: string | undefined;
  #dataNote = '';
  #definitions: A11yLineChartDefinition[] = [];
  #filtered = false;
  #suppressed = false;
  #explanationOpen = false;
  #glossaryOpen = false;
  #dataViewOpen = false;
  #activeDataView: 'dialog' | 'inline' = 'dialog';
  #messages: A11yLineChartMessages = {};
  #messagesError = false;
  #dataDialog: HTMLDialogElement | undefined;
  #modalController: ModalController | undefined;
  #liveRegion: HTMLDivElement | undefined;
  #rendered = false;
  #dataChangedSinceRender = false;
  #sourceRevision = 0;
  #renderedSourceRevision = -1;
  #lastDataSourceSignature = '';
  #inlineOpen = false;
  /** Validated data exactly as the author supplied it (author scale). */
  #sourceData: A11yLineChartDatum[] = [];
  /** Data in whole percent (or the author's scale for number presets); every internal consumer reads this. */
  #data: A11yLineChartDatum[] = [];
  #errorMessage = '';
  #dataValidationError: { key: keyof typeof ENGLISH_LINE_CHART_MESSAGES; values: Record<string, unknown> } | undefined;
  #focusedIndex = 0;
  #selectionRevealGeneration = 0;
  #formatDifference: A11yLineChartDifferenceFormatter | undefined;
  #formatValue: A11yLineChartValueFormatter | undefined;
  #formatX: A11yLineChartXFormatter | undefined;
  #legendCleanup: (() => void) | undefined;
  #legendSelection: Record<string, boolean> | undefined;
  #liveClearTimer: ReturnType<typeof setTimeout> | undefined;
  #ownedRoot?: HTMLElement;
  #readyDispatched = false;
  #renderQueued = false;
  #lifecycleGeneration = 0;
  #pendingFrames = new Set<number>();
  #dialogReopenOnConnect = false;
  #suppressDialogClose = false;
  #focusedPeriodKey: string | undefined;
  #renderTooltip: A11yLineChartTooltipRenderer | undefined;
  #resizeObserver: ResizeObserver | undefined;
  #semanticModel: A11yLineChartSemanticModel | undefined;
  #theme: A11yLineChartTheme = {};
  #windowResizeListener = (): void => this.#chartAdapter?.resize();

  get chartTitle(): string {
    return this.getAttribute('chart-title')?.trim() || this.#t('title');
  }

  set chartTitle(value: string) {
    this.setAttribute('chart-title', value);
  }

  get locale(): string {
    return this.#locale();
  }

  set locale(value: string) {
    if (value) this.setAttribute('locale', value);
    else this.removeAttribute('locale');
  }

  get subtitle(): string {
    return this.getAttribute('subtitle')?.trim() || '';
  }

  set subtitle(value: string) {
    if (value) this.setAttribute('subtitle', value);
    else this.removeAttribute('subtitle');
  }

  get baseline(): A11yLineChartBaseline | undefined {
    const result = validateBaseline(this.#baselineInput, this.#data);
    if (!result.valid || !result.baseline) return undefined;
    return {
      ...result.baseline,
      x: result.baseline.x instanceof Date
        ? new Date(result.baseline.x.getTime())
        : result.baseline.x
    };
  }

  set baseline(value: A11yLineChartBaseline | undefined) {
    this.#baselineInput = value && typeof value === 'object'
      ? {
          ...value,
          x: value.x instanceof Date ? new Date(value.x.getTime()) : value.x
        }
      : value;
    this.#updateBaselineValidation(true);
    this.#sourceRevision++;
    this.#queueRender();
  }

  get config(): A11yLineChartConfig {
    return { ...this.#config };
  }

  set config(value: A11yLineChartConfig) {
    const previous = this.#config;
    const next = value && typeof value === 'object' ? value : {};
    this.#config = { ...next };
    if (next.explanationExpanded !== previous.explanationExpanded) this.#explanationOpen = next.explanationExpanded === true;
    if (next.glossaryExpanded !== previous.glossaryExpanded) this.#glossaryOpen = next.glossaryExpanded === true;
    this.#legendSelection = undefined;
    this.#focusedIndex = Math.min(this.#focusedIndex, Math.max(0, this.#data.length - 1));
    this.#queueRender();
  }

  get messages(): A11yLineChartMessages { return { ...this.#messages }; }
  set messages(value: A11yLineChartMessages) {
    this.#messages = value && typeof value === 'object' ? { ...value } : {};
    this.#messagesError = false;
    this.#refreshValidationMessages();
    this.#queueRender();
  }

  get context(): string | undefined { return this.#context; }
  set context(value: string | undefined) { this.#context = typeof value === 'string' ? value : undefined; this.#queueRender(); }
  get dataNote(): string { return this.#dataNote; }
  set dataNote(value: string) { this.#dataNote = typeof value === 'string' ? value : ''; this.#queueRender(); }
  get definitions(): A11yLineChartDefinition[] { return this.#definitions.map((definition) => ({ ...definition })); }
  set definitions(value: A11yLineChartDefinition[]) {
    const seen = new Set<string>();
    this.#definitions = [];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!item || typeof item.id !== 'string' || !item.id.trim() || seen.has(item.id)
          || typeof item.label !== 'string' || !item.label.trim() || typeof item.definition !== 'string') continue;
        seen.add(item.id);
        this.#definitions.push({ id: item.id, label: item.label, definition: item.definition });
      }
    }
    this.#queueRender();
  }
  get filtered(): boolean { return this.#filtered; }
  set filtered(value: boolean) { this.#filtered = Boolean(value); this.toggleAttribute('filtered', this.#filtered); this.#queueRender(); }
  get suppressed(): boolean { return this.#suppressed; }
  set suppressed(value: boolean) { this.#suppressed = Boolean(value); this.toggleAttribute('suppressed', this.#suppressed); this.#queueRender(); }

  /** Compatibility alias for the Angular component's accessibility input. */
  get a11y(): A11yLineChartConfig {
    return this.config;
  }

  set a11y(value: A11yLineChartConfig) {
    this.config = value;
  }

  get data(): A11yLineChartDatum[] {
    return this.#sourceData.map((item) => ({ ...item, target: copyTarget(item.target), x: item.x instanceof Date ? new Date(item.x.getTime()) : item.x }));
  }

  set data(value: Array<A11yLineChartDatum | A11yLineChartLegacyDatum>) {
    let validationError: { key: keyof typeof ENGLISH_LINE_CHART_MESSAGES; values: Record<string, unknown> } | undefined;
    const result = validateData(value, (key, values = {}) => {
      validationError = { key, values: { ...values } };
      return this.#t(key, values);
    });
    this.#sourceRevision++;
    if (result.valid) {
      this.#sourceData = result.data;
      this.#recomputeData();
      this.#focusedIndex = this.#findFocusedPeriodIndex(this.#data);
      this.#errorMessage = '';
      this.#dataValidationError = undefined;
      this.#focusedIndex = Math.min(this.#focusedIndex, Math.max(0, this.#data.length - 1));
      this.#updateBaselineValidation(true);
    } else {
      this.#sourceData = [];
      this.#data = [];
      this.#dataValidationError = validationError;
      this.#errorMessage = result.message;
      this.dispatchEvent(new CustomEvent<A11yLineChartErrorDetail>('a11y-line-chart-error', {
        bubbles: true,
        detail: { code: 'invalid-data', message: result.message }
      }));
    }
    this.#queueRender();
  }

  get formatValue(): A11yLineChartValueFormatter | undefined { return this.#formatValue; }
  set formatValue(value: A11yLineChartValueFormatter | undefined) { this.#formatValue = value; this.#queueRender(); }

  get formatDifference(): A11yLineChartDifferenceFormatter | undefined { return this.#formatDifference; }
  set formatDifference(value: A11yLineChartDifferenceFormatter | undefined) { this.#formatDifference = value; this.#queueRender(); }

  get formatXValue(): A11yLineChartXFormatter | undefined { return this.#formatX; }
  set formatXValue(value: A11yLineChartXFormatter | undefined) { this.#formatX = value; this.#queueRender(); }

  get buildTooltipHtml(): A11yLineChartTooltipHtmlBuilder | undefined { return this.#buildTooltipHtml; }
  set buildTooltipHtml(value: A11yLineChartTooltipHtmlBuilder | undefined) { this.#buildTooltipHtml = value; this.#queueRender(); }

  get buildTooltipAriaLabel(): A11yLineChartTooltipAriaLabelBuilder | undefined { return this.#buildTooltipAriaLabel; }
  set buildTooltipAriaLabel(value: A11yLineChartTooltipAriaLabelBuilder | undefined) { this.#buildTooltipAriaLabel = value; this.#queueRender(); }

  get renderTooltip(): A11yLineChartTooltipRenderer | undefined { return this.#renderTooltip; }
  set renderTooltip(value: A11yLineChartTooltipRenderer | undefined) { this.#renderTooltip = value; this.#queueRender(); }

  get theme(): A11yLineChartTheme { return { ...this.#theme }; }
  set theme(value: A11yLineChartTheme) { this.#theme = value && typeof value === 'object' ? { ...value } : {}; this.#queueRender(); }

  get xAxisTitle(): string { return this.#resolvedConfig().xAxisTitle; }
  set xAxisTitle(value: string) { this.#setConfigField('xAxisTitle', value); }
  get yAxisTitle(): string { return this.#resolvedConfig().yAxisTitle; }
  set yAxisTitle(value: string) { this.#setConfigField('yAxisTitle', value); }
  get yAxisBaseMin(): number { return this.#resolvedConfig().yAxisBaseMin; }
  set yAxisBaseMin(value: number) { this.#setConfigField('yAxisBaseMin', value); }
  get yAxisBaseMax(): number { return this.#resolvedConfig().yAxisBaseMax; }
  set yAxisBaseMax(value: number) { this.#setConfigField('yAxisBaseMax', value); }
  get minWidth(): number { return this.#resolvedConfig().minWidth; }
  set minWidth(value: number) { this.#setConfigField('minWidth', value); }
  get maxWidth(): number | undefined { return this.#resolvedConfig().maxWidth; }
  set maxWidth(value: number | undefined) { this.#setConfigField('maxWidth', value); }
  get dynamicMinWidth(): boolean { return this.#resolvedConfig().dynamicMinWidth; }
  set dynamicMinWidth(value: boolean) { this.#setConfigField('dynamicMinWidth', value); }
  get dynamicMaxWidth(): boolean { return this.#resolvedConfig().dynamicMaxWidth; }
  set dynamicMaxWidth(value: boolean) { this.#setConfigField('dynamicMaxWidth', value); }
  get perPointMinWidth(): number { return this.#resolvedConfig().perPointMinWidth; }
  set perPointMinWidth(value: number) { this.#setConfigField('perPointMinWidth', value); }
  get perPointMaxWidth(): number { return this.#resolvedConfig().perPointMaxWidth; }
  set perPointMaxWidth(value: number) { this.#setConfigField('perPointMaxWidth', value); }
  get autoPerPointMinWidth(): boolean { return this.#resolvedConfig().autoPerPointMinWidth; }
  set autoPerPointMinWidth(value: boolean) { this.#setConfigField('autoPerPointMinWidth', value); }
  get autoPerPointMaxWidth(): boolean { return this.#resolvedConfig().autoPerPointMaxWidth; }
  set autoPerPointMaxWidth(value: boolean) { this.#setConfigField('autoPerPointMaxWidth', value); }

  connectedCallback(): void { this.#queueRender(); }

  disconnectedCallback(): void {
    this.#lifecycleGeneration++;
    this.#renderQueued = false;
    if (this.#liveClearTimer) clearTimeout(this.#liveClearTimer);
    for (const frame of this.#pendingFrames) cancelAnimationFrame(frame);
    this.#pendingFrames.clear();
    this.#dialogReopenOnConnect = this.#dataViewOpen;
    this.#modalController?.disconnect(this.#dataViewOpen);
    this.#disposeChart();
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (_name === 'filtered') { this.#filtered = newValue !== null; this.#queueRender(); return; }
    if (_name === 'suppressed') { this.#suppressed = newValue !== null; this.#queueRender(); return; }
    if (_name === 'messages') {
      if (newValue === null) { this.#messages = {}; this.#messagesError = false; }
      else {
        try {
          const parsed: unknown = JSON.parse(newValue);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(this.#t('invalidMessages'));
          const entries = Object.entries(parsed);
          if (entries.some(([key, value]) => !isLineChartMessageKey(key) || typeof value !== 'string')) throw new Error(this.#t('invalidMessages'));
          this.#messages = Object.fromEntries(entries) as A11yLineChartMessages;
          this.#messagesError = false;
        } catch {
          this.#messagesError = true;
          this.dispatchEvent(new CustomEvent<A11yLineChartErrorDetail>('a11y-line-chart-error', {
            bubbles: true,
            detail: { code: 'invalid-messages', message: this.#t('invalidMessages') }
          }));
        }
      }
    }
    if (_name === 'messages') this.#refreshValidationMessages();
    this.#queueRender();
  }

  #refreshValidationMessages(): void {
    if (this.#dataValidationError) this.#errorMessage = this.#t(this.#dataValidationError.key, this.#dataValidationError.values);
    this.#updateBaselineValidation(false);
  }

  #t(key: keyof typeof ENGLISH_LINE_CHART_MESSAGES, values: Record<string, unknown> = {}): string {
    const override = this.#messages[key];
    return formatLineMessage(typeof override === 'string' && override ? override : ENGLISH_LINE_CHART_MESSAGES[key], values);
  }

  #createOwnedRoot(): HTMLElement {
    const root = document.createElement('section');
    root.className = 'a11y-line-chart__root';
    root.setAttribute(OWNED_ROOT_ATTRIBUTE, this.instanceId);
    root.setAttribute('role', 'group');
    this.append(root);
    this.#ownedRoot = root;
    return root;
  }

  #resolvedConfig(): ResolvedA11yLineChartConfig {
    return resolveConfig({
      ...this.#config,
      actualSeriesLabel: this.#config.actualSeriesLabel ?? this.#t('actualLabel'),
      targetSeriesLabel: this.#config.targetSeriesLabel ?? this.#t('targetLabel'),
      baselineSeriesLabel: this.#config.baselineSeriesLabel ?? this.#t('baselineLabel'),
      describeMissingAs: this.#config.describeMissingAs ?? this.#t('missing'),
      xAxisTitle: this.#config.xAxisTitle ?? this.#t('defaultXAxisTitle'),
      yAxisTitle: this.#config.yAxisTitle ?? this.#t('defaultYAxisTitle'),
      headingLevel: this.#headingLevel(),
      locale: this.#locale(),
      dataView: this.#dataView(),
      percentScale: this.#percentScale(),
      valuePreset: this.#valuePreset()
    });
  }

  #setConfigField<Key extends keyof A11yLineChartConfig>(key: Key, value: A11yLineChartConfig[Key]): void {
    this.#config = { ...this.#config, [key]: value };
    this.#queueRender();
  }

  #formatSeriesValue(value: number | null | undefined, series: A11yLineChartSeries, x: A11yLineChartXValue): string {
    const config = this.#resolvedConfig();
    const normalized = value ?? null;
    if (normalized === null) return config.describeMissingAs;
    if (this.#formatValue) {
      try {
        const authorValue = this.#usesFractionScale(config) ? wholePercentToFraction(normalized) : normalized;
        const formatted = this.#formatValue({ value: authorValue, series, x: copyX(x), locale: config.locale });
        if (typeof formatted === 'string' && formatted.trim()) return formatted;
      } catch {
        // Fall through to the canonical formatter.
      }
    }
    const formatter = config.valuePreset === 'percent'
      ? new Intl.NumberFormat(config.locale, { style: 'percent', minimumFractionDigits: config.decimalPlaces, maximumFractionDigits: config.decimalPlaces })
      : new Intl.NumberFormat(config.locale, { minimumFractionDigits: config.decimalPlaces, maximumFractionDigits: config.decimalPlaces });
    return formatter.format(config.valuePreset === 'percent' ? normalized / 100 : normalized);
  }

  #formatDifferenceValue(
    value: number,
    comparison: 'baseline' | 'target',
    x: A11yLineChartXValue
  ): string {
    const config = this.#resolvedConfig();
    if (this.#formatDifference) {
      try {
        const formatted = this.#formatDifference({
          comparison,
          locale: config.locale,
          value,
          valuePreset: config.valuePreset,
          x: copyX(x)
        });
        if (typeof formatted === 'string' && formatted.trim()) return formatted;
      } catch {
        // Fall through to the canonical formatter.
      }
    }
    const number = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces
    }).format(value);
    if (config.valuePreset !== 'percent') return this.#t('differenceNumber', { value: number });
    return pluralLineMessage(this.#messages, 'differencePercent', value, config.locale, { value: number });
  }

  #formatXValue(value: A11yLineChartXValue): string {
    if (this.#formatX) {
      try {
        const formatted = this.#formatX(copyX(value), this.#locale());
        if (typeof formatted === 'string' && formatted.trim()) return formatted;
      } catch {
        // Fall through to the canonical formatter.
      }
    }
    if (value instanceof Date) {
      return new Intl.DateTimeFormat(this.#locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(value);
    }
    return String(value);
  }

  #updateBaselineValidation(reportError: boolean): A11yLineChartBaseline | undefined {
    const result = validateBaseline(this.#baselineInput, this.#data, (key, values = {}) => this.#t(key, values));
    if (result.valid) {
      this.#baselineErrorMessage = '';
      const baseline = result.baseline;
      if (!baseline || !this.#usesFractionScale(this.#resolvedConfig())) return baseline;
      return { ...baseline, value: fractionToWholePercent(baseline.value) };
    }
    const changed = result.message !== this.#baselineErrorMessage;
    this.#baselineErrorMessage = result.message;
    if (reportError && changed) {
      this.dispatchEvent(new CustomEvent<A11yLineChartErrorDetail>('a11y-line-chart-error', {
        bubbles: true,
        detail: { code: 'invalid-baseline', message: result.message }
      }));
    }
    return undefined;
  }

  #buildSemanticModel(config: ResolvedA11yLineChartConfig): A11yLineChartSemanticModel {
    const baseline = this.#updateBaselineValidation(false);
    return buildSemanticModel({
      ...(baseline ? { baseline } : {}),
      config,
      data: this.#data,
      suppressed: this.#suppressed,
      formatDifference: ({ comparison, value, x }) => this.#formatDifferenceValue(value, comparison, x),
      formatValue: (value, series, x) => this.#formatSeriesValue(value, series, x),
      formatXValue: (value) => this.#formatXValue(value),
      message: (key, values = {}) => key === 'summaryPeriods'
        ? pluralLineMessage(this.#messages, 'summaryPeriods', Number(values.total) || 0, config.locale, values)
        : this.#t(key as keyof typeof ENGLISH_LINE_CHART_MESSAGES, values)
    });
  }

  #headingLevel(): 1 | 2 | 3 | 4 | 5 | 6 {
    const attributeValue = Number(this.getAttribute('heading-level'));
    if (isHeadingLevel(attributeValue)) return attributeValue;
    return isHeadingLevel(Number(this.#config.headingLevel)) ? Number(this.#config.headingLevel) as 1 | 2 | 3 | 4 | 5 | 6 : 2;
  }

  #periodKey(value: A11yLineChartXValue): string {
    return value instanceof Date ? `date:${value.getTime()}` : `${typeof value}:${String(value)}`;
  }

  #rememberFocusedPeriod(): void {
    const datum = this.#data[this.#focusedIndex];
    if (datum) this.#focusedPeriodKey = this.#periodKey(datum.x);
  }

  #findFocusedPeriodIndex(data: A11yLineChartDatum[]): number {
    if (!this.#focusedPeriodKey) return Math.min(this.#focusedIndex, Math.max(0, data.length - 1));
    const match = data.findIndex((datum) => this.#periodKey(datum.x) === this.#focusedPeriodKey);
    const index = match >= 0 ? match : Math.min(this.#focusedIndex, Math.max(0, data.length - 1));
    this.#focusedPeriodKey = data[index] ? this.#periodKey(data[index]!.x) : undefined;
    return index;
  }

  #requestFrame(callback: FrameRequestCallback | (() => void)): number {
    let id = 0;
    id = requestAnimationFrame((time) => {
      this.#pendingFrames.delete(id);
      if (this.isConnected) callback(time);
    });
    this.#pendingFrames.add(id);
    return id;
  }

  #locale(): string {
    const candidate = this.getAttribute('locale')?.trim() || this.#config.locale || 'en-US';
    try { return Intl.getCanonicalLocales(candidate)[0] ?? 'en-US'; } catch { return 'en-US'; }
  }

  #queueRender(): void {
    if (!this.isConnected || this.#renderQueued) return;
    this.#renderQueued = true;
    const generation = this.#lifecycleGeneration;
    queueMicrotask(() => {
      if (generation !== this.#lifecycleGeneration) return;
      this.#renderQueued = false;
      if (this.isConnected) this.#render();
    });
  }

  #render(): void {
    this.#renderQueued = false;
    this.#lifecycleGeneration++;
    this.#recomputeData();
    const config = this.#resolvedConfig();
    const dialogWasOpen = Boolean(this.#dialogReopenOnConnect || this.#dataDialog?.open || this.#dataDialog?.hasAttribute('open'));
    const inlineDetails = this.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data');
    const inlineHadFocus = Boolean(inlineDetails?.contains(document.activeElement));
    const hadOwnedRootFocus = document.activeElement instanceof HTMLElement && Boolean(this.#ownedRoot?.contains(document.activeElement));
    const activeRootKey = hadOwnedRootFocus && document.activeElement instanceof HTMLElement
      ? document.activeElement.dataset['focusKey'] : undefined;
    if (document.activeElement instanceof HTMLInputElement && document.activeElement.classList.contains('a11y-line-chart__navigator')) {
      this.#rememberFocusedPeriod();
    }
    this.#inlineOpen = inlineDetails?.open ?? this.#inlineOpen;
    const dialogFocusKey = this.#dataDialog?.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).dataset['focusKey'] : undefined;
    const priorChartElement = this.#ownedRoot?.querySelector<HTMLElement>('.a11y-line-chart__chart');
    this.#disposeChart(false);
    const root = this.#ownedRoot?.isConnected ? this.#ownedRoot : this.#createOwnedRoot();
    this.#ensureLiveRegion();
    root.replaceChildren();
    root.setAttribute('aria-label', this.chartTitle);

    const header = document.createElement('header');
    header.className = 'a11y-line-chart__header';
    const heading = document.createElement(`h${this.#headingLevel()}`);
    heading.className = 'a11y-line-chart__title';
    heading.id = `${this.instanceId}-title`;
    heading.textContent = this.chartTitle;
    root.setAttribute('aria-labelledby', heading.id);
    header.append(heading);
    if (this.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'a11y-line-chart__subtitle';
      subtitle.textContent = this.subtitle;
      header.append(subtitle);
    }
    root.append(header);

    if (this.#errorMessage) {
      this.#disposeChart(true);
      this.#closeInlineViewIfOpen();
      this.#semanticModel = undefined;
      const error = document.createElement('p');
      error.className = 'a11y-line-chart__message a11y-line-chart__message--error';
      error.setAttribute('role', 'alert');
      error.tabIndex = -1;
      error.textContent = this.#t('invalidData', { message: this.#errorMessage });
      root.append(error);
      this.#updateOpenDialogStatus(error.textContent);
      if (hadOwnedRootFocus || (dialogWasOpen && this.#unavailableViewClosesDialog(config)) || inlineHadFocus) error.focus();
      this.#discardDataDialogForUnavailableView(config);
      this.#dispatchDataChange();
      return;
    }

    if (!this.#data.length) {
      this.#disposeChart(true);
      this.#closeInlineViewIfOpen();
      this.#semanticModel = undefined;
      const empty = document.createElement('p');
      empty.className = 'a11y-line-chart__message a11y-line-chart__message--empty';
      empty.tabIndex = -1;
      empty.textContent = this.#t('noData');
      root.append(empty);
      this.#updateOpenDialogStatus(empty.textContent);
      if (hadOwnedRootFocus || (dialogWasOpen && this.#unavailableViewClosesDialog(config)) || inlineHadFocus) empty.focus();
      this.#discardDataDialogForUnavailableView(config);
      this.#rendered = true;
      this.#dispatchReady();
      this.#dispatchDataChange();
      this.#announceDataUpdate(this.#resolvedConfig());
      return;
    }

    const semanticModel = this.#buildSemanticModel(config);
    this.#semanticModel = semanticModel;
    if (config.showSummary) root.append(this.#createSummary(semanticModel, config));
    else root.append(...this.#createAuthoredContext(semanticModel, config));
    if (this.#filtered) {
      const filtered = document.createElement('p'); filtered.className = 'a11y-line-chart__filtered';
      filtered.textContent = this.#t('filteredIndicator'); root.append(filtered);
    }
    if (this.#suppressed) {
      const suppressed = document.createElement('p'); suppressed.className = 'a11y-line-chart__suppression-indicator';
      suppressed.textContent = this.#t('suppressionIndicator'); root.append(suppressed);
    }
    if (config.showActions) root.append(this.#createActionStrip(config, semanticModel));
    if (config.showExplanation) root.append(this.#createExplanation(config, semanticModel, config.showActions));
    if (config.showGlossary && this.#definitions.length) root.append(this.#createGlossary(config, config.showActions));
    if (this.#baselineErrorMessage) {
      const warning = document.createElement('p');
      warning.className = 'a11y-line-chart__message a11y-line-chart__message--warning';
      warning.setAttribute('role', 'status');
      warning.textContent = this.#t('invalidBaseline', { message: this.#baselineErrorMessage });
      root.append(warning);
    }
    if (this.#messagesError) {
      const messageError = document.createElement('p');
      messageError.className = 'a11y-line-chart__message a11y-line-chart__message--error';
      messageError.setAttribute('role', 'alert');
      messageError.textContent = this.#t('invalidMessages');
      root.append(messageError);
    }
    if (config.showControls) root.append(this.#createControls(config));

    const help = document.createElement('p');
    help.className = 'a11y-line-chart__visually-hidden';
    help.id = `${this.instanceId}-keyboard-help`;
    help.textContent = this.#t('keyboardHelp');

    const overflowHelp = document.createElement('p');
    overflowHelp.className = 'a11y-line-chart__visually-hidden';
    overflowHelp.id = `${this.instanceId}-scroll-help`;
    overflowHelp.hidden = true;
    overflowHelp.textContent = this.#t('overflowHelp');

    const viewport = document.createElement('div');
    viewport.className = 'a11y-line-chart__viewport';
    const resizable = document.createElement('div');
    resizable.className = 'a11y-line-chart__resizable';
    const intrinsic = this.#intrinsicWidths(config);
    resizable.style.minWidth = `${intrinsic.min}px`;
    if (intrinsic.max !== undefined) resizable.style.maxWidth = `${intrinsic.max}px`;

    const chartGroup = document.createElement('div');
    chartGroup.className = 'a11y-line-chart__chart-group';
    chartGroup.setAttribute('role', 'group');
    chartGroup.setAttribute('aria-roledescription', this.#t('chartRole'));
    chartGroup.setAttribute('aria-labelledby', heading.id);

    let baselineDescription: HTMLParagraphElement | undefined;
    if (semanticModel.baseline) {
      baselineDescription = document.createElement('p');
      baselineDescription.className = 'a11y-line-chart__visually-hidden';
      baselineDescription.id = `${this.instanceId}-baseline-description`;
      baselineDescription.textContent = this.#t('baselineDescription', { series: config.baselineSeriesLabel, period: semanticModel.baseline.xLabel, value: semanticModel.baseline.formatted, message: config.showContext ? semanticModel.baseline.explanation : '' });
      chartGroup.setAttribute('aria-describedby', baselineDescription.id);
    }

    const chart = priorChartElement ?? document.createElement('div');
    chart.className = 'a11y-line-chart__chart';
    chart.id = `${this.instanceId}-chart`;
    chart.setAttribute('aria-hidden', 'true');

    const navigator = document.createElement('input');
    navigator.className = 'a11y-line-chart__navigator';
    navigator.dataset['focusKey'] = 'navigator';
    navigator.type = 'range';
    navigator.min = '0';
    navigator.max = String(this.#data.length - 1);
    navigator.step = '1';
    navigator.value = String(this.#focusedIndex);
    navigator.setAttribute('aria-describedby', help.id);
    this.#updateNavigatorLabel(navigator);
    const stepper = config.stepperVisibility === 'never'
      ? undefined
      : this.#createStepper(config, navigator, viewport, overflowHelp, chart.id);
    navigator.addEventListener('keydown', (event) => this.#onNavigatorKeydown(event, navigator, viewport, overflowHelp, stepper));
    navigator.addEventListener('input', () => this.#selectIndex(Number(navigator.value), navigator, viewport, overflowHelp, stepper));
    navigator.addEventListener('focus', () => this.#selectIndex(this.#focusedIndex, navigator, viewport, overflowHelp, stepper));
    navigator.addEventListener('blur', () => {
      this.#selectionRevealGeneration++;
      this.#chartAdapter?.hideTip();
    });

    chartGroup.append(chart, navigator);
    resizable.append(chartGroup);
    viewport.append(resizable);

    const tableRegion = this.#createTable(config, semanticModel);
    root.append(viewport);
    if (stepper) root.append(stepper.root);
    root.append(...(baselineDescription ? [baselineDescription] : []), help, overflowHelp);
    this.#appendDataView(root, config, semanticModel, tableRegion, dialogWasOpen, dialogFocusKey);
    this.#dialogReopenOnConnect = false;
    if (!dialogWasOpen && inlineHadFocus) {
      const matchingControl = activeRootKey && config.dataView === 'inline'
        ? Array.from(root.querySelectorAll<HTMLElement>('.a11y-line-chart__inline-data [data-focus-key]')).find((item) => item.dataset['focusKey'] === activeRootKey)
        : undefined;
      const focusTarget = config.dataView === 'none'
        ? root.querySelector<HTMLInputElement>('.a11y-line-chart__navigator')
        : config.dataView === 'inline'
          ? matchingControl ?? root.querySelector<HTMLElement>('.a11y-line-chart__inline-data > summary')
          : config.showActions ? root.querySelector<HTMLButtonElement>('[data-focus-key="data-action"]') : root.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');
      focusTarget?.focus();
    } else if (!dialogWasOpen && activeRootKey) {
      const replacement = Array.from(root.querySelectorAll<HTMLElement>('[data-focus-key]')).find((item) => item.dataset['focusKey'] === activeRootKey);
      const navigatorFallback = root.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');
      const eligibleReplacement = replacement && !(replacement instanceof HTMLButtonElement && replacement.disabled)
        && !replacement.hidden && !replacement.closest('[hidden], [inert]') ? replacement : undefined;
      const focusTarget = eligibleReplacement ?? navigatorFallback;
      focusTarget?.focus({ preventScroll: true });
      if (focusTarget && document.activeElement !== focusTarget) {
        navigatorFallback?.focus({ preventScroll: true });
        if (document.activeElement !== navigatorFallback) {
          root.tabIndex = -1;
          root.focus({ preventScroll: true });
        }
      }
    }
    const updateOverflowState = (): void => this.#updateOverflowState(
      viewport,
      overflowHelp,
      navigator,
      stepper,
      config,
      help.id
    );
    this.#mountChart(chart, viewport, config, semanticModel, updateOverflowState);
    this.#requestFrame(updateOverflowState);
    this.#dispatchReady();
    this.#dispatchDataChange();
    this.#announceDataUpdate(config);
    this.#rendered = true;
  }

  #dispatchDataChange(): void {
    if (this.#renderedSourceRevision === this.#sourceRevision) return;
    const result = validateBaseline(this.#baselineInput, this.#data);
    const signature = JSON.stringify({
      data: this.#sourceData.map((item) => ({ ...item, x: typedX(item.x) })),
      baseline: result.valid && result.baseline ? { ...result.baseline, x: typedX(result.baseline.x) } : null,
      invalid: Boolean(this.#dataValidationError)
    });
    const changed = this.#renderedSourceRevision >= 0 && signature !== this.#lastDataSourceSignature;
    this.#renderedSourceRevision = this.#sourceRevision;
    this.#lastDataSourceSignature = signature;
    if (!changed) return;
    this.#dataChangedSinceRender = true;
    this.dispatchEvent(new CustomEvent<A11yLineChartDataChangeDetail>('a11y-line-chart-data-change', {
      bubbles: true,
      detail: {
        data: this.data,
        model: this.#semanticModel ? structuredClone(this.#semanticModel) : null
      }
    }));
  }

  #setDataViewState(open: boolean, dataView: 'dialog' | 'inline'): void {
    if (this.#dataViewOpen === open && this.#activeDataView === dataView) return;
    this.#dataViewOpen = open; this.#activeDataView = dataView;
    this.dispatchEvent(new CustomEvent<A11yLineChartDataViewChangeDetail>('a11y-line-chart-data-view-change', {
      bubbles: true, detail: { open, dataView }
    }));
  }

  #announceDataUpdate(config: ResolvedA11yLineChartConfig): void {
    if (!this.#dataChangedSinceRender) return;
    const announcement = pluralLineMessage(this.#messages, 'dataUpdated', this.#data.length, config.locale, { count: this.#data.length });
    if (config.announceChanges) this.#announce(announcement);
    this.#dataChangedSinceRender = false;
  }

  #ensureLiveRegion(): HTMLDivElement {
    if (!this.#liveRegion) {
      const live = document.createElement('div');
      live.className = 'a11y-line-chart__visually-hidden';
      live.id = `${this.instanceId}-live`;
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      this.#liveRegion = live;
    }
    if (!this.#liveRegion.isConnected) this.append(this.#liveRegion);
    return this.#liveRegion;
  }

  #appendDataView(root: HTMLElement, config: ResolvedA11yLineChartConfig, model: A11yLineChartSemanticModel, tableRegion: HTMLElement, wasOpen: boolean, focusKey?: string): void {
    if (config.dataView === 'none') {
      // Closing reports the view that was open; the active view itself is kept for the next visible render.
      this.#modalController?.close(false);
      if (this.#dataViewOpen) this.#setDataViewState(false, this.#activeDataView);
      this.#inlineOpen = false;
      this.#dataDialog?.querySelector('.a11y-line-chart__table-region')?.remove();
      if (wasOpen) root.querySelector<HTMLInputElement>('.a11y-line-chart__navigator')?.focus();
      return;
    }
    if (this.#activeDataView !== config.dataView && this.#dataViewOpen) this.#setDataViewState(false, this.#activeDataView);
    this.#activeDataView = config.dataView;
    if (config.dataView === 'inline') {
      this.#modalController?.close(false);
      this.#dataDialog?.querySelector('.a11y-line-chart__table-region')?.remove();
      tableRegion.classList.add('a11y-line-chart__table-region--visually-hidden');
      root.append(tableRegion);
      const details = document.createElement('details');
      details.className = 'a11y-line-chart__inline-data';
      details.open = wasOpen || this.#inlineOpen;
      // Keep a screen-reader table available while the disclosure is closed,
      // but expose only the visible table once the disclosure is expanded.
      if (details.open) tableRegion.setAttribute('aria-hidden', 'true');
      else tableRegion.removeAttribute('aria-hidden');
      const summary = document.createElement('summary'); summary.textContent = this.#t('inlineData');
      summary.dataset['focusKey'] = 'inline-summary';
      details.append(summary, this.#createTable(config, model, 'inline')); root.append(details);
      if (details.open && !this.#dataViewOpen) this.#setDataViewState(true, 'inline');
      details.addEventListener('toggle', () => {
        this.#inlineOpen = details.open;
        if (details.open) tableRegion.setAttribute('aria-hidden', 'true');
        else tableRegion.removeAttribute('aria-hidden');
        this.#setDataViewState(details.open, 'inline');
      });
      if (wasOpen) summary.focus();
      return;
    }

    root.append(tableRegion);
    let dialog = this.#dataDialog;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'a11y-line-chart__data-dialog';
      this.#dataDialog = dialog;
      this.#modalController = new ModalController({
        dialog,
        host: this,
        getOpener: () => this.querySelector<HTMLElement>('[data-focus-key="data-action"]') ?? this.querySelector<HTMLElement>('.a11y-line-chart__navigator') ?? undefined,
        onStateChange: (open) => this.#setDataViewState(open, 'dialog')
      });
      const heading = document.createElement(`h${this.#headingLevel()}`);
      heading.id = `${this.instanceId}-dialog-title`;
      heading.textContent = this.#t('dataHeading');
      const close = document.createElement('button');
      close.type = 'button'; close.textContent = this.#t('closeData'); close.className = 'a11y-line-chart__dialog-close'; close.dataset['focusKey'] = 'close';
      close.addEventListener('click', () => this.#modalController?.close());
      dialog.append(heading, close);
    }
    const headingId = `${this.instanceId}-dialog-title`;
    dialog.setAttribute('aria-labelledby', headingId);
    const heading = dialog.querySelector<HTMLElement>(`#${headingId}`);
    if (heading) heading.textContent = this.#t('dataHeading');
    const closeButton = dialog.querySelector<HTMLButtonElement>('[data-focus-key="close"]');
    if (closeButton) closeButton.textContent = this.#t('closeData');
    const modalTable = this.#createTable(config, model, 'dialog');
    const oldTable = dialog.querySelector('.a11y-line-chart__table-region');
    if (oldTable) oldTable.replaceWith(modalTable);
    else {
      dialog.querySelectorAll('.a11y-line-chart__message').forEach((item) => item.remove());
      dialog.append(modalTable);
    }
    if (!dialog.isConnected) this.append(dialog);
    if (wasOpen && (!dialog.open || this.#dialogReopenOnConnect)) {
      const focusTarget = focusKey ? dialog.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`) : dialog.querySelector<HTMLButtonElement>('[data-focus-key="close"]');
      const result = this.#modalController?.reconnect(focusTarget ?? undefined) ?? 'not-requested';
      if (result === 'not-requested') this.#modalController?.open(focusTarget ?? undefined);
      this.#dialogReopenOnConnect = false;
    }
    if (wasOpen && !dialog.contains(document.activeElement)) {
      const focusTarget = focusKey ? dialog.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`) : null;
      (focusTarget ?? dialog.querySelector<HTMLButtonElement>('[data-focus-key="close"]'))?.focus();
    }
  }

  #unavailableViewClosesDialog(config: ResolvedA11yLineChartConfig): boolean {
    return config.dataView === 'none' || config.dataView === 'inline';
  }

  #focusDataOpener(): void {
    const target = this.querySelector<HTMLElement>('[data-focus-key="data-action"]')
      ?? this.querySelector<HTMLElement>('.a11y-line-chart__inline-data > summary')
      ?? this.querySelector<HTMLElement>('.a11y-line-chart__navigator')
      ?? this.#ownedRoot;
    if (target === this.#ownedRoot) target?.setAttribute('tabindex', '-1');
    target?.focus({ preventScroll: true });
  }

  #discardDataDialogForUnavailableView(config: ResolvedA11yLineChartConfig): void {
    if (!this.#unavailableViewClosesDialog(config)) return;
    this.#modalController?.close(false);
    if (config.dataView === 'none') this.#dataDialog?.querySelector('.a11y-line-chart__table-region')?.remove();
  }

  #updateOpenDialogStatus(message: string): void {
    const dialog = this.#dataDialog;
    if (!dialog) return;
    const currentTable = dialog.querySelector('.a11y-line-chart__table-region');
    const status = document.createElement('p');
    status.className = 'a11y-line-chart__message a11y-line-chart__message--error';
    status.setAttribute('role', 'alert');
    status.textContent = message;
    if (currentTable) currentTable.replaceWith(status);
    else {
      dialog.querySelectorAll('.a11y-line-chart__message').forEach((item) => item.remove());
      dialog.append(status);
    }
  }

  #createStepper(
    config: ResolvedA11yLineChartConfig,
    navigator: HTMLInputElement,
    viewport: HTMLElement,
    overflowHelp: HTMLElement,
    chartId: string
  ): StepperElements {
    const root = document.createElement('div');
    root.className = 'a11y-line-chart__stepper';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', this.#t('navigationLabel'));
    root.hidden = config.stepperVisibility === 'auto';

    const previous = document.createElement('button');
    previous.className = 'a11y-line-chart__stepper-button a11y-line-chart__stepper-button--previous';
    previous.type = 'button';
    previous.textContent = this.#t('previous');
    previous.setAttribute('aria-controls', chartId);
    previous.dataset['stepperDirection'] = 'previous';
    previous.dataset['focusKey'] = 'stepper-previous';

    const status = document.createElement('span');
    status.className = 'a11y-line-chart__stepper-status';
    status.setAttribute('aria-current', 'true');

    const next = document.createElement('button');
    next.className = 'a11y-line-chart__stepper-button a11y-line-chart__stepper-button--next';
    next.type = 'button';
    next.textContent = this.#t('next');
    next.setAttribute('aria-controls', chartId);
    next.dataset['stepperDirection'] = 'next';
    next.dataset['focusKey'] = 'stepper-next';

    const stepper = { next, previous, root, status };
    const cancelPendingReveal = (): void => {
      this.#selectionRevealGeneration++;
      this.#chartAdapter?.hideTip();
    };
    previous.addEventListener('blur', cancelPendingReveal);
    next.addEventListener('blur', cancelPendingReveal);
    previous.addEventListener('click', () => {
      this.#selectIndex(
        this.#adjacentIndex(-1, config),
        navigator,
        viewport,
        overflowHelp,
        stepper
      );
    });
    next.addEventListener('click', () => {
      this.#selectIndex(
        this.#adjacentIndex(1, config),
        navigator,
        viewport,
        overflowHelp,
        stepper
      );
    });
    root.append(previous, status, next);
    this.#updateStepper(stepper, config);
    return stepper;
  }

  #adjacentIndex(direction: -1 | 1, config: ResolvedA11yLineChartConfig): number {
    if (this.#data.length < 2) return this.#focusedIndex;
    const requested = this.#focusedIndex + direction;
    if (requested < 0) return config.wrapAround ? this.#data.length - 1 : 0;
    if (requested >= this.#data.length) return config.wrapAround ? 0 : this.#data.length - 1;
    return requested;
  }

  #updateStepper(stepper: StepperElements | undefined, config: ResolvedA11yLineChartConfig): void {
    if (!stepper) return;
    const points = this.#semanticModel?.points ?? [];
    const current = points[this.#focusedIndex];
    if (!current) return;
    const hasMultiplePoints = points.length > 1;
    const previousIndex = this.#adjacentIndex(-1, config);
    const nextIndex = this.#adjacentIndex(1, config);
    const previousPoint = points[previousIndex];
    const nextPoint = points[nextIndex];

    stepper.status.textContent = this.#t('stepperStatus', { period: current.xLabel, position: current.position, total: current.total });
    stepper.previous.disabled = !hasMultiplePoints || (!config.wrapAround && this.#focusedIndex === 0);
    stepper.next.disabled = !hasMultiplePoints || (!config.wrapAround && this.#focusedIndex === points.length - 1);
    stepper.previous.setAttribute(
      'aria-label',
      stepper.previous.disabled || !previousPoint
      ? this.#t('previousPeriod')
        : this.#t('previousPeriodAt', { period: previousPoint.xLabel })
    );
    stepper.next.setAttribute(
      'aria-label',
      stepper.next.disabled || !nextPoint
      ? this.#t('nextPeriod')
        : this.#t('nextPeriodAt', { period: nextPoint.xLabel })
    );
  }

  #updateOverflowState(
    viewport: HTMLElement,
    overflowHelp: HTMLElement,
    navigator: HTMLInputElement,
    stepper: StepperElements | undefined,
    config: ResolvedA11yLineChartConfig,
    keyboardHelpId: string
  ): void {
    const overflowing = viewport.scrollWidth > viewport.clientWidth + 2;
    overflowHelp.hidden = !overflowing;
    navigator.setAttribute('aria-describedby', [
      keyboardHelpId,
      overflowing ? overflowHelp.id : ''
    ].filter(Boolean).join(' '));
    if (stepper) {
      stepper.root.hidden = config.stepperVisibility === 'auto' && !overflowing;
    }
  }

  #createSummary(
    model: A11yLineChartSemanticModel,
    config: ResolvedA11yLineChartConfig
  ): HTMLElement {
    const region = document.createElement('div');
    region.className = 'a11y-line-chart__summary';
    region.setAttribute('role', 'group');
    region.setAttribute('aria-label', this.#t('summaryLabel'));

    const narrative = document.createElement('p');
    narrative.className = 'a11y-line-chart__summary-narrative';
    const primary = document.createElement('strong');
    primary.className = 'a11y-line-chart__summary-outcome';
    primary.textContent = model.summary.primary;
    narrative.append(primary);
    if (model.summary.supporting.length) {
      narrative.append(document.createTextNode(` ${model.summary.supporting.join(' ')}`));
    }
    region.append(narrative);
    region.append(...this.#createAuthoredContext(model, config));
    return region;
  }

  #createAuthoredContext(model: A11yLineChartSemanticModel, config: ResolvedA11yLineChartConfig): HTMLElement[] {
    const content: HTMLElement[] = [];
    if (config.showContext && model.baseline?.explanation) {
      const baselineContext = document.createElement('p');
      baselineContext.className = 'a11y-line-chart__summary-context';
      baselineContext.textContent = this.#t('baselineContext', { series: config.baselineSeriesLabel, message: model.baseline.explanation });
      content.push(baselineContext);
    }
    const context = this.#authoredContext(config);
    if (config.showContext && context) content.push(this.#richBlock(context, 'a11y-line-chart__summary-context'));
    return content;
  }

  #authoredContext(config: ResolvedA11yLineChartConfig): string {
    if (this.#context !== undefined) return this.#context;
    const plainText = document.createElement('span');
    plainText.textContent = config.contextNote;
    return plainText.innerHTML;
  }

  #richBlock(value: string, className: string): HTMLElement {
    const block = document.createElement('div'); block.className = className;
    block.append(renderLineRichContent(value)); return block;
  }

  #createActionStrip(config: ResolvedA11yLineChartConfig, model: A11yLineChartSemanticModel): HTMLElement {
    const strip = document.createElement('div'); strip.className = 'a11y-line-chart__actions';
    if (config.initialZoomY || shouldSuggestYAxisZoom(config, model)) {
      const zoom = document.createElement('button');
      zoom.type = 'button';
      zoom.className = 'a11y-line-chart__zoom-action';
      zoom.dataset['focusKey'] = 'y-axis-zoom-action';
      zoom.textContent = this.#t(config.initialZoomY ? 'restoreYAxis' : 'zoomYAxis');
      zoom.setAttribute('aria-pressed', String(config.initialZoomY));
      zoom.addEventListener('click', () => {
        this.#changeControl('initialZoomY', !this.#resolvedConfig().initialZoomY, this.#t('zoomYAxis'), zoom);
      });
      strip.append(zoom);
    }
    if (config.dataView === 'dialog') {
      const data = document.createElement('button'); data.type = 'button'; data.className = 'a11y-line-chart__data-action'; data.textContent = this.#t('dataAction');
      data.dataset['focusKey'] = 'data-action';
      data.addEventListener('click', () => {
        this.#modalController?.open(this.#dataDialog?.querySelector<HTMLButtonElement>('[data-focus-key="close"]') ?? undefined);
      }); strip.append(data);
    }
    if (config.showExplanation) strip.append(this.#disclosureAction('explanation'));
    if (config.showGlossary && this.#definitions.length) strip.append(this.#disclosureAction('glossary'));
    return strip;
  }

  #disclosureAction(name: 'explanation' | 'glossary'): HTMLButtonElement {
    const labelFor = (expanded: boolean): string => this.#t(name === 'explanation'
      ? (expanded ? 'hideExplanation' : 'explain')
      : (expanded ? 'hideGlossary' : 'glossary'));
    const initialExpanded = name === 'explanation' ? this.#explanationOpen : this.#glossaryOpen;
    const button = document.createElement('button'); button.type = 'button'; button.textContent = labelFor(initialExpanded);
    button.dataset['focusKey'] = `${name}-action`; button.setAttribute('aria-controls', `${this.instanceId}-${name}`);
    const initialContent = this.querySelector<HTMLElement>(`#${this.instanceId}-${name}`);
    if (initialContent) setDisclosure(button, initialContent, initialExpanded);
    else button.setAttribute('aria-expanded', String(initialExpanded));
    button.addEventListener('click', () => {
      const content = this.querySelector<HTMLElement>(`#${this.instanceId}-${name}`);
      const expanded = content ? toggleDisclosure(button, content) : button.getAttribute('aria-expanded') !== 'true';
      if (name === 'explanation') this.#explanationOpen = expanded; else this.#glossaryOpen = expanded;
      button.textContent = labelFor(expanded);
      if (content) content.hidden = !expanded;
      else button.setAttribute('aria-expanded', String(expanded));
      this.dispatchEvent(new CustomEvent<A11yLineChartDisclosureChangeDetail>('a11y-line-chart-disclosure-change', { bubbles: true, detail: { disclosure: name, expanded } }));
    });
    return button;
  }

  #downloadCsv(config: ResolvedA11yLineChartConfig, model: A11yLineChartSemanticModel): void {
    const context = this.#authoredContext(config);
    const csv = buildLineCsv({
      data: this.#data, model,
      headers: [config.xAxisTitle, config.actualSeriesLabel, config.targetSeriesLabel, this.#t('targetOutcome'), ...(model.baseline ? [this.#t('changeFrom', { series: config.baselineSeriesLabel })] : [])],
      formatPeriod: (value) => this.#formatXValue(value), formatValue: (value, series, x) => this.#formatSeriesValue(value, series === 'baseline' ? 'actual' : series, x),
      missing: this.#t('missing'), suppressed: this.#t('suppressed'),
      ...(context ? { context } : {}),
      ...(this.#dataNote ? { dataNote: this.#dataNote } : {}), contextLabel: this.#t('contextLabel'), dataNoteLabel: this.#t('dataNoteLabel'), rangeSeparator: this.#t('rangeSeparator'), unavailableOutcome: this.#t('outcomeUnavailable')
    });
    const blob = new Blob([CSV_BYTE_ORDER_MARK + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url;
    const filename = (this.chartTitle || 'chart-data').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chart-data';
    link.download = `${filename}.csv`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  #createExplanation(config: ResolvedA11yLineChartConfig, model: A11yLineChartSemanticModel, hasAction: boolean): HTMLElement {
    const details = document.createElement(hasAction ? 'section' : 'details'); details.className = 'a11y-line-chart__explanation'; details.id = `${this.instanceId}-explanation`;
    if (hasAction) (details as HTMLElement).hidden = !this.#explanationOpen;
    else (details as HTMLDetailsElement).open = this.#explanationOpen;
    const heading = document.createElement('h3'); heading.className = 'a11y-line-chart__visually-hidden'; heading.textContent = this.#t('explanationHeading'); details.append(heading);
    if (!hasAction) { const summary = document.createElement('summary'); summary.textContent = this.#t('explain'); details.append(summary); }
    const main = document.createElement('p'); main.textContent = model.summary.text; details.append(main);
    const context = this.#authoredContext(config);
    if (config.showContext && context) details.append(this.#richBlock(context, 'a11y-line-chart__explanation-context'));
    const list = document.createElement('ol'); list.setAttribute('aria-label', this.#t('periodExplanations'));
    for (const point of model.points) { const li = document.createElement('li'); li.textContent = point.narrative; list.append(li); }
    details.append(list);
    if (!hasAction) details.addEventListener('toggle', () => {
      const expanded = (details as HTMLDetailsElement).open;
      if (this.#explanationOpen === expanded) return;
      this.#explanationOpen = expanded;
      this.dispatchEvent(new CustomEvent<A11yLineChartDisclosureChangeDetail>('a11y-line-chart-disclosure-change', { bubbles: true, detail: { disclosure: 'explanation', expanded } }));
    });
    return details;
  }

  #createGlossary(config: ResolvedA11yLineChartConfig, hasAction: boolean): HTMLElement {
    const details = document.createElement(hasAction ? 'section' : 'details'); details.className = 'a11y-line-chart__glossary'; details.id = `${this.instanceId}-glossary`;
    if (hasAction) (details as HTMLElement).hidden = !this.#glossaryOpen;
    else (details as HTMLDetailsElement).open = this.#glossaryOpen;
    const heading = document.createElement('h3'); heading.className = 'a11y-line-chart__visually-hidden'; heading.textContent = this.#t('glossaryHeading'); details.append(heading);
    if (!hasAction) { const summary = document.createElement('summary'); summary.textContent = this.#t('glossary'); details.append(summary); }
    const list = document.createElement('dl');
    for (const [index, definition] of this.#definitions.entries()) {
      const term = document.createElement('dt'); term.id = `${this.instanceId}-definition-${index}`; term.textContent = definition.label;
      const description = document.createElement('dd'); description.append(renderLineRichContent(definition.definition)); list.append(term, description);
    }
    details.append(list);
    if (!hasAction) details.addEventListener('toggle', () => {
      const expanded = (details as HTMLDetailsElement).open;
      if (this.#glossaryOpen === expanded) return;
      this.#glossaryOpen = expanded;
      this.dispatchEvent(new CustomEvent<A11yLineChartDisclosureChangeDetail>('a11y-line-chart-disclosure-change', { bubbles: true, detail: { disclosure: 'glossary', expanded } }));
    });
    return details;
  }

  #createControls(config: ResolvedA11yLineChartConfig): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'a11y-line-chart__controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', this.#t('controlsLabel'));
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = this.#t('valuesLegend');
    fieldset.append(legend);

    const lineChoices: Array<[keyof A11yLineChartConfig, string]> = [
      ['showActualLine', this.#t('actualLine', { series: config.actualSeriesLabel })], ['showTargetLine', this.#t('targetLine', { series: config.targetSeriesLabel })],
      ['showActualValues', this.#t('actualValue', { series: config.actualSeriesLabel })], ['showTargetValues', this.#t('targetValueLabel', { series: config.targetSeriesLabel })],
      ['fillActual', this.#t('actualFill', { series: config.actualSeriesLabel })], ['fillTarget', this.#t('targetFill', { series: config.targetSeriesLabel })]
    ];
    const displayChoices: Array<[keyof A11yLineChartConfig, string]> = [
      ['showTooltipVisual', this.#t('tooltipVisible')], ['showXAxisTitle', this.#t('xAxisTitle')],
      ['showYAxisTitle', this.#t('yAxisTitle')], ['initialZoomY', this.#t('zoomYAxis')]
    ];
    const appendChoices = (choices: Array<[keyof A11yLineChartConfig, string]>): void => {
      for (const [key, labelText] of choices) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(config[key]);
        input.dataset['control'] = String(key);
        input.dataset['focusKey'] = `control-${String(key)}`;
        input.addEventListener('change', () => this.#changeControl(key, input.checked, labelText, input));
        label.append(input, document.createTextNode(` ${labelText}`));
        fieldset.append(label);
      }
    };
    appendChoices(lineChoices);

    const patterns = document.createElement('div');
    patterns.className = 'a11y-line-chart__pattern-selects';
    patterns.append(
      this.#createPatternSelect('actualPattern', config.actualSeriesLabel, config.actualPattern),
      this.#createPatternSelect('targetPattern', config.targetSeriesLabel, config.targetPattern)
    );
    fieldset.append(patterns);
    appendChoices(displayChoices);
    controls.append(fieldset);
    return controls;
  }

  #createPatternSelect(key: 'actualPattern' | 'targetPattern', series: string, selected: A11yLineChartPattern): HTMLLabelElement {
    const label = document.createElement('label');
    label.append(document.createTextNode(this.#t('patternType', { series })));
    const select = document.createElement('select');
    select.dataset['control'] = key;
    select.dataset['focusKey'] = `control-${key}`;
    const options: ReadonlyArray<readonly [A11yLineChartPattern, keyof typeof ENGLISH_LINE_CHART_MESSAGES]> = [['none', 'patternNone'], ['diagonal', 'patternDiagonal'], ['dots', 'patternDots'], ['horizontal', 'patternHorizontal']];
    for (const [value, name] of options) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = this.#t(name);
      option.selected = value === selected;
      select.append(option);
    }
    select.addEventListener('change', () => this.#changeControl(key, select.value as A11yLineChartPattern, '', select));
    label.append(select);
    return label;
  }

  /** The only dispatch path for reader-driven settings; host-driven updates never reach this. */
  #dispatchSettingsChange(setting: keyof A11yLineChartConfig, value: A11yLineChartConfig[keyof A11yLineChartConfig], source: 'controls' | 'legend'): void {
    const detail: A11yLineChartSettingsChangeDetail = { setting, value, source };
    this.dispatchEvent(new CustomEvent<A11yLineChartSettingsChangeDetail>('a11y-line-chart-settings-change', { bubbles: true, detail }));
  }

  #changeControl(key: keyof A11yLineChartConfig, value: A11yLineChartConfig[keyof A11yLineChartConfig], label: string, source: HTMLElement): void {
    const previous = this.#resolvedConfig()[key];
    this.#config = { ...this.#config, [key]: value };
    const resolved = this.#resolvedConfig();
    if (key === 'showActualLine' || key === 'showTargetLine') {
      const seriesLabel = key === 'showActualLine' ? resolved.actualSeriesLabel : resolved.targetSeriesLabel;
      this.#legendSelection = { ...this.#legendSelection, [seriesLabel]: Boolean(value) };
    }
    const message = key === 'actualPattern' || key === 'targetPattern'
      ? this.#t('patternSet', { series: key === 'actualPattern' ? this.#resolvedConfig().actualSeriesLabel : this.#resolvedConfig().targetSeriesLabel, value: this.#t(`pattern${String(value).charAt(0).toUpperCase()}${String(value).slice(1)}` as keyof typeof ENGLISH_LINE_CHART_MESSAGES) })
      : this.#t(value ? 'enabled' : 'disabled', { label });
    if (resolved[key] !== previous) this.#dispatchSettingsChange(key, value, 'controls');
    const controlName = source.dataset['control'];
    if (key === 'initialZoomY') this.#render();
    else if (this.#chartUpdate) this.#chartUpdate();
    else this.#render();
    const generation = this.#lifecycleGeneration;
    queueMicrotask(() => {
      if (generation !== this.#lifecycleGeneration || !this.isConnected) return;
      if (resolved.announceChanges) this.#announce(message);
      this.querySelector<HTMLElement>(`[data-control="${controlName}"]`)?.focus();
    });
  }

  #createTable(
    config: ResolvedA11yLineChartConfig,
    model: A11yLineChartSemanticModel,
    suffix = ''
  ): HTMLElement {
    const region = document.createElement('div');
    region.className = 'a11y-line-chart__table-region';
    const contentContext = this.#authoredContext(config);
    const explicitView = suffix === 'dialog' || suffix === 'inline';
    if (explicitView && config.showContext && contentContext) region.append(this.#richBlock(contentContext, 'a11y-line-chart__data-context'));
    if (explicitView && this.#dataNote) region.append(this.#richBlock(this.#dataNote, 'a11y-line-chart__data-note'));
    if (explicitView && config.showExport && config.dataView !== 'none') {
      const exportButton = document.createElement('button'); exportButton.type = 'button'; exportButton.textContent = this.#t('exportCsv');
      exportButton.className = 'a11y-line-chart__export'; exportButton.dataset['focusKey'] = 'csv-export';
      exportButton.addEventListener('click', () => this.#downloadCsv(config, model)); region.append(exportButton);
    }
    if (!explicitView) region.classList.add('a11y-line-chart__table-region--visually-hidden');
    const table = document.createElement('table');
    table.className = 'a11y-line-chart__table';
    table.id = `${this.instanceId}-data${suffix ? `-${suffix}` : ''}`;
    const caption = document.createElement('caption');
    const unit = this.#t(config.valuePreset === 'percent' ? 'unitPercentages' : 'unitValues');
    caption.textContent = model.baseline
      ? this.#t('dataCaptionBaseline', { actual: config.actualSeriesLabel.toLocaleLowerCase(config.locale), target: config.targetSeriesLabel.toLocaleLowerCase(config.locale), unit, baseline: config.baselineSeriesLabel, period: model.baseline.xLabel, value: model.baseline.formatted })
      : this.#t('dataCaption', { actual: config.actualSeriesLabel.toLocaleLowerCase(config.locale), target: config.targetSeriesLabel.toLocaleLowerCase(config.locale), unit });
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const valueSuffix = config.valuePreset === 'percent' ? this.#t('percentSuffix') : '';
    const labels = [
      config.xAxisTitle,
      this.#t('tableActualHeader', { series: config.actualSeriesLabel, suffix: valueSuffix }),
      this.#t('tableTargetHeader', { series: config.targetSeriesLabel, suffix: valueSuffix }),
      this.#t('targetOutcome'),
      ...(model.baseline ? [this.#t('changeFrom', { series: config.baselineSeriesLabel.toLocaleLowerCase(config.locale) })] : [])
    ];
    for (const label of labels) {
      const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; headerRow.append(cell);
    }
    head.append(headerRow);
    const body = document.createElement('tbody');
    for (const [index, item] of this.#data.entries()) {
      const interpretation = model.points[index]!;
      const row = document.createElement('tr');
      const x = document.createElement('th'); x.scope = 'row'; x.textContent = this.#formatXValue(item.x);
      const actual = document.createElement('td'); actual.textContent = interpretation.actualFormatted;
      const target = document.createElement('td'); target.textContent = interpretation.targetFormatted;
      const outcome = document.createElement('td'); outcome.textContent = interpretation.outcomeLabel;
      row.append(x, actual, target, outcome);
      if (model.baseline) {
        const baselineDifference = document.createElement('td');
        baselineDifference.textContent = interpretation.baseline?.difference?.description ?? config.describeMissingAs;
        row.append(baselineDifference);
      }
      body.append(row);
    }
    table.append(caption, head, body);
    if (this.#suppressed) {
      const note = document.createElement('p'); note.className = 'a11y-line-chart__suppression-note';
      note.textContent = this.#t('suppressionNote'); region.append(note);
    }
    region.append(table); return region;
  }

  #intrinsicWidths(config: ResolvedA11yLineChartConfig): { min: number; max?: number } {
    let minPerPoint = config.perPointMinWidth;
    let maxPerPoint = config.perPointMaxWidth;
    const style = typeof getComputedStyle === 'function' ? getComputedStyle(this) : undefined;
    const cssMin = Number.parseFloat(style?.getPropertyValue('--a11y-line-chart-per-point-min-width') || '');
    const cssMax = Number.parseFloat(style?.getPropertyValue('--a11y-line-chart-per-point-max-width') || '');
    if (!config.autoPerPointMinWidth && Number.isFinite(cssMin) && config.perPointMinWidth === 70) minPerPoint = cssMin;
    if (!config.autoPerPointMaxWidth && Number.isFinite(cssMax) && config.perPointMaxWidth === 110) maxPerPoint = cssMax;
    if (config.autoPerPointMinWidth || config.autoPerPointMaxWidth) {
      const points = this.#semanticModel?.points ?? [];
      const longest = this.#data.reduce((length, item, index) => Math.max(length, (points[index]?.actualFormatted ?? '').length, formatTarget(item.target, (value) => this.#formatSeriesValue(value, 'target', item.x)).length), 0);
      const base = 58 + (config.showActualValues || config.showTargetValues ? longest * 6 : 0);
      if (config.autoPerPointMinWidth) minPerPoint = Math.round(base);
      if (config.autoPerPointMaxWidth) maxPerPoint = Math.max(minPerPoint + 20, Math.round(base * 1.4));
    }
    const min = config.dynamicMinWidth ? Math.max(320, this.#data.length * minPerPoint) : config.minWidth;
    const max = config.dynamicMaxWidth ? Math.max(min, this.#data.length * maxPerPoint) : config.maxWidth;
    return max === undefined ? { min } : { min, max };
  }

  #onNavigatorKeydown(
    event: KeyboardEvent,
    navigator: HTMLInputElement,
    viewport: HTMLElement,
    overflowHelp: HTMLElement,
    stepper?: StepperElements
  ): void {
    if (event.key === 'Escape') {
      this.#selectionRevealGeneration++;
      // ECharts' hover card is informative but not interactive. Let keyboard
      // users dismiss it without moving the one-tab-stop chart navigator.
      this.#chartAdapter?.hideTip();
      event.preventDefault();
      return;
    }
    let index = this.#focusedIndex;
    if (event.key === 'ArrowRight') index = index === this.#data.length - 1 ? (this.#resolvedConfig().wrapAround ? 0 : index) : index + 1;
    else if (event.key === 'ArrowLeft') index = index === 0 ? (this.#resolvedConfig().wrapAround ? this.#data.length - 1 : 0) : index - 1;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = this.#data.length - 1;
    else return;
    event.preventDefault();
    navigator.value = String(index);
    this.#selectIndex(index, navigator, viewport, overflowHelp, stepper);
  }

  #selectIndex(
    index: number,
    navigator: HTMLInputElement,
    viewport: HTMLElement,
    overflowHelp: HTMLElement,
    stepper?: StepperElements
  ): void {
    const revealGeneration = ++this.#selectionRevealGeneration;
    this.#focusedIndex = Math.max(0, Math.min(this.#data.length - 1, index));
    this.#rememberFocusedPeriod();
    navigator.value = String(this.#focusedIndex);
    this.#updateNavigatorLabel(navigator);
    this.#updateStepper(stepper, this.#resolvedConfig());
    const datum = this.#data[this.#focusedIndex];
    if (!datum) return;
    const point = this.#semanticModel?.points[this.#focusedIndex];
    const actualMissing = point ? point.actualValue === null : datum.actual == null;
    const preferred = (!this.#resolvedConfig().showActualLine || actualMissing) && this.#resolvedConfig().showTargetLine && datum.target != null ? 'target-main' : 'actual-main';
    const selectedIndex = this.#focusedIndex;
    const revealSelectedTip = (): void => {
      if (revealGeneration === this.#selectionRevealGeneration && this.#focusedIndex === selectedIndex && navigator.isConnected && viewport.isConnected) {
        this.#chartAdapter?.showTip(selectedIndex, preferred);
      }
    };
    const announcement = this.#buildAnnouncement(this.#focusedIndex);
    // Keep the complete narrative in a live region as a compatibility path:
    // browser accessibility APIs do not consistently expose aria-valuetext
    // for native range inputs. The navigator remains the single focus stop.
    this.#announce(announcement, true);
    const interpretation = this.#semanticModel?.points[this.#focusedIndex];
    if (!interpretation) return;
    const toAuthorScale = this.#usesFractionScale(this.#resolvedConfig()) ? wholePercentToFraction : (value: number): number => value;
    this.dispatchEvent(new CustomEvent<A11yLineChartPointChangeDetail>('a11y-line-chart-point-change', {
      bubbles: true,
      detail: {
        actual: scaleSeriesValue(interpretation.actualValue, toAuthorScale),
        actualSuppressed: interpretation.actualSuppressed,
        announcement,
        baselineDifference: interpretation.baseline?.difference ? { ...interpretation.baseline.difference } : null,
        index: this.#focusedIndex,
        outcome: interpretation.outcome,
        outcomeLabel: interpretation.outcomeLabel,
        target: scaleTarget(copyTarget(interpretation.targetValue), toAuthorScale),
        targetDifference: interpretation.targetDifference ? { ...interpretation.targetDifference } : null,
        x: datum.x instanceof Date ? new Date(datum.x.getTime()) : datum.x
      }
    }));
    const pixel = this.#chartAdapter?.convertXToPixel(this.#formatXValue(datum.x));
    if (pixel !== undefined && !overflowHelp.hidden) {
      const targetLeft = Math.max(
        0,
        Math.min(viewport.scrollWidth - viewport.clientWidth, pixel - viewport.clientWidth / 2)
      );
      if (Math.abs(viewport.scrollLeft - targetLeft) > 1) {
        this.#chartAdapter?.hideTip();
        viewport.scrollTo({
          left: targetLeft,
          behavior: this.#reducedMotion(this.#resolvedConfig()) ? 'auto' : 'smooth'
        });
        let frameCount = 0;
        let stableFrameCount = 0;
        let previousScrollLeft = viewport.scrollLeft;
        const revealWhenSettled = (): void => {
          if (revealGeneration !== this.#selectionRevealGeneration || this.#focusedIndex !== selectedIndex || !navigator.isConnected || !viewport.isConnected) return;
          frameCount += 1;
          const currentScrollLeft = viewport.scrollLeft;
          stableFrameCount = Math.abs(currentScrollLeft - previousScrollLeft) < 0.5
            ? stableFrameCount + 1
            : 0;
          previousScrollLeft = currentScrollLeft;
          if (Math.abs(currentScrollLeft - targetLeft) <= 1 || (frameCount > 4 && stableFrameCount >= 3)) {
            revealSelectedTip();
            return;
          }
          this.#requestFrame(revealWhenSettled);
        };
        this.#requestFrame(revealWhenSettled);
      } else {
        revealSelectedTip();
      }
    } else {
      revealSelectedTip();
    }
  }

  #updateNavigatorLabel(navigator: HTMLInputElement): void {
    const point = this.#semanticModel?.points[this.#focusedIndex];
    navigator.setAttribute('aria-label', this.#t('navigationLabel'));
    if (point) navigator.setAttribute('aria-valuetext', point.narrative);
  }

  #buildAnnouncement(index: number): string {
    return this.#semanticModel?.points[index]?.narrative ?? '';
  }

  #announce(message: string, navigation = false): void {
    const config = this.#resolvedConfig();
    const live = this.#liveRegion;
    if (!live) return;
    if (navigation || config.announceChanges) live.textContent = message;
    if (this.#liveClearTimer) clearTimeout(this.#liveClearTimer);
    this.#liveClearTimer = setTimeout(() => { if (live.isConnected) live.textContent = ''; }, 2500);
  }

  #disposeChart(disposeAdapter = true): void {
    for (const frame of this.#pendingFrames) cancelAnimationFrame(frame);
    this.#pendingFrames.clear();
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
    this.#legendCleanup?.();
    this.#legendCleanup = undefined;
    window.removeEventListener('resize', this.#windowResizeListener);
    this.#chartUpdate = undefined;
    if (disposeAdapter) {
      this.#chartAdapter?.dispose();
      this.#chartAdapter = undefined;
    }
  }

  #reducedMotion(config: ResolvedA11yLineChartConfig): boolean {
    return config.reducedMotion === 'always' || (config.reducedMotion === 'auto' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true);
  }

  #mountChart(
    container: HTMLElement,
    viewport: HTMLElement,
    config: ResolvedA11yLineChartConfig,
    model: A11yLineChartSemanticModel,
    onViewportResize: () => void
  ): void {
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      if (typeof ResizeObserver === 'function') {
        this.#resizeObserver = new ResizeObserver(() => {
          if (container.clientWidth > 0 && container.clientHeight > 0 && this.isConnected) {
            this.#requestFrame(() => this.#render());
          }
        });
        this.#resizeObserver.observe(container);
      } else {
        this.#windowResizeListener = (): void => {
          if (container.clientWidth > 0 && container.clientHeight > 0 && this.isConnected) this.#render();
        };
        window.addEventListener('resize', this.#windowResizeListener, { passive: true });
      }
      return;
    }
    const updateTooltipWidth = (): void => {
      container.style.setProperty(
        '--a11y-line-chart-tooltip-max-width',
        `${Math.max(0, viewport.clientWidth - 16)}px`
      );
    };
    updateTooltipWidth();
    if (!this.#chartAdapter) this.#chartAdapter = new EchartsAdapter(container);
    this.#chartUpdate = (): void => {
      const currentConfig = this.#resolvedConfig();
      this.#chartAdapter?.update(buildChartOptions({
        ...(this.#buildTooltipAriaLabel ? { buildTooltipAriaLabel: this.#buildTooltipAriaLabel } : {}),
        ...(this.#buildTooltipHtml ? { buildTooltipHtml: this.#buildTooltipHtml } : {}),
        config: currentConfig,
        data: this.#data,
        formatValue: (value, series, x) => this.#formatSeriesValue(value, series, x),
        formatXValue: (value) => this.#formatXValue(value),
        getVisibleViewport: () => ({ left: viewport.scrollLeft, width: viewport.clientWidth }),
        ...(this.#legendSelection ? { legendSelection: this.#legendSelection } : {}),
        model: this.#semanticModel ?? model,
        message: (key, values = {}) => this.#t(key as keyof typeof ENGLISH_LINE_CHART_MESSAGES, values),
        reducedMotion: this.#reducedMotion(currentConfig),
        ...(this.#renderTooltip ? { renderTooltip: this.#renderTooltip } : {}),
        ...(this.subtitle ? { subtitle: this.subtitle } : {}),
        theme: resolveTheme(this.#theme, this)
      }));
    };
    this.#chartUpdate();
    this.#legendCleanup = this.#chartAdapter.onLegendSelection((selected, name) => {
      const before = this.#resolvedConfig();
      this.#legendSelection = { ...selected };
      this.#config = {
        ...this.#config,
        showActualLine: selected[config.actualSeriesLabel] ?? config.showActualLine,
        showTargetLine: selected[config.targetSeriesLabel] ?? config.showTargetLine
      };
      const actualControl = this.querySelector<HTMLInputElement>('[data-control="showActualLine"]');
      const targetControl = this.querySelector<HTMLInputElement>('[data-control="showTargetLine"]');
      if (actualControl) actualControl.checked = this.#resolvedConfig().showActualLine;
      if (targetControl) targetControl.checked = this.#resolvedConfig().showTargetLine;
      const after = this.#resolvedConfig();
      if (after.showActualLine !== before.showActualLine) this.#dispatchSettingsChange('showActualLine', after.showActualLine, 'legend');
      if (after.showTargetLine !== before.showTargetLine) this.#dispatchSettingsChange('showTargetLine', after.showTargetLine, 'legend');
      if (name && config.announceChanges) this.#announce(this.#t(selected[name] ? 'seriesShown' : 'seriesHidden', { series: name }));
    });
    if (typeof ResizeObserver === 'function') {
      this.#resizeObserver = new ResizeObserver(() => {
        updateTooltipWidth();
        onViewportResize();
        this.#chartAdapter?.resize();
      });
      this.#resizeObserver.observe(container);
      this.#resizeObserver.observe(viewport);
    } else {
      this.#windowResizeListener = (): void => {
        updateTooltipWidth();
        onViewportResize();
        this.#chartAdapter?.resize();
      };
      window.addEventListener('resize', this.#windowResizeListener, { passive: true });
    }
  }

  #dispatchReady(): void {
    if (this.#readyDispatched) return;
    this.#readyDispatched = true;
    this.dispatchEvent(new CustomEvent('a11y-line-chart-ready', { bubbles: true, detail: { instanceId: this.instanceId } }));
  }

  #valuePreset(): A11yLineChartValuePreset {
    const value = this.getAttribute('value-preset');
    return value === 'number' || value === 'percent' ? value : this.#config.valuePreset ?? 'percent';
  }

  #dataView(): A11yLineChartDataView {
    const value = this.getAttribute('data-view');
    return value === 'dialog' || value === 'inline' || value === 'none' ? value : this.#config.dataView ?? 'dialog';
  }

  #percentScale(): A11yLineChartPercentScale {
    const value = this.getAttribute('percent-scale');
    return value === 'whole' || value === 'fraction' ? value : this.#config.percentScale ?? 'whole';
  }

  /** True when author percent values arrive as fractions (0.45 for 45%) and must be scaled to whole percent. */
  #usesFractionScale(config: ResolvedA11yLineChartConfig): boolean {
    return config.valuePreset === 'percent' && config.percentScale === 'fraction';
  }

  /** Rebuilds the whole-percent working data from the author-scale source data. */
  #recomputeData(): void {
    if (!this.#usesFractionScale(this.#resolvedConfig())) {
      this.#data = this.#sourceData;
      return;
    }
    this.#data = this.#sourceData.map((datum) => ({
      ...datum,
      actual: typeof datum.actual === 'number' ? fractionToWholePercent(datum.actual) : datum.actual ?? null,
      target: scaleTarget(datum.target ?? null, fractionToWholePercent)
    }));
  }

  #closeInlineViewIfOpen(): void {
    if (this.#dataViewOpen && this.#activeDataView === 'inline') this.#setDataViewState(false, 'inline');
  }
}

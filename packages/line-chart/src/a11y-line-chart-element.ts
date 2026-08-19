import type {
  A11yLineChartConfig,
  A11yLineChartConfigChangeDetail,
  A11yLineChartDatum,
  A11yLineChartErrorDetail,
  A11yLineChartLegacyDatum,
  A11yLineChartPattern,
  A11yLineChartPointChangeDetail,
  A11yLineChartTheme,
  A11yLineChartTooltipAriaLabelBuilder,
  A11yLineChartTooltipHtmlBuilder,
  A11yLineChartTooltipRenderer,
  A11yLineChartValueFormatter,
  A11yLineChartValuePreset,
  A11yLineChartXValue
} from './model.js';
import { buildChartOptions } from './chart-options.js';
import { resolveConfig, resolveTheme, type ResolvedA11yLineChartConfig } from './config.js';
import { EchartsAdapter } from './echarts-adapter.js';
import { validateData } from './validation.js';

const OWNED_ROOT_ATTRIBUTE = 'data-a11y-line-chart-owned';
let nextInstanceId = 0;

function nextId(): string {
  nextInstanceId += 1;
  return `a11y-line-chart-${nextInstanceId}`;
}

function isHeadingLevel(value: number): value is 1 | 2 | 3 | 4 | 5 | 6 {
  return value >= 1 && value <= 6;
}

export class A11yLineChartElement extends HTMLElement {
  static readonly observedAttributes = ['chart-title', 'heading-level', 'locale', 'subtitle', 'value-preset'];

  readonly instanceId = nextId();

  #buildTooltipAriaLabel: A11yLineChartTooltipAriaLabelBuilder | undefined;
  #buildTooltipHtml: A11yLineChartTooltipHtmlBuilder | undefined;
  #chartAdapter: EchartsAdapter | undefined;
  #config: A11yLineChartConfig = {};
  #data: A11yLineChartDatum[] = [];
  #errorMessage = '';
  #focusedIndex = 0;
  #formatValue: A11yLineChartValueFormatter | undefined;
  #legendCleanup: (() => void) | undefined;
  #liveClearTimer: ReturnType<typeof setTimeout> | undefined;
  #ownedRoot?: HTMLElement;
  #readyDispatched = false;
  #renderQueued = false;
  #renderTooltip: A11yLineChartTooltipRenderer | undefined;
  #resizeObserver: ResizeObserver | undefined;
  #theme: A11yLineChartTheme = {};
  #windowResizeListener = (): void => this.#chartAdapter?.resize();

  get chartTitle(): string {
    return this.getAttribute('chart-title')?.trim() || 'Actual vs Target Performance';
  }

  set chartTitle(value: string) {
    this.setAttribute('chart-title', value);
  }

  get subtitle(): string {
    return this.getAttribute('subtitle')?.trim() || '';
  }

  set subtitle(value: string) {
    if (value) this.setAttribute('subtitle', value);
    else this.removeAttribute('subtitle');
  }

  get config(): A11yLineChartConfig {
    return { ...this.#config };
  }

  set config(value: A11yLineChartConfig) {
    this.#config = { ...value };
    this.#focusedIndex = Math.min(this.#focusedIndex, Math.max(0, this.#data.length - 1));
    this.#queueRender();
  }

  /** Compatibility alias for the Angular component's accessibility input. */
  get a11y(): A11yLineChartConfig {
    return this.config;
  }

  set a11y(value: A11yLineChartConfig) {
    this.config = value;
  }

  get data(): A11yLineChartDatum[] {
    return this.#data.map((item) => ({ ...item, x: item.x instanceof Date ? new Date(item.x.getTime()) : item.x }));
  }

  set data(value: Array<A11yLineChartDatum | A11yLineChartLegacyDatum>) {
    const result = validateData(value);
    if (result.valid) {
      this.#data = result.data;
      this.#errorMessage = '';
      this.#focusedIndex = Math.min(this.#focusedIndex, Math.max(0, this.#data.length - 1));
    } else {
      this.#data = [];
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

  get buildTooltipHtml(): A11yLineChartTooltipHtmlBuilder | undefined { return this.#buildTooltipHtml; }
  set buildTooltipHtml(value: A11yLineChartTooltipHtmlBuilder | undefined) { this.#buildTooltipHtml = value; this.#queueRender(); }

  get buildTooltipAriaLabel(): A11yLineChartTooltipAriaLabelBuilder | undefined { return this.#buildTooltipAriaLabel; }
  set buildTooltipAriaLabel(value: A11yLineChartTooltipAriaLabelBuilder | undefined) { this.#buildTooltipAriaLabel = value; this.#queueRender(); }

  get renderTooltip(): A11yLineChartTooltipRenderer | undefined { return this.#renderTooltip; }
  set renderTooltip(value: A11yLineChartTooltipRenderer | undefined) { this.#renderTooltip = value; this.#queueRender(); }

  get theme(): A11yLineChartTheme { return { ...this.#theme }; }
  set theme(value: A11yLineChartTheme) { this.#theme = { ...value }; this.#queueRender(); }

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
    this.#renderQueued = false;
    if (this.#liveClearTimer) clearTimeout(this.#liveClearTimer);
    this.#disposeChart();
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue) this.#queueRender();
  }

  #createOwnedRoot(): HTMLElement {
    const root = document.createElement('section');
    root.className = 'a11y-line-chart__root perf-chart';
    root.setAttribute(OWNED_ROOT_ATTRIBUTE, this.instanceId);
    root.setAttribute('role', 'group');
    this.append(root);
    this.#ownedRoot = root;
    return root;
  }

  #resolvedConfig(): ResolvedA11yLineChartConfig {
    return resolveConfig({
      ...this.#config,
      headingLevel: this.#headingLevel(),
      locale: this.#locale(),
      valuePreset: this.#valuePreset()
    });
  }

  #setConfigField<Key extends keyof A11yLineChartConfig>(key: Key, value: A11yLineChartConfig[Key]): void {
    this.#config = { ...this.#config, [key]: value };
    this.#queueRender();
  }

  #formatSeriesValue(value: number | null | undefined, series: 'actual' | 'target', x: A11yLineChartXValue): string {
    const config = this.#resolvedConfig();
    const normalized = value ?? null;
    if (this.#formatValue) return this.#formatValue({ value: normalized, series, x, locale: config.locale });
    if (normalized === null) return config.describeMissingAs;
    const suffix = config.valuePreset === 'percent' ? '%' : '';
    return `${normalized.toFixed(config.decimalPlaces)}${suffix}`;
  }

  #formatXValue(value: A11yLineChartXValue): string {
    if (value instanceof Date) {
      return new Intl.DateTimeFormat(this.#locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(value);
    }
    return String(value);
  }

  #headingLevel(): 1 | 2 | 3 | 4 | 5 | 6 {
    const attributeValue = Number(this.getAttribute('heading-level'));
    if (isHeadingLevel(attributeValue)) return attributeValue;
    return this.#config.headingLevel ?? 2;
  }

  #locale(): string {
    return this.getAttribute('locale')?.trim() || this.#config.locale || 'en-US';
  }

  #queueRender(): void {
    if (!this.isConnected || this.#renderQueued) return;
    this.#renderQueued = true;
    queueMicrotask(() => {
      this.#renderQueued = false;
      if (this.isConnected) this.#render();
    });
  }

  #render(): void {
    this.#disposeChart();
    const root = this.#ownedRoot?.isConnected ? this.#ownedRoot : this.#createOwnedRoot();
    root.replaceChildren();
    root.setAttribute('aria-label', this.chartTitle);

    const header = document.createElement('header');
    header.className = 'a11y-line-chart__header chart-head';
    const heading = document.createElement(`h${this.#headingLevel()}`);
    heading.className = 'a11y-line-chart__title chart-title';
    heading.id = `${this.instanceId}-title`;
    heading.textContent = this.chartTitle;
    root.setAttribute('aria-labelledby', heading.id);
    header.append(heading);
    if (this.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'a11y-line-chart__subtitle chart-sub';
      subtitle.textContent = this.subtitle;
      header.append(subtitle);
    }
    root.append(header);

    if (this.#errorMessage) {
      const error = document.createElement('p');
      error.className = 'a11y-line-chart__message a11y-line-chart__message--error';
      error.setAttribute('role', 'alert');
      error.textContent = `${this.#errorMessage} Check the data supplied to the chart.`;
      root.append(error);
      return;
    }

    if (!this.#data.length) {
      const empty = document.createElement('p');
      empty.className = 'a11y-line-chart__message a11y-line-chart__message--empty';
      empty.textContent = 'No chart data is available. Provide at least one data point.';
      root.append(empty);
      this.#dispatchReady();
      return;
    }

    const config = this.#resolvedConfig();
    if (config.showControls) root.append(this.#createControls(config));

    const help = document.createElement('p');
    help.className = 'a11y-line-chart__visually-hidden';
    help.id = `${this.instanceId}-keyboard-help`;
    help.textContent = 'Keyboard guidance: focus the chart then use Left and Right Arrow keys to move through years; Home jumps to first year; End jumps to last year. Tooltip content is announced as you navigate.';

    const overflowHelp = document.createElement('p');
    overflowHelp.className = 'a11y-line-chart__visually-hidden';
    overflowHelp.id = `${this.instanceId}-scroll-help`;
    overflowHelp.hidden = true;
    overflowHelp.textContent = 'Chart is wider than the available space. The selected value is scrolled into view as you navigate.';

    const live = document.createElement('div');
    live.className = 'a11y-line-chart__visually-hidden';
    live.id = `${this.instanceId}-live`;
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');

    const viewport = document.createElement('div');
    viewport.className = 'a11y-line-chart__viewport chart-responsive-viewport';
    const resizable = document.createElement('div');
    resizable.className = 'a11y-line-chart__resizable chart-resizable';
    const intrinsic = this.#intrinsicWidths(config);
    resizable.style.minWidth = `${intrinsic.min}px`;
    if (intrinsic.max !== undefined) resizable.style.maxWidth = `${intrinsic.max}px`;

    const chartGroup = document.createElement('div');
    chartGroup.className = 'a11y-line-chart__chart-group chart-container';
    chartGroup.setAttribute('role', 'group');
    chartGroup.setAttribute('aria-roledescription', 'interactive time series');
    chartGroup.setAttribute('aria-labelledby', heading.id);

    const chart = document.createElement('div');
    chart.className = 'a11y-line-chart__chart';
    chart.id = `${this.instanceId}-chart`;
    chart.setAttribute('aria-hidden', 'true');

    const navigator = document.createElement('input');
    navigator.className = 'a11y-line-chart__navigator chart-focus-layer';
    navigator.type = 'range';
    navigator.min = '0';
    navigator.max = String(this.#data.length - 1);
    navigator.step = '1';
    navigator.value = String(this.#focusedIndex);
    navigator.setAttribute('aria-describedby', `${help.id} ${this.instanceId}-data`);
    this.#updateNavigatorLabel(navigator);
    navigator.addEventListener('keydown', (event) => this.#onNavigatorKeydown(event, navigator, viewport, overflowHelp));
    navigator.addEventListener('input', () => this.#selectIndex(Number(navigator.value), navigator, viewport, overflowHelp));
    navigator.addEventListener('focus', () => this.#selectIndex(this.#focusedIndex, navigator, viewport, overflowHelp));
    navigator.addEventListener('blur', () => this.#chartAdapter?.hideTip());

    chartGroup.append(chart, navigator);
    resizable.append(chartGroup);
    viewport.append(resizable);

    const tableRegion = this.#createTable(config);
    root.append(viewport, help, overflowHelp, live, tableRegion);
    this.#mountChart(chart, config);
    requestAnimationFrame(() => {
      const overflowing = viewport.scrollWidth > viewport.clientWidth + 2;
      overflowHelp.hidden = !overflowing;
      navigator.setAttribute('aria-describedby', [help.id, config.tableVisibility === 'hidden' ? '' : `${this.instanceId}-data`, overflowing ? overflowHelp.id : ''].filter(Boolean).join(' '));
    });
    this.#dispatchReady();
  }

  #createControls(config: ResolvedA11yLineChartConfig): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'a11y-line-chart__controls controls';
    controls.setAttribute('aria-label', 'Display options');
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Values';
    fieldset.append(legend);

    const lineChoices: Array<[keyof A11yLineChartConfig, string]> = [
      ['showActualLine', 'Actual line'], ['showTargetLine', 'Target line'],
      ['showActualValues', 'Actual label'], ['showTargetValues', 'Target label'],
      ['fillActual', 'Actual fill'], ['fillTarget', 'Target fill']
    ];
    const displayChoices: Array<[keyof A11yLineChartConfig, string]> = [
      ['showTooltipVisual', 'Tooltip visible'], ['showXAxisTitle', 'X axis title'],
      ['showYAxisTitle', 'Y axis title'], ['initialZoomY', 'Zoom Y-axis']
    ];
    const appendChoices = (choices: Array<[keyof A11yLineChartConfig, string]>): void => {
      for (const [key, labelText] of choices) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(config[key]);
        input.dataset['control'] = String(key);
        input.addEventListener('change', () => this.#changeControl(key, input.checked, labelText, input));
        label.append(input, document.createTextNode(` ${labelText}`));
        fieldset.append(label);
      }
    };
    appendChoices(lineChoices);

    const patterns = document.createElement('div');
    patterns.className = 'a11y-line-chart__pattern-selects pattern-selects';
    patterns.append(
      this.#createPatternSelect('actualPattern', 'Actual pattern type:', config.actualPattern),
      this.#createPatternSelect('targetPattern', 'Target pattern type:', config.targetPattern)
    );
    fieldset.append(patterns);
    appendChoices(displayChoices);
    controls.append(fieldset);
    return controls;
  }

  #createPatternSelect(key: 'actualPattern' | 'targetPattern', text: string, selected: A11yLineChartPattern): HTMLLabelElement {
    const label = document.createElement('label');
    label.append(document.createTextNode(text));
    const select = document.createElement('select');
    select.dataset['control'] = key;
    const options: ReadonlyArray<readonly [A11yLineChartPattern, string]> = [['none', 'None'], ['diagonal', 'Diagonal'], ['dots', 'Dots'], ['horizontal', 'Horizontal']];
    for (const [value, name] of options) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = name;
      option.selected = value === selected;
      select.append(option);
    }
    select.addEventListener('change', () => this.#changeControl(key, select.value as A11yLineChartPattern, `${key === 'actualPattern' ? 'Actual' : 'Target'} pattern set to`, select));
    label.append(select);
    return label;
  }

  #changeControl(key: keyof A11yLineChartConfig, value: A11yLineChartConfig[keyof A11yLineChartConfig], label: string, source: HTMLElement): void {
    this.#config = { ...this.#config, [key]: value };
    const resolved = this.#resolvedConfig();
    const message = key === 'actualPattern' || key === 'targetPattern'
      ? `${label} ${String(value)}`
      : `${label} ${value ? 'enabled' : 'disabled'}`;
    this.dispatchEvent(new CustomEvent<A11yLineChartConfigChangeDetail>('a11y-line-chart-config-change', {
      bubbles: true,
      detail: { config: this.config, source: 'controls' }
    }));
    this.dispatchEvent(new CustomEvent<A11yLineChartConfigChangeDetail>('a11y-line-chart-display-change', {
      bubbles: true,
      detail: { config: this.config, source: 'controls' }
    }));
    const controlName = source.dataset['control'];
    this.#render();
    queueMicrotask(() => {
      if (resolved.announceChanges) this.#announce(message);
      this.querySelector<HTMLElement>(`[data-control="${controlName}"]`)?.focus();
    });
  }

  #createTable(config: ResolvedA11yLineChartConfig): HTMLElement {
    const region = document.createElement('div');
    region.className = 'a11y-line-chart__table-region';
    if (config.tableVisibility === 'screen-reader') region.classList.add('a11y-line-chart__table-region--visually-hidden');
    if (config.tableVisibility === 'hidden') region.hidden = true;
    const table = document.createElement('table');
    table.className = 'a11y-line-chart__table';
    table.id = `${this.instanceId}-data`;
    const caption = document.createElement('caption');
    caption.textContent = 'Underlying data values, actual and target performance percentages by year.';
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const label of ['Year', 'Actual %', 'Target %']) {
      const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; headerRow.append(cell);
    }
    head.append(headerRow);
    const body = document.createElement('tbody');
    for (const item of this.#data) {
      const row = document.createElement('tr');
      const x = document.createElement('th'); x.scope = 'row'; x.textContent = this.#formatXValue(item.x);
      const actual = document.createElement('td'); actual.textContent = this.#formatSeriesValue(item.actual, 'actual', item.x);
      const target = document.createElement('td'); target.textContent = this.#formatSeriesValue(item.target, 'target', item.x);
      row.append(x, actual, target); body.append(row);
    }
    table.append(caption, head, body); region.append(table); return region;
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
      const longest = this.#data.reduce((length, item) => Math.max(length, this.#formatSeriesValue(item.actual, 'actual', item.x).length, this.#formatSeriesValue(item.target, 'target', item.x).length), 0);
      const base = 58 + (config.showActualValues || config.showTargetValues ? longest * 6 : 0);
      if (config.autoPerPointMinWidth) minPerPoint = Math.round(base);
      if (config.autoPerPointMaxWidth) maxPerPoint = Math.max(minPerPoint + 20, Math.round(base * 1.4));
    }
    const min = config.dynamicMinWidth ? Math.max(320, this.#data.length * minPerPoint) : config.minWidth;
    const max = config.dynamicMaxWidth ? Math.max(min, this.#data.length * maxPerPoint) : config.maxWidth;
    return max === undefined ? { min } : { min, max };
  }

  #onNavigatorKeydown(event: KeyboardEvent, navigator: HTMLInputElement, viewport: HTMLElement, overflowHelp: HTMLElement): void {
    let index = this.#focusedIndex;
    if (event.key === 'ArrowRight') index = index === this.#data.length - 1 ? (this.#resolvedConfig().wrapAround ? 0 : index) : index + 1;
    else if (event.key === 'ArrowLeft') index = index === 0 ? (this.#resolvedConfig().wrapAround ? this.#data.length - 1 : 0) : index - 1;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = this.#data.length - 1;
    else return;
    event.preventDefault();
    navigator.value = String(index);
    this.#selectIndex(index, navigator, viewport, overflowHelp);
  }

  #selectIndex(index: number, navigator: HTMLInputElement, viewport: HTMLElement, overflowHelp: HTMLElement): void {
    this.#focusedIndex = Math.max(0, Math.min(this.#data.length - 1, index));
    navigator.value = String(this.#focusedIndex);
    this.#updateNavigatorLabel(navigator);
    const datum = this.#data[this.#focusedIndex];
    if (!datum) return;
    const preferred = (!this.#resolvedConfig().showActualLine || datum.actual == null) && this.#resolvedConfig().showTargetLine && datum.target != null ? 'target-main' : 'actual-main';
    this.#chartAdapter?.showTip(this.#focusedIndex, preferred);
    const announcement = this.#buildAnnouncement(this.#focusedIndex);
    this.#announce(announcement, true);
    this.dispatchEvent(new CustomEvent<A11yLineChartPointChangeDetail>('a11y-line-chart-point-change', {
      bubbles: true,
      detail: { actual: datum.actual ?? null, announcement, index: this.#focusedIndex, target: datum.target ?? null, x: datum.x }
    }));
    const pixel = this.#chartAdapter?.convertXToPixel(this.#formatXValue(datum.x));
    if (pixel !== undefined && !overflowHelp.hidden) {
      viewport.scrollTo({ left: Math.max(0, pixel - viewport.clientWidth / 2), behavior: this.#reducedMotion(this.#resolvedConfig()) ? 'auto' : 'smooth' });
    }
  }

  #updateNavigatorLabel(navigator: HTMLInputElement): void {
    const datum = this.#data[this.#focusedIndex];
    const current = datum ? this.#formatXValue(datum.x) : '';
    navigator.setAttribute('aria-label', `Use Left and Right Arrow keys to move across years. Home jumps to first year. End jumps to last year. Current year ${current}, index ${this.#focusedIndex + 1} of ${this.#data.length}.`);
    if (datum) navigator.setAttribute('aria-valuetext', this.#buildAnnouncement(this.#focusedIndex));
  }

  #buildAnnouncement(index: number): string {
    const datum = this.#data[index];
    if (!datum) return '';
    const actual = datum.actual ?? null;
    const target = datum.target ?? null;
    let difference = '';
    if (actual !== null && target !== null) {
      difference = actual === target
        ? ' Actual equals target.'
        : ` Actual is ${Math.abs(actual - target).toFixed(this.#resolvedConfig().decimalPlaces)}${this.#resolvedConfig().valuePreset === 'percent' ? '%' : ''} ${actual > target ? 'above' : 'below'} target.`;
    }
    return `Year ${this.#formatXValue(datum.x)}. Actual: ${this.#formatSeriesValue(actual, 'actual', datum.x)}. Target: ${this.#formatSeriesValue(target, 'target', datum.x)}.${difference}`;
  }

  #announce(message: string, navigation = false): void {
    const config = this.#resolvedConfig();
    const live = this.querySelector<HTMLElement>(`#${this.instanceId}-live`);
    if (!live) return;
    if (navigation || config.announceChanges) live.textContent = message;
    if (this.#liveClearTimer) clearTimeout(this.#liveClearTimer);
    this.#liveClearTimer = setTimeout(() => { if (live.isConnected) live.textContent = ''; }, 2500);
  }

  #disposeChart(): void {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
    this.#legendCleanup?.();
    this.#legendCleanup = undefined;
    window.removeEventListener('resize', this.#windowResizeListener);
    this.#chartAdapter?.dispose();
    this.#chartAdapter = undefined;
  }

  #reducedMotion(config: ResolvedA11yLineChartConfig): boolean {
    return config.reducedMotion === 'always' || (config.reducedMotion === 'auto' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true);
  }

  #mountChart(container: HTMLElement, config: ResolvedA11yLineChartConfig): void {
    if (container.clientWidth === 0 || container.clientHeight === 0) return;
    this.#chartAdapter = new EchartsAdapter(container);
    this.#chartAdapter.update(buildChartOptions({
      ...(this.#buildTooltipAriaLabel ? { buildTooltipAriaLabel: this.#buildTooltipAriaLabel } : {}),
      ...(this.#buildTooltipHtml ? { buildTooltipHtml: this.#buildTooltipHtml } : {}),
      config,
      data: this.#data,
      formatValue: (value, series, x) => this.#formatSeriesValue(value, series, x),
      formatXValue: (value) => this.#formatXValue(value),
      reducedMotion: this.#reducedMotion(config),
      ...(this.#renderTooltip ? { renderTooltip: this.#renderTooltip } : {}),
      ...(this.subtitle ? { subtitle: this.subtitle } : {}),
      theme: resolveTheme(this.#theme, this)
    }));
    this.#legendCleanup = this.#chartAdapter.onLegendSelection((selected) => {
      this.#config = { ...this.#config, showActualLine: selected['Actual'] ?? config.showActualLine, showTargetLine: selected['Target'] ?? config.showTargetLine };
      this.#queueRender();
    });
    queueMicrotask(() => {
      const datum = this.#data[this.#focusedIndex];
      if (!datum || !this.#chartAdapter) return;
      const preferred = (!config.showActualLine || datum.actual == null) && config.showTargetLine && datum.target != null ? 'target-main' : 'actual-main';
      this.#chartAdapter.showTip(this.#focusedIndex, preferred);
    });
    if (typeof ResizeObserver === 'function') {
      this.#resizeObserver = new ResizeObserver(() => this.#chartAdapter?.resize());
      this.#resizeObserver.observe(container);
    } else window.addEventListener('resize', this.#windowResizeListener, { passive: true });
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
}

import { Component, Input, Signal, computed, signal, ViewEncapsulation, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption, SeriesOption } from 'echarts';

export interface A11yLineChartDatum {
  year: number;
  actual?: number | null;
  target?: number | null;
}

export interface A11yLineChartA11yConfig {
  announceChanges?: boolean;
  showTable?: boolean;
  decimalPlaces?: number;
  axisDecimalPlaces?: number;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  autoDetectGaps?: boolean;
  describeMissingAs?: string;
  wrapAround?: boolean;
  reducedMotion?: 'auto' | 'always' | 'never';
  /**
   * Trend display mode:
   *  - 'arrows' (default): up/down/equal arrow symbol indicator
   *  - 'labels': textual outcome label (positive / negative / equal)
   */
  trendMode?: 'labels' | 'arrows';
  /** Determines which direction is considered a positive outcome. Default 'above'. */
  positiveDirection?: 'above' | 'below';
  /** Label when target considered met (positive outcome). Default 'Target met'. */
  positiveLabel?: string;
  /** Label when target considered not met (negative outcome). Default 'Target not met'. */
  negativeLabel?: string;
  /** Label when actual equals target. Default 'On target'. */
  equalLabel?: string;
  /** If true, the chart starts with Y-axis zoom enabled (data-range fit). */
  initialZoomY?: boolean;
}

export interface A11yLineChartTheme {
  actualColor?: string;
  actualFill?: string;
  actualFillOpacity?: number;
  targetColor?: string;
  targetFill?: string;
  targetFillOpacity?: number;
  /** Optional pattern type for actual area fill (none | diagonal | dots | horizontal) */
  actualPatternType?: 'none' | 'diagonal' | 'dots' | 'horizontal';
  /** Stroke/foreground color for actual pattern (defaults to actualColor) */
  actualPatternColor?: string;
  /** Optional pattern type for target area fill */
  targetPatternType?: 'none' | 'diagonal' | 'dots' | 'horizontal';
  /** Stroke/foreground color for target pattern (defaults to targetColor) */
  targetPatternColor?: string;
  focusLineColor?: string;
  focusLineWidth?: number;
  focusLineType?: 'solid' | 'dashed' | 'dotted';
  actualEmphasisFillColor?: string;
  targetEmphasisFillColor?: string;
  actualEmphasisBorderColor?: string;
  targetEmphasisBorderColor?: string;
  trendUpColor?: string;
  trendDownColor?: string;
  trendEqualColor?: string;
  trendUpSymbol?: string;
  trendDownSymbol?: string;
  trendEqualSymbol?: string;
  actualSymbolSize?: number;
  targetSymbolSize?: number;
  pointBorderColor?: string;
  pointBorderWidth?: number;
  pointShadowColor?: string;
  pointShadowBlur?: number;
  lineWidth?: number;
  emphasisBorderColor?: string;
  emphasisBorderWidth?: number;
  actualLineOutlineColor?: string;
  actualLineOutlineWidth?: number;
  targetLineOutlineColor?: string;
  targetLineOutlineWidth?: number;
  actualLabelColor?: string;
  targetLabelColor?: string;
  labelFontSize?: number;
  /* Axis title styling tokens */
  xAxisTitleColor?: string;
  xAxisTitleFontSize?: number;
  xAxisTitleFontWeight?: string | number;
  yAxisTitleColor?: string;
  yAxisTitleFontSize?: number;
  yAxisTitleFontWeight?: string | number;
}

@Component({
  selector: 'app-a11y-line-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  templateUrl: './a11y-line-chart.component.html',
  styleUrls: ['./a11y-line-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class A11yLineChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) data: A11yLineChartDatum[] = [];
  @Input() title = 'Actual vs Target Performance';
  @Input() subtitle = '';
  @Input() a11y: A11yLineChartA11yConfig = {};
  @Input() theme: A11yLineChartTheme = {};
  @Input() buildTooltipHtml?: (ctx: A11yLineChartTooltipContext) => string;
  @Input() buildTooltipAriaLabel?: (ctx: A11yLineChartTooltipContext) => string;
  // Axis titles (optional, default hidden until toggled)
  @Input() xAxisTitle: string = 'Year';
  @Input() yAxisTitle: string = 'Percent';
  /** Base (un-zoomed) Y-axis minimum. Default 0. */
  @Input() yAxisBaseMin: number = 0;
  /** Base (un-zoomed) Y-axis maximum. Default 100. */
  @Input() yAxisBaseMax: number = 100;

  showActualLine = signal(true);
  showTargetLine = signal(true);
  showActualValues = signal(false);
  showTargetValues = signal(false);
  fillActual = signal(true);
  fillTarget = signal(true);
  showTooltipVisual = signal(true);
  showXAxisTitle = signal(false);
  showYAxisTitle = signal(false);
  // Zoom (dynamic y-axis scaling) toggle
  zoomY = signal(false);
  private appliedInitialZoom = false;
  // Pattern usage toggles (when false, force pattern type 'none')
  useActualPattern = signal(false);
  useTargetPattern = signal(false);
  // Runtime pattern type overrides (controlled by selects)
  actualPatternTypeOverride = signal<'none' | 'diagonal' | 'dots' | 'horizontal'>('none');
  targetPatternTypeOverride = signal<'none' | 'diagonal' | 'dots' | 'horizontal'>('none');

  liveMessage = signal('');

  // Responsive minimum chart width (px) before horizontal scrolling activates.
  @Input() minWidth = 720; // Fallback if dynamic disabled
  // Optional maximum width for the intrinsic chart (prevents lines from stretching too wide on large monitors)
  @Input() maxWidth?: number;

  // Dynamic sizing flags & heuristics
  @Input() dynamicMinWidth = false;            // if true, compute minWidth based on data length
  @Input() dynamicMaxWidth = false;            // if true, compute maxWidth from data length
  @Input() perPointMinWidth = 70;              // px / point when computing minWidth
  @Input() perPointMaxWidth = 110;             // px / point when computing maxWidth
  @Input() autoPerPointMinWidth = false;       // if true, estimate per-point min width from label/value density
  @Input() autoPerPointMaxWidth = false;       // if true, estimate max width factor

  // View reference for measuring overflow
  @ViewChild('viewport', { static: false }) viewportRef?: ElementRef<HTMLElement>;
  // Track overflow state for accessible messaging
  private overflowing = signal(false);
  isOverflowing = this.overflowing.asReadonly();

  private resizeObserver?: ResizeObserver;
  private resizeTimer: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['dynamicMinWidth'] || changes['dynamicMaxWidth']) {
      this.recalculateIntrinsicWidths();
      // After width changes, reevaluate overflow on next frame
      requestAnimationFrame(() => this.updateOverflowState());
    }
    if (changes['a11y'] && !this.appliedInitialZoom) {
      if (this.a11y.initialZoomY) this.zoomY.set(true);
      this.appliedInitialZoom = true;
    }
    if (changes['yAxisBaseMin'] || changes['yAxisBaseMax']) {
      // Ensure logical ordering
      if (this.yAxisBaseMax <= this.yAxisBaseMin) {
        this.yAxisBaseMax = this.yAxisBaseMin + 1;
      }
    }
    // Auto-init pattern toggles when theme supplies non-'none' types
    if (changes['theme']) {
      const aType = this.theme.actualPatternType ?? 'none';
      const tType = this.theme.targetPatternType ?? 'none';
      if (aType !== 'none') {
        this.actualPatternTypeOverride.set(aType);
        this.useActualPattern.set(true);
      }
      if (tType !== 'none') {
        this.targetPatternTypeOverride.set(tType);
        this.useTargetPattern.set(true);
      }
    }
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;
    this.recalculateIntrinsicWidths();
    const el = this.viewportRef?.nativeElement;
    if (!el) return;
    this.updateOverflowState();
    this.resizeObserver = new ResizeObserver(() => this.debouncedResize());
    this.resizeObserver.observe(el);
    window.addEventListener('resize', this.windowResizeListener, { passive: true });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    if (typeof window !== 'undefined') window.removeEventListener('resize', this.windowResizeListener);
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
  }

  private windowResizeListener = () => this.debouncedResize();

  private debouncedResize() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.recalculateIntrinsicWidths();
      this.updateOverflowState();
    }, 120); // 120ms debounce for responsiveness w/o thrash
  }

  private recalculateIntrinsicWidths() {
    // If requested, derive per-point heuristic automatically.
    if (this.autoPerPointMinWidth) this.perPointMinWidth = this.estimatePerPointWidth('min');
    if (this.autoPerPointMaxWidth) this.perPointMaxWidth = Math.max(this.perPointMinWidth + 20, this.estimatePerPointWidth('max'));

    if (this.dynamicMinWidth) this.minWidth = Math.max(320, this.data.length * this.perPointMinWidth);
    if (this.dynamicMaxWidth) this.maxWidth = Math.max(this.minWidth, this.data.length * this.perPointMaxWidth);

    // Allow CSS variable overrides if user hasn't explicitly set different values (only at first run)
    if (typeof window !== 'undefined') {
      const cs = getComputedStyle(document.documentElement);
      const varMin = cs.getPropertyValue('--a11y-line-chart-per-point-min-width').trim();
      const varMax = cs.getPropertyValue('--a11y-line-chart-per-point-max-width').trim();
      if (varMin && !this.autoPerPointMinWidth && this.perPointMinWidth === 70) {
        const n = parseFloat(varMin); if (!isNaN(n)) this.perPointMinWidth = n;
      }
      if (varMax && !this.autoPerPointMaxWidth && this.perPointMaxWidth === 110) {
        const n = parseFloat(varMax); if (!isNaN(n)) this.perPointMaxWidth = n;
      }
    }
  }

  private updateOverflowState() {
    if (!this.viewportRef) return;
    const el = this.viewportRef.nativeElement;
    this.overflowing.set(el.scrollWidth > el.clientWidth + 2);
  }

  /**
   * Estimate a reasonable per-point width based on label and value formatting length.
   * Heuristic:
   * - Base width 50px (glyph + spacing)
   * - Add 6px per formatted value character if value labels enabled for that series
   * - Add small increment if both series visible.
   */
  private estimatePerPointWidth(kind: 'min' | 'max'): number {
    const valueDp = this.a11y.decimalPlaces ?? 0;
    const longestValChars = (() => {
      let maxChars = 0;
      for (const d of this.data) {
        if (d.actual != null) maxChars = Math.max(maxChars, (d.actual.toFixed(valueDp) + '%').length);
        if (d.target != null) maxChars = Math.max(maxChars, (d.target.toFixed(valueDp) + '%').length);
      }
      return maxChars || (3 + valueDp); // fallback
    })();
    const valueLabelsPotential = (this.showActualValues() ? 1 : 0) + (this.showTargetValues() ? 1 : 0);
    const charContribution = longestValChars * 6 * Math.min(1, valueLabelsPotential); // only if at least 1 label type shown
    const bothSeries = (this.showActualLine() ? 1 : 0) + (this.showTargetLine() ? 1 : 0) === 2;
    const base = 50 + charContribution + (bothSeries ? 8 : 0);
    return kind === 'min' ? Math.round(base) : Math.round(base * 1.4);
  }

  years: Signal<number[]> = computed(() => this.data.map(d => d.year));
  actualSeriesValues: Signal<(number | null)[]> = computed(() => this.data.map(d => d.actual ?? null));
  targetSeriesValues: Signal<(number | null)[]> = computed(() => this.data.map(d => d.target ?? null));

  chartOptions: Signal<EChartsOption> = computed(() => this.buildOptions());

  private resolvedTheme(): Required<A11yLineChartTheme> {
    // Resolve a CSS variable or literal into a concrete color string ECharts can use.
    // Passing a raw var(--token) string to ECharts (canvas) won't work because the canvas
    // drawing context does not resolve CSS custom properties. So we dereference here.
    const readCssVar = (name: string, hard: string): string => {
      if (typeof window === 'undefined') return hard;
      try {
        const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return val || hard;
      } catch { return hard; }
    };
    const resolveColor = (input: string | undefined, defaultVar: string, hard: string): string => {
      if (input && input.trim()) {
        let v = input.trim();
        if (/^var\(/.test(v)) {
          // Extract inside var(...)
            const m = v.match(/var\((--[^,\s)]+)/);
            if (m) return readCssVar(m[1], hard);
        }
        if (v.startsWith('--')) return readCssVar(v, hard);
        return v; // literal color
      }
      return readCssVar(defaultVar, hard);
    };
    const numVar = (name: string, hard: number): number => {
      if (typeof window !== 'undefined') {
        try {
          const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
          if (raw) {
            const n = parseFloat(raw.replace(/px$/, ''));
            if (!isNaN(n)) return n;
          }
        } catch { /* ignore */ }
      }
      return hard;
    };
    const strVar = (name: string, hard: string): string => {
      if (typeof window !== 'undefined') {
        try {
          const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
          if (raw) return raw.replace(/^["']|["']$/g, '');
        } catch { /* ignore */ }
      }
      return hard;
    };
    const weightVar = (name: string, hard: string | number): string | number => {
      const v = strVar(name, String(hard));
      const n = parseInt(v, 10);
      return isNaN(n) ? v : n;
    };
    return {
      actualColor: resolveColor(this.theme.actualColor, '--a11y-line-chart-actual-color', '#1e62d0'),
      actualFill: resolveColor(this.theme.actualFill, '--a11y-line-chart-actual-fill', '#87B0FF'),
      actualFillOpacity: this.theme.actualFillOpacity ?? numVar('--a11y-line-chart-actual-fill-opacity', 1),
      targetColor: resolveColor(this.theme.targetColor, '--a11y-line-chart-target-color', '#c1a100'),
      targetFill: resolveColor(this.theme.targetFill, '--a11y-line-chart-target-fill', '#e8dca4'),
      targetFillOpacity: this.theme.targetFillOpacity ?? numVar('--a11y-line-chart-target-fill-opacity', 1),
  actualPatternType: this.theme.actualPatternType ?? (strVar('--a11y-line-chart-actual-pattern-type', 'none') as any),
  actualPatternColor: resolveColor(this.theme.actualPatternColor, '--a11y-line-chart-actual-pattern-color', '#1e62d0'),
  targetPatternType: this.theme.targetPatternType ?? (strVar('--a11y-line-chart-target-pattern-type', 'none') as any),
  targetPatternColor: resolveColor(this.theme.targetPatternColor, '--a11y-line-chart-target-pattern-color', '#c1a100'),
      focusLineColor: resolveColor(this.theme.focusLineColor, '--a11y-line-chart-focus-line-color', 'rgba(0,0,0,0.45)'),
      focusLineWidth: this.theme.focusLineWidth ?? numVar('--a11y-line-chart-focus-line-width', 1),
      focusLineType: this.theme.focusLineType ?? strVar('--a11y-line-chart-focus-line-type', 'dashed') as any,
      trendUpColor: resolveColor(this.theme.trendUpColor, '--a11y-line-chart-trend-up-color', '#148f2a'),
      trendDownColor: resolveColor(this.theme.trendDownColor, '--a11y-line-chart-trend-down-color', '#c62828'),
      trendEqualColor: resolveColor(this.theme.trendEqualColor, '--a11y-line-chart-trend-equal-color', '#444444'),
      trendUpSymbol: this.theme.trendUpSymbol ?? strVar('--a11y-line-chart-trend-up-symbol', '↑'),
      trendDownSymbol: this.theme.trendDownSymbol ?? strVar('--a11y-line-chart-trend-down-symbol', '↓'),
      trendEqualSymbol: this.theme.trendEqualSymbol ?? strVar('--a11y-line-chart-trend-equal-symbol', '='),
      actualSymbolSize: this.theme.actualSymbolSize ?? numVar('--a11y-line-chart-actual-symbol-size', 12),
      targetSymbolSize: this.theme.targetSymbolSize ?? numVar('--a11y-line-chart-target-symbol-size', 14),
      pointBorderColor: resolveColor(this.theme.pointBorderColor, '--a11y-line-chart-point-border-color', '#ffffff'),
      pointBorderWidth: this.theme.pointBorderWidth ?? numVar('--a11y-line-chart-point-border-width', 2),
      pointShadowColor: resolveColor(this.theme.pointShadowColor, '--a11y-line-chart-point-shadow-color', 'rgba(0,0,0,0.25)'),
      pointShadowBlur: this.theme.pointShadowBlur ?? numVar('--a11y-line-chart-point-shadow-blur', 4),
      lineWidth: this.theme.lineWidth ?? numVar('--a11y-line-chart-line-width', 4),
      emphasisBorderColor: resolveColor(this.theme.emphasisBorderColor, '--a11y-line-chart-emphasis-border-color', '#000000'),
      emphasisBorderWidth: this.theme.emphasisBorderWidth ?? numVar('--a11y-line-chart-emphasis-border-width', 2),
      actualEmphasisFillColor: resolveColor(this.theme.actualEmphasisFillColor, '--a11y-line-chart-actual-emphasis-fill-color', '#1e62d0'),
      targetEmphasisFillColor: resolveColor(this.theme.targetEmphasisFillColor, '--a11y-line-chart-target-emphasis-fill-color', '#c1a100'),
      actualEmphasisBorderColor: resolveColor(this.theme.actualEmphasisBorderColor, '--a11y-line-chart-actual-emphasis-border-color', '#000000'),
      targetEmphasisBorderColor: resolveColor(this.theme.targetEmphasisBorderColor, '--a11y-line-chart-target-emphasis-border-color', '#000000'),
      actualLineOutlineColor: resolveColor(this.theme.actualLineOutlineColor, '--a11y-line-chart-actual-line-outline-color', '#ffffff'),
      actualLineOutlineWidth: this.theme.actualLineOutlineWidth ?? numVar('--a11y-line-chart-actual-line-outline-width', 6),
      targetLineOutlineColor: resolveColor(this.theme.targetLineOutlineColor, '--a11y-line-chart-target-line-outline-color', '#ffffff'),
      targetLineOutlineWidth: this.theme.targetLineOutlineWidth ?? numVar('--a11y-line-chart-target-line-outline-width', 6),
      actualLabelColor: resolveColor(this.theme.actualLabelColor, '--a11y-line-chart-actual-label-color', '#143e82'),
      targetLabelColor: resolveColor(this.theme.targetLabelColor, '--a11y-line-chart-target-label-color', '#6d5a00'),
      labelFontSize: this.theme.labelFontSize ?? numVar('--a11y-line-chart-label-font-size', 11),
  xAxisTitleColor: resolveColor(this.theme.xAxisTitleColor, '--a11y-line-chart-x-axis-title-color', '#222222'),
  xAxisTitleFontSize: this.theme.xAxisTitleFontSize ?? numVar('--a11y-line-chart-x-axis-title-font-size', 12),
  xAxisTitleFontWeight: this.theme.xAxisTitleFontWeight ?? weightVar('--a11y-line-chart-x-axis-title-font-weight', 600),
  yAxisTitleColor: resolveColor(this.theme.yAxisTitleColor, '--a11y-line-chart-y-axis-title-color', '#222222'),
  yAxisTitleFontSize: this.theme.yAxisTitleFontSize ?? numVar('--a11y-line-chart-y-axis-title-font-size', 12),
  yAxisTitleFontWeight: this.theme.yAxisTitleFontWeight ?? weightVar('--a11y-line-chart-y-axis-title-font-weight', 600),
    };
  }

  focusedIndex = signal(0);
  private chart: any | null = null;
  descIds: Signal<string> = computed(() => this.a11y.showTable === false ? 'chartKeyboardHelp' : 'chartKeyboardHelp perfChartData');

  private buildOptions(): EChartsOption {
    const years = this.years();
    let actual = this.actualSeriesValues();
    const target = this.targetSeriesValues();
    if (this.a11y.autoDetectGaps) {
      let lastIndex = -1;
      for (let i = 0; i < actual.length; i++) if (actual[i] != null) lastIndex = i;
      if (lastIndex >= 0 && lastIndex < actual.length - 1) actual = actual.map((v, i) => (i > lastIndex ? null : v));
    }
    const valueDp = this.a11y.decimalPlaces ?? 0;
    const axisDp = this.a11y.axisDecimalPlaces ?? 0;
    const fmt = (v: any) => (v == null ? '' : `${Number(v).toFixed(valueDp)}%`);
    const t = this.resolvedTheme();
    let prefersReduce = false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      try { prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { prefersReduce = false; }
    }
    const rmSetting = this.a11y.reducedMotion ?? 'auto';
    const reducedMotionActive = rmSetting === 'always' || (rmSetting === 'auto' && prefersReduce);
    const series: SeriesOption[] = [];
    // Determine y-axis bounds (either full 0-100 or zoomed to data range)
  let baseMin = this.yAxisBaseMin;
  let baseMax = this.yAxisBaseMax;
  if (!isFinite(baseMin)) baseMin = 0;
  if (!isFinite(baseMax)) baseMax = baseMin + 1;
  if (baseMax <= baseMin) baseMax = baseMin + 1;
  let yMin = baseMin; let yMax = baseMax;
    if (this.zoomY()) {
      const values: number[] = [];
      for (const d of this.data) {
        if (typeof d.actual === 'number') values.push(d.actual);
        if (typeof d.target === 'number') values.push(d.target);
      }
      if (values.length) {
        let vMin = Math.min(...values);
        let vMax = Math.max(...values);
        if (vMin === vMax) { vMin -= 1; vMax += 1; }
        let range = vMax - vMin;
        const pad = Math.max(range * 0.06, 1); // 6% or at least 1
        vMin -= pad; vMax += pad; range = vMax - vMin;
    // Clamp to configured base range
    yMin = Math.max(baseMin, Math.floor(vMin));
    yMax = Math.min(baseMax, Math.ceil(vMax));
        if (yMax - yMin < 4) { // ensure readable span
          const extra = (4 - (yMax - yMin)) / 2;
      yMin = Math.max(baseMin, Math.floor(yMin - extra));
      yMax = Math.min(baseMax, Math.ceil(yMax + extra));
        }
      }
    }
  // Layering strategy (from back to front):
  // 0: target area
  // 1: actual area
  // 2: target outline + target main line (so target line sits above actual fill but behind actual line)
  // 3: actual outline
  // 4: actual main line (topmost for clarity)
    // Prepare patterned area fills (only in browser; SSR fallback uses solid color)
    const resolveAreaFill = (kind: 'actual' | 'target') => {
      const enabled = kind === 'actual' ? this.useActualPattern() : this.useTargetPattern();
      const override = kind === 'actual' ? this.actualPatternTypeOverride() : this.targetPatternTypeOverride();
      const themeType = kind === 'actual' ? t.actualPatternType : t.targetPatternType;
      const effectiveType = enabled ? (override !== 'none' ? override : themeType) : 'none';
      if (effectiveType === 'none') return kind === 'actual' ? t.actualFill : t.targetFill;
      if (typeof document === 'undefined') return kind === 'actual' ? t.actualFill : t.targetFill;
      try {
        return { image: this.createPattern(effectiveType, kind === 'actual' ? t.actualPatternColor : t.targetPatternColor, kind === 'actual' ? t.actualFill : t.targetFill, (kind === 'actual' ? t.actualFillOpacity : t.targetFillOpacity)), repeat: 'repeat' } as any;
      } catch { return kind === 'actual' ? t.actualFill : t.targetFill; }
    };
    if (this.showActualLine() && this.fillActual()) series.push({ name: 'Actual area', type: 'line', data: actual, connectNulls: false, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: resolveAreaFill('actual'), opacity: t.actualFillOpacity }, blendMode: 'source-over', silent: true, tooltip: { show: false }, z: 1 });
  const actualOutlineActive = t.actualLineOutlineWidth > t.lineWidth;
  if (this.showTargetLine() && this.fillTarget()) series.push({ name: 'Target area', type: 'line', data: target, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: resolveAreaFill('target'), opacity: t.targetFillOpacity }, blendMode: 'source-over', silent: true, tooltip: { show: false }, z: 0 });
  const targetOutlineActive = t.targetLineOutlineWidth > t.lineWidth;
  if (this.showTargetLine() && targetOutlineActive) series.push({ name: 'Target outline', type: 'line', data: target, symbol: 'none', lineStyle: { width: t.targetLineOutlineWidth, color: t.targetLineOutlineColor, cap: 'round', join: 'round' }, silent: true, tooltip: { show: false }, z: 2 });
  if (this.showTargetLine()) series.push({ id: 'target-main', name: 'Target', type: 'line', data: target, symbol: 'diamond', symbolSize: t.targetSymbolSize, itemStyle: { color: t.targetColor, borderColor: t.pointBorderColor, borderWidth: t.pointBorderWidth, shadowBlur: t.pointShadowBlur, shadowColor: t.pointShadowColor }, emphasis: { scale: !reducedMotionActive, itemStyle: { borderColor: t.targetEmphasisBorderColor, borderWidth: t.emphasisBorderWidth, color: t.targetEmphasisFillColor } }, lineStyle: { width: t.lineWidth, color: t.targetColor }, label: { show: this.showTargetValues(), formatter: (p: any) => fmt(p.data), position: 'top', color: t.targetLabelColor, fontSize: t.labelFontSize }, z: 2 });
  if (this.showActualLine() && actualOutlineActive) series.push({ name: 'Actual outline', type: 'line', data: actual, connectNulls: false, symbol: 'none', lineStyle: { width: t.actualLineOutlineWidth, color: t.actualLineOutlineColor, cap: 'round', join: 'round' }, silent: true, tooltip: { show: false }, z: 3 });
  if (this.showActualLine()) series.push({ id: 'actual-main', name: 'Actual', type: 'line', data: actual, connectNulls: false, symbol: 'circle', symbolSize: t.actualSymbolSize, itemStyle: { color: t.actualColor, borderColor: t.pointBorderColor, borderWidth: t.pointBorderWidth, shadowBlur: t.pointShadowBlur, shadowColor: t.pointShadowColor }, emphasis: { scale: !reducedMotionActive, itemStyle: { borderColor: t.actualEmphasisBorderColor, borderWidth: t.emphasisBorderWidth, color: t.actualEmphasisFillColor } }, lineStyle: { width: t.lineWidth, color: t.actualColor }, label: { show: this.showActualValues(), formatter: (p: any) => fmt(p.data), position: 'top', color: t.actualLabelColor, fontSize: t.labelFontSize }, z: 4 });
  const hasXAxisTitle = this.showXAxisTitle();
  const hasYAxisTitle = this.showYAxisTitle();
  return { animation: !reducedMotionActive, animationDuration: reducedMotionActive ? 0 : 600, animationDurationUpdate: reducedMotionActive ? 0 : 400, animationEasing: reducedMotionActive ? 'linear' : 'cubicOut', animationEasingUpdate: reducedMotionActive ? 'linear' : 'cubicOut', tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: t.focusLineColor, width: t.focusLineWidth, type: t.focusLineType } }, backgroundColor: 'transparent', borderWidth: 0, padding: 0, confine: true, extraCssText: 'box-shadow:none;padding:0;', formatter: (params: any[]) => { let actualP: any | undefined; let targetP: any | undefined; for (const p of params) { if (p.seriesName === 'Actual') actualP = p; else if (p.seriesName === 'Target') targetP = p; } const year = (actualP || targetP)?.axisValueLabel ?? ''; const aVal = actualP ? actualP.data : null; const tVal = targetP ? targetP.data : null; const hasBoth = aVal != null && tVal != null; let trendClass = 'equal'; let trendColor = t.trendEqualColor; let trendSymbol = t.trendEqualSymbol; if (hasBoth && aVal > tVal) { trendClass = 'up'; trendColor = t.trendUpColor; trendSymbol = t.trendUpSymbol; } else if (hasBoth && aVal < tVal) { trendClass = 'down'; trendColor = t.trendDownColor; trendSymbol = t.trendDownSymbol; } const aTxt = aVal == null ? this.a11y.describeMissingAs ?? 'Missing' : fmt(aVal); const tTxt = tVal == null ? this.a11y.describeMissingAs ?? 'Missing' : fmt(tVal); let diffPhrase = ''; let relation: A11yLineChartTooltipContext['relation'] = 'incomplete'; let diffNum: number | null = null; let diffFormatted: string | null = null; if (hasBoth) { if (aVal === tVal) { diffPhrase = 'Actual equals target'; relation = 'equal'; diffNum = 0; diffFormatted = '0%'; } else { diffNum = Math.abs(aVal - tVal); diffFormatted = diffNum.toFixed(valueDp) + '%'; const dir = aVal > tVal ? 'above' : 'below'; relation = aVal > tVal ? 'above' : 'below'; diffPhrase = `Actual is ${diffFormatted} ${dir} target`; } } const mode = this.a11y.trendMode ?? 'labels'; const posDir = this.a11y.positiveDirection ?? 'above'; const positiveLabel = this.a11y.positiveLabel || 'Target met'; const negativeLabel = this.a11y.negativeLabel || 'Target not met'; const equalLabel = this.a11y.equalLabel || 'On target'; let evaluationLabel = ''; if (hasBoth) { if (relation === 'equal') evaluationLabel = equalLabel; else { const isPositive = (relation === posDir); evaluationLabel = isPositive ? positiveLabel : negativeLabel; } } let evaluationPhrase = evaluationLabel ? `${evaluationLabel}.` : ''; const ctx: A11yLineChartTooltipContext = { year, actualValue: aVal, targetValue: tVal, actualFormatted: aTxt, targetFormatted: tTxt, relation, diffPercent: diffNum, diffFormatted, theme: t }; if (this.buildTooltipHtml) { try { return this.buildTooltipHtml(ctx); } catch { /* ignore */ } } const baseAria = (this.buildTooltipAriaLabel ? this.buildTooltipAriaLabel(ctx) : `Year ${year}. Actual ${aTxt}. Target ${tTxt}. ${diffPhrase} ${evaluationPhrase}`).trim(); let headerExtra = ''; if (hasBoth && mode === 'arrows') { headerExtra = `<span class=\"perf-tooltip__trend perf-tooltip__trend--${trendClass}\" aria-hidden=\"true\" style=\"color:${trendColor}\">${trendSymbol}</span>`; } else if (hasBoth && mode === 'labels') { let statusColor = trendColor; if (relation === 'equal') statusColor = t.trendEqualColor; else { const isPositive = (relation === posDir); statusColor = isPositive ? t.trendUpColor : t.trendDownColor; } headerExtra = `<span class=\"perf-tooltip__status\" style=\"background:${statusColor};color:#fff\" aria-hidden=\"true\">${evaluationLabel}</span>`; } const hiddenClass = this.showTooltipVisual() ? '' : ' perf-tooltip--visually-hidden'; return `\n<div class=\"perf-tooltip${hiddenClass}\" role=\"group\" aria-label=\"${baseAria.replace(/"/g,'&quot;')}\">\n  <div class=\"perf-tooltip__year\">${year} ${headerExtra}</div>\n  <div class=\"perf-tooltip__row\"><span class=\"perf-tooltip__label\">Actual Value:</span> <span class=\"perf-tooltip__value\">${aTxt}</span></div>\n  <div class=\"perf-tooltip__row\"><span class=\"perf-tooltip__label\">Target Value:</span> <span class=\"perf-tooltip__value\">${tTxt}</span></div>\n ${hasBoth && diffPhrase ? `<span class=\"perf-tooltip__diff\"> ${diffPhrase}.</span>` : ''}</div>`; } }, legend: { top: 4, data: ['Actual', 'Target'], selected: { Actual: this.showActualLine(), Target: this.showTargetLine() } }, grid: { left: hasYAxisTitle ? 70 : 42, right: 16, top: 54, bottom: hasXAxisTitle ? 120 : 90 }, title: this.subtitle ? { text: this.subtitle, left: 'center', top: 24, textStyle: { fontSize: 12, fontWeight: 400 } } : undefined, xAxis: { type: 'category', boundaryGap: false, data: years, axisLabel: { interval: 0 }, name: hasXAxisTitle ? this.xAxisTitle : undefined, nameLocation: 'middle', nameGap: 50, nameTextStyle: { fontSize: t.xAxisTitleFontSize, fontWeight: t.xAxisTitleFontWeight, color: t.xAxisTitleColor } }, yAxis: { type: 'value', min: yMin, max: yMax, axisLabel: { formatter: (v: number) => `${Number(v).toFixed(axisDp)}%` }, name: hasYAxisTitle ? this.yAxisTitle : undefined, nameLocation: 'middle', nameGap: 48, nameRotate: 90, nameTextStyle: { fontSize: t.yAxisTitleFontSize, fontWeight: t.yAxisTitleFontWeight, color: t.yAxisTitleColor } }, series } as EChartsOption;
  }

  /** Create a small canvas pattern for area fills. */
  private createPattern(type: 'diagonal' | 'dots' | 'horizontal', stroke: string, background: string, opacity: number) {
    const size = 20;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return background;
    ctx.fillStyle = this.applyOpacity(background, opacity);
    ctx.fillRect(0,0,size,size);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    if (type === 'diagonal') {
      ctx.beginPath();
      ctx.moveTo(0,size-2); ctx.lineTo(size-2,0); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2,size); ctx.lineTo(size,size-2); ctx.stroke();
    } else if (type === 'horizontal') {
      ctx.beginPath();
      ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();
    } else if (type === 'dots') {
      ctx.fillStyle = stroke;
      for (let y=4; y<size; y+=8) for (let x=4; x<size; x+=8) { ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); }
    }
    return canvas;
  }

  private applyOpacity(color: string, opacity: number) {
    if (/^#/.test(color) && (color.length === 7 || color.length === 4)) {
      const hex = color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
      const r = parseInt(hex.slice(1,3),16); const g = parseInt(hex.slice(3,5),16); const b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${opacity})`;
    }
    if (/^rgb\(/.test(color)) return color.replace(/rgb\(([^)]+)\)/, (m, inner) => `rgba(${inner},${opacity})`);
    return color;
  }

  onChartInit(instance: any) {
    this.chart = instance;
    this.chart.on?.('legendselectchanged', (e: any) => {
      if (e?.selected) {
        if (Object.prototype.hasOwnProperty.call(e.selected, 'Actual')) this.showActualLine.set(!!e.selected['Actual']);
        if (Object.prototype.hasOwnProperty.call(e.selected, 'Target')) this.showTargetLine.set(!!e.selected['Target']);
      }
    });
    setTimeout(() => this.showTipForIndex(this.focusedIndex()), 0);
  }

  onKeydown(ev: KeyboardEvent) {
    const len = this.years().length;
    let idx = this.focusedIndex();
    switch (ev.key) {
      case 'ArrowRight': ev.preventDefault(); idx = idx === len - 1 ? (this.a11y.wrapAround ? 0 : len - 1) : idx + 1; break;
      case 'ArrowLeft': ev.preventDefault(); idx = idx === 0 ? (this.a11y.wrapAround ? len - 1 : 0) : idx - 1; break;
      case 'Home': idx = 0; ev.preventDefault(); break;
      case 'End': idx = len - 1; ev.preventDefault(); break;
      default: return;
    }
    if (idx !== this.focusedIndex()) { this.focusedIndex.set(idx); this.showTipForIndex(idx); } else { this.showTipForIndex(idx); }
  }

  onFocus() { this.showTipForIndex(this.focusedIndex()); }
  onBlur() { if (this.chart) this.chart.dispatchAction({ type: 'hideTip' }); }

  private showTipForIndex(index: number) {
    if (!this.chart) return;
    const actualVal = this.actualSeriesValues()[index];
    const targetVal = this.targetSeriesValues()[index];
    const desiredId = (!this.showActualLine() || actualVal == null) && (this.showTargetLine() && targetVal != null) ? 'target-main' : 'actual-main';
    let seriesIndex = 0; const opt = this.chart.getOption(); const s = opt.series as any[];
    for (let i = 0; i < s.length; i++) if (s[i].id === desiredId) { seriesIndex = i; break; }
    this.chart.dispatchAction({ type: 'showTip', seriesIndex, dataIndex: index });
    const announce = this.buildAnnouncement(index);
    if (this.a11y.announceChanges !== false) this.announce(announce); else this.liveMessage.set(announce);
  }

  private buildAnnouncement(index: number): string {
    const year = this.years()[index];
    const a = this.actualSeriesValues()[index];
    const t = this.targetSeriesValues()[index];
    const missing = this.a11y.describeMissingAs ?? 'Missing';
    const dp = this.a11y.decimalPlaces ?? 0;
    const fmt = (v: number | null) => (v == null ? missing : `${v.toFixed(dp)}%`);
    let diffPart = '';
    if (a != null && t != null) {
      if (a === t) diffPart = ' Actual equals target.'; else { const diff = Math.abs(a - t).toFixed(dp) + '%'; diffPart = ` Actual is ${diff} ${a > t ? 'above' : 'below'} target.`; }
    }
    return `Year ${year}. Actual: ${fmt(a)}. Target: ${fmt(t)}.${diffPart}`;
  }

  toggle(kind: 'actualValues' | 'targetValues' | 'fillActual' | 'fillTarget' | 'actualLine' | 'targetLine' | 'tooltipVisual' | 'actualPattern' | 'targetPattern') {
    const map = {
      actualLine: this.showActualLine,
      targetLine: this.showTargetLine,
      actualValues: this.showActualValues,
      targetValues: this.showTargetValues,
      fillActual: this.fillActual,
      fillTarget: this.fillTarget,
      tooltipVisual: this.showTooltipVisual,
      actualPattern: this.useActualPattern,
      targetPattern: this.useTargetPattern,
    } as const;
    const sig = map[kind]; sig.set(!sig());
    // Assign default pattern type when enabling and no override/theme pattern yet
    if (sig() && kind === 'actualPattern' && this.actualPatternTypeOverride() === 'none' && (this.theme.actualPatternType ?? 'none') === 'none') {
      this.actualPatternTypeOverride.set('diagonal');
    }
    if (sig() && kind === 'targetPattern' && this.targetPatternTypeOverride() === 'none' && (this.theme.targetPatternType ?? 'none') === 'none') {
      this.targetPatternTypeOverride.set('diagonal');
    }
    if (this.a11y.announceChanges) {
      const labelMap: Record<string, string> = {
        actualLine: 'Actual line',
        targetLine: 'Target line',
        actualValues: 'Actual value labels',
        targetValues: 'Target value labels',
        fillActual: 'Actual fill',
        fillTarget: 'Target fill',
        tooltipVisual: 'Tooltip visual display',
        actualPattern: 'Actual pattern',
        targetPattern: 'Target pattern',
      };
      this.announce(`${labelMap[kind]} ${sig() ? 'enabled' : 'disabled'}`);
    }
  }

  toggleAxis(kind: 'x' | 'y') {
    if (kind === 'x') {
      this.showXAxisTitle.set(!this.showXAxisTitle());
      if (this.a11y.announceChanges) this.announce(`X axis title ${this.showXAxisTitle() ? 'enabled' : 'disabled'}`);
    } else {
      this.showYAxisTitle.set(!this.showYAxisTitle());
      if (this.a11y.announceChanges) this.announce(`Y axis title ${this.showYAxisTitle() ? 'enabled' : 'disabled'}`);
    }
  }

  toggleZoomY() {
    this.zoomY.set(!this.zoomY());
    if (this.a11y.announceChanges) this.announce(`Y axis zoom ${this.zoomY() ? 'enabled' : 'disabled'}`);
  }

  changePattern(which: 'actual' | 'target', raw: string) {
    const val = (['none','diagonal','dots','horizontal'].includes(raw) ? raw : 'none') as 'none' | 'diagonal' | 'dots' | 'horizontal';
    if (which === 'actual') {
      this.actualPatternTypeOverride.set(val);
      if (val !== 'none' && !this.useActualPattern()) this.useActualPattern.set(true);
      if (this.a11y.announceChanges) this.announce(`Actual pattern set to ${val}`);
    } else {
      this.targetPatternTypeOverride.set(val);
      if (val !== 'none' && !this.useTargetPattern()) this.useTargetPattern.set(true);
      if (this.a11y.announceChanges) this.announce(`Target pattern set to ${val}`);
    }
  }

  onActualPatternChange(ev: Event) {
    const sel = ev.target as HTMLSelectElement | null;
    const value = sel?.value ?? 'none';
    this.changePattern('actual', value);
  }

  onTargetPatternChange(ev: Event) {
    const sel = ev.target as HTMLSelectElement | null;
    const value = sel?.value ?? 'none';
    this.changePattern('target', value);
  }

  private announce(msg: string) { this.liveMessage.set(msg); setTimeout(() => this.liveMessage.set(''), 2500); }
  formatForTable(v: number | null | undefined) { if (v == null) return this.a11y.describeMissingAs ?? '—'; const dp = this.a11y.decimalPlaces ?? 0; return `${v.toFixed(dp)}%`; }
}

export interface A11yLineChartTooltipContext {
  year: number | string;
  actualValue: number | null;
  targetValue: number | null;
  actualFormatted: string;
  targetFormatted: string;
  relation: 'above' | 'below' | 'equal' | 'incomplete';
  diffPercent: number | null;
  diffFormatted: string | null;
  theme: Required<A11yLineChartTheme>;
}

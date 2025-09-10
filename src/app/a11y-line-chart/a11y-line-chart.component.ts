import { Component, Input, Signal, computed, signal, ViewEncapsulation } from '@angular/core';
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
}

export interface A11yLineChartTheme {
  actualColor?: string;
  actualFill?: string;
  actualFillOpacity?: number;
  targetColor?: string;
  targetFill?: string;
  targetFillOpacity?: number;
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
}

@Component({
  selector: 'app-a11y-line-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  templateUrl: './a11y-line-chart.component.html',
  styleUrls: ['./a11y-line-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class A11yLineChartComponent {
  @Input({ required: true }) data: A11yLineChartDatum[] = [];
  @Input() title = 'Actual vs Target Performance';
  @Input() subtitle = '';
  @Input() a11y: A11yLineChartA11yConfig = {};
  @Input() theme: A11yLineChartTheme = {};
  @Input() buildTooltipHtml?: (ctx: A11yLineChartTooltipContext) => string;
  @Input() buildTooltipAriaLabel?: (ctx: A11yLineChartTooltipContext) => string;

  showActualLine = signal(true);
  showTargetLine = signal(true);
  showActualValues = signal(false);
  showTargetValues = signal(false);
  fillActual = signal(true);
  fillTarget = signal(true);
  showTooltipVisual = signal(true);

  liveMessage = signal('');

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
    return {
      actualColor: resolveColor(this.theme.actualColor, '--a11y-line-chart-actual-color', '#1e62d0'),
      actualFill: resolveColor(this.theme.actualFill, '--a11y-line-chart-actual-fill', '#87B0FF'),
      actualFillOpacity: this.theme.actualFillOpacity ?? numVar('--a11y-line-chart-actual-fill-opacity', 1),
      targetColor: resolveColor(this.theme.targetColor, '--a11y-line-chart-target-color', '#c1a100'),
      targetFill: resolveColor(this.theme.targetFill, '--a11y-line-chart-target-fill', '#e8dca4'),
      targetFillOpacity: this.theme.targetFillOpacity ?? numVar('--a11y-line-chart-target-fill-opacity', 1),
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
    if (this.showActualLine() && this.fillActual()) series.push({ name: 'Actual area', type: 'line', data: actual, connectNulls: false, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: t.actualFill, opacity: t.actualFillOpacity }, blendMode: 'source-over', silent: true, tooltip: { show: false }, z: 1 });
    const actualOutlineActive = t.actualLineOutlineWidth > t.lineWidth;
    if (this.showActualLine() && actualOutlineActive) series.push({ name: 'Actual outline', type: 'line', data: actual, connectNulls: false, symbol: 'none', lineStyle: { width: t.actualLineOutlineWidth, color: t.actualLineOutlineColor, cap: 'round', join: 'round' }, silent: true, tooltip: { show: false }, z: 2 });
    if (this.showActualLine()) series.push({ id: 'actual-main', name: 'Actual', type: 'line', data: actual, connectNulls: false, symbol: 'circle', symbolSize: t.actualSymbolSize, itemStyle: { color: t.actualColor, borderColor: t.pointBorderColor, borderWidth: t.pointBorderWidth, shadowBlur: t.pointShadowBlur, shadowColor: t.pointShadowColor }, emphasis: { scale: !reducedMotionActive, itemStyle: { borderColor: t.actualEmphasisBorderColor, borderWidth: t.emphasisBorderWidth, color: t.actualEmphasisFillColor } }, lineStyle: { width: t.lineWidth, color: t.actualColor }, label: { show: this.showActualValues(), formatter: (p: any) => fmt(p.data), position: 'top', color: t.actualLabelColor, fontSize: t.labelFontSize }, z: 3 });
    if (this.showTargetLine() && this.fillTarget()) series.push({ name: 'Target area', type: 'line', data: target, symbol: 'none', lineStyle: { width: 0 }, areaStyle: { color: t.targetFill, opacity: t.targetFillOpacity }, blendMode: 'source-over', silent: true, tooltip: { show: false }, z: 0 });
    const targetOutlineActive = t.targetLineOutlineWidth > t.lineWidth;
    if (this.showTargetLine() && targetOutlineActive) series.push({ name: 'Target outline', type: 'line', data: target, symbol: 'none', lineStyle: { width: t.targetLineOutlineWidth, color: t.targetLineOutlineColor, cap: 'round', join: 'round' }, silent: true, tooltip: { show: false }, z: 2 });
    if (this.showTargetLine()) series.push({ id: 'target-main', name: 'Target', type: 'line', data: target, symbol: 'diamond', symbolSize: t.targetSymbolSize, itemStyle: { color: t.targetColor, borderColor: t.pointBorderColor, borderWidth: t.pointBorderWidth, shadowBlur: t.pointShadowBlur, shadowColor: t.pointShadowColor }, emphasis: { scale: !reducedMotionActive, itemStyle: { borderColor: t.targetEmphasisBorderColor, borderWidth: t.emphasisBorderWidth, color: t.targetEmphasisFillColor } }, lineStyle: { width: t.lineWidth, color: t.targetColor }, label: { show: this.showTargetValues(), formatter: (p: any) => fmt(p.data), position: 'top', color: t.targetLabelColor, fontSize: t.labelFontSize }, z: 3 });
    return { animation: !reducedMotionActive, animationDuration: reducedMotionActive ? 0 : 600, animationDurationUpdate: reducedMotionActive ? 0 : 400, animationEasing: reducedMotionActive ? 'linear' : 'cubicOut', animationEasingUpdate: reducedMotionActive ? 'linear' : 'cubicOut', tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: t.focusLineColor, width: t.focusLineWidth, type: t.focusLineType } }, backgroundColor: 'transparent', borderWidth: 0, padding: 0, confine: true, extraCssText: 'box-shadow:none;padding:0;', formatter: (params: any[]) => { let actualP: any | undefined; let targetP: any | undefined; for (const p of params) { if (p.seriesName === 'Actual') actualP = p; else if (p.seriesName === 'Target') targetP = p; } const year = (actualP || targetP)?.axisValueLabel ?? ''; const aVal = actualP ? actualP.data : null; const tVal = targetP ? targetP.data : null; const hasBoth = aVal != null && tVal != null; let trendClass = 'equal'; let trendColor = t.trendEqualColor; let trendSymbol = t.trendEqualSymbol; if (hasBoth && aVal > tVal) { trendClass = 'up'; trendColor = t.trendUpColor; trendSymbol = t.trendUpSymbol; } else if (hasBoth && aVal < tVal) { trendClass = 'down'; trendColor = t.trendDownColor; trendSymbol = t.trendDownSymbol; } const aTxt = aVal == null ? this.a11y.describeMissingAs ?? 'Missing' : fmt(aVal); const tTxt = tVal == null ? this.a11y.describeMissingAs ?? 'Missing' : fmt(tVal); let diffPhrase = ''; let relation: A11yLineChartTooltipContext['relation'] = 'incomplete'; let diffNum: number | null = null; let diffFormatted: string | null = null; if (hasBoth) { if (aVal === tVal) { diffPhrase = 'Actual equals target'; relation = 'equal'; diffNum = 0; diffFormatted = '0%'; } else { diffNum = Math.abs(aVal - tVal); diffFormatted = diffNum.toFixed(valueDp) + '%'; const dir = aVal > tVal ? 'above' : 'below'; relation = aVal > tVal ? 'above' : 'below'; diffPhrase = `Actual is ${diffFormatted} ${dir} target`; } } const ctx: A11yLineChartTooltipContext = { year, actualValue: aVal, targetValue: tVal, actualFormatted: aTxt, targetFormatted: tTxt, relation, diffPercent: diffNum, diffFormatted, theme: t }; if (this.buildTooltipHtml) { try { return this.buildTooltipHtml(ctx); } catch { /* ignore */ } } const ariaLabel = (this.buildTooltipAriaLabel ? this.buildTooltipAriaLabel(ctx) : `Year ${year}. Actual ${aTxt}. Target ${tTxt}. ${diffPhrase}`).trim(); const trendSpan = hasBoth ? `<span class=\"perf-tooltip__trend perf-tooltip__trend--${trendClass}\" aria-hidden=\"true\" style=\"color:${trendColor}\">${trendSymbol}</span>` : ''; const hiddenClass = this.showTooltipVisual() ? '' : ' perf-tooltip--visually-hidden'; return `\n<div class=\"perf-tooltip${hiddenClass}\" role=\"group\" aria-label=\"${ariaLabel.replace(/"/g,'&quot;')}\">\n  <div class=\"perf-tooltip__year\">${year} ${trendSpan}</div>\n  <div class=\"perf-tooltip__row\"><span class=\"perf-tooltip__label\">Actual Value:</span> <span class=\"perf-tooltip__value\">${aTxt}</span></div>\n  <div class=\"perf-tooltip__row\"><span class=\"perf-tooltip__label\">Target Value:</span> <span class=\"perf-tooltip__value\">${tTxt}</span></div>\n ${hasBoth ? `<span class=\"perf-tooltip__diff\"> ${diffPhrase}.</span>` : ''}</div>`; } }, legend: { top: 4, data: ['Actual', 'Target'], selected: { Actual: this.showActualLine(), Target: this.showTargetLine() } }, grid: { left: 42, right: 16, top: 54, bottom: 90 }, title: this.subtitle ? { text: this.subtitle, left: 'center', top: 24, textStyle: { fontSize: 12, fontWeight: 400 } } : undefined, xAxis: { type: 'category', boundaryGap: false, data: years, axisLabel: { interval: 0 } }, yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: (v: number) => `${Number(v).toFixed(axisDp)}%` } }, series } as EChartsOption;
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

  toggle(kind: 'actualValues' | 'targetValues' | 'fillActual' | 'fillTarget' | 'actualLine' | 'targetLine' | 'tooltipVisual') {
    const map = { actualLine: this.showActualLine, targetLine: this.showTargetLine, actualValues: this.showActualValues, targetValues: this.showTargetValues, fillActual: this.fillActual, fillTarget: this.fillTarget, tooltipVisual: this.showTooltipVisual } as const;
    const sig = map[kind]; sig.set(!sig());
    if (this.a11y.announceChanges) {
      const labelMap: Record<string, string> = { actualLine: 'Actual line', targetLine: 'Target line', actualValues: 'Actual value labels', targetValues: 'Target value labels', fillActual: 'Actual fill', fillTarget: 'Target fill', tooltipVisual: 'Tooltip visual display' };
      this.announce(`${labelMap[kind]} ${sig() ? 'enabled' : 'disabled'}`);
    }
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

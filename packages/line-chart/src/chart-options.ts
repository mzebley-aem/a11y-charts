import type { EChartsCoreOption } from 'echarts/core';
import type { ResolvedA11yLineChartConfig, ResolvedA11yLineChartTheme } from './config.js';
import type {
  A11yLineChartDatum,
  A11yLineChartSemanticModel,
  A11yLineChartTooltipAriaLabelBuilder,
  A11yLineChartTooltipContext,
  A11yLineChartTooltipHtmlBuilder,
  A11yLineChartTooltipRenderer,
  A11yLineChartXValue
} from './model.js';

interface TooltipParameter {
  dataIndex?: number;
  seriesId?: string;
  seriesName?: string;
}

export interface A11yLineChartVisibleViewport {
  left: number;
  width: number;
}

interface TooltipPositionSize {
  contentSize: [number, number];
  viewSize: [number, number];
}

export interface ChartOptionContext {
  buildTooltipAriaLabel?: A11yLineChartTooltipAriaLabelBuilder;
  buildTooltipHtml?: A11yLineChartTooltipHtmlBuilder;
  config: ResolvedA11yLineChartConfig;
  data: A11yLineChartDatum[];
  formatValue: (value: number | null, series: 'actual' | 'target', x: A11yLineChartXValue) => string;
  formatXValue: (value: A11yLineChartXValue) => string;
  getVisibleViewport?: () => A11yLineChartVisibleViewport;
  legendSelection?: Record<string, boolean>;
  model: A11yLineChartSemanticModel;
  reducedMotion: boolean;
  renderTooltip?: A11yLineChartTooltipRenderer;
  subtitle?: string;
  theme: ResolvedA11yLineChartTheme;
}

export function calculateTooltipPosition(
  point: [number, number],
  contentSize: [number, number],
  viewSize: [number, number],
  visibleViewport?: A11yLineChartVisibleViewport
): [number, number] {
  const edgePadding = 8;
  const pointGap = 16;
  const visibleLeft = Math.max(0, Math.min(visibleViewport?.left ?? 0, viewSize[0]));
  const visibleWidth = Math.max(0, visibleViewport?.width ?? viewSize[0]);
  const visibleRight = Math.min(viewSize[0], visibleLeft + visibleWidth);
  const minX = visibleLeft + edgePadding;
  const maxX = Math.max(minX, visibleRight - contentSize[0] - edgePadding);

  let x = point[0] + pointGap;
  if (x + contentSize[0] > visibleRight - edgePadding) {
    x = point[0] - contentSize[0] - pointGap;
  }
  x = Math.max(minX, Math.min(x, maxX));

  const minY = edgePadding;
  const maxY = Math.max(minY, viewSize[1] - contentSize[1] - edgePadding);
  const y = Math.max(minY, Math.min(point[1] - contentSize[1] / 2, maxY));

  return [Math.round(x), Math.round(y)];
}

function calculateYBounds(
  data: A11yLineChartDatum[],
  config: ResolvedA11yLineChartConfig,
  model: A11yLineChartSemanticModel
): { max: number; min: number } {
  if (!config.initialZoomY) return { min: config.yAxisBaseMin, max: config.yAxisBaseMax };
  const values = data.flatMap((item) => [item.actual, item.target].filter((value): value is number => typeof value === 'number'));
  if (model.baseline) values.push(model.baseline.value);
  if (!values.length) return { min: config.yAxisBaseMin, max: config.yAxisBaseMax };

  let valueMin = Math.min(...values);
  let valueMax = Math.max(...values);
  if (valueMin === valueMax) {
    valueMin -= 1;
    valueMax += 1;
  }
  const padding = Math.max(1, (valueMax - valueMin) * 0.06);
  let min = Math.max(config.yAxisBaseMin, Math.floor(valueMin - padding));
  let max = Math.min(config.yAxisBaseMax, Math.ceil(valueMax + padding));
  if (max - min < 4) {
    const extra = (4 - (max - min)) / 2;
    min = Math.max(config.yAxisBaseMin, Math.floor(min - extra));
    max = Math.min(config.yAxisBaseMax, Math.ceil(max + extra));
  }
  return max > min ? { min, max } : { min, max: min + 1 };
}

function applyOpacity(color: string, opacity: number): string {
  const longHex = /^#[0-9a-f]{6}$/i.exec(color);
  const shortHex = /^#[0-9a-f]{3}$/i.exec(color);
  if (longHex || shortHex) {
    const hex = shortHex
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    return `rgba(${Number.parseInt(hex.slice(1, 3), 16)},${Number.parseInt(hex.slice(3, 5), 16)},${Number.parseInt(hex.slice(5, 7), 16)},${opacity})`;
  }
  return color.replace(/^rgb\(([^)]+)\)$/i, `rgba($1,${opacity})`);
}

function createPattern(
  type: 'diagonal' | 'dots' | 'horizontal',
  stroke: string,
  background: string,
  opacity: number
): string | { image: HTMLCanvasElement; repeat: 'repeat' } {
  if (typeof document === 'undefined') return background;
  const canvas = document.createElement('canvas');
  canvas.width = 20;
  canvas.height = 20;
  const drawing = canvas.getContext('2d');
  if (!drawing) return background;
  drawing.fillStyle = applyOpacity(background, opacity);
  drawing.fillRect(0, 0, 20, 20);
  drawing.strokeStyle = stroke;
  drawing.fillStyle = stroke;
  drawing.lineWidth = 2;
  if (type === 'diagonal') {
    drawing.beginPath(); drawing.moveTo(0, 18); drawing.lineTo(18, 0); drawing.stroke();
    drawing.beginPath(); drawing.moveTo(2, 20); drawing.lineTo(20, 2); drawing.stroke();
  } else if (type === 'horizontal') {
    drawing.beginPath(); drawing.moveTo(0, 10); drawing.lineTo(20, 10); drawing.stroke();
  } else {
    for (let y = 4; y < 20; y += 8) for (let x = 4; x < 20; x += 8) {
      drawing.beginPath(); drawing.arc(x, y, 2, 0, Math.PI * 2); drawing.fill();
    }
  }
  return { image: canvas, repeat: 'repeat' };
}

function areaColor(kind: 'actual' | 'target', config: ResolvedA11yLineChartConfig, theme: ResolvedA11yLineChartTheme) {
  const selected = kind === 'actual' ? config.actualPattern : config.targetPattern;
  const themed = kind === 'actual' ? theme.actualPatternType : theme.targetPatternType;
  const type = selected !== 'none' ? selected : themed;
  const fill = kind === 'actual' ? theme.actualFill : theme.targetFill;
  if (type === 'none') return fill;
  return createPattern(
    type,
    kind === 'actual' ? theme.actualPatternColor : theme.targetPatternColor,
    fill,
    kind === 'actual' ? theme.actualFillOpacity : theme.targetFillOpacity
  );
}

function tooltipContext(index: number, context: ChartOptionContext): A11yLineChartTooltipContext | undefined {
  const datum = context.data[index];
  const interpretation = context.model.points[index];
  if (!datum || !interpretation) return undefined;
  const differenceLabel = interpretation.targetDifference
    ? interpretation.targetDifference.relation === 'equal'
      ? `${context.config.actualSeriesLabel} equals ${context.config.targetSeriesLabel.toLocaleLowerCase()}`
      : `${context.config.actualSeriesLabel} is ${interpretation.targetDifference.description}`
    : '';
  return {
    datum,
    index,
    interpretation,
    xLabel: interpretation.xLabel,
    year: datum.x instanceof Date ? interpretation.xLabel : datum.x,
    actualValue: interpretation.actualValue,
    targetValue: interpretation.targetValue,
    actualFormatted: interpretation.actualFormatted,
    targetFormatted: interpretation.targetFormatted,
    actualLabel: interpretation.actualFormatted,
    targetLabel: interpretation.targetFormatted,
    diffPercent: interpretation.targetDifference?.absoluteValue ?? null,
    diffFormatted: interpretation.targetDifference?.formatted ?? null,
    differenceLabel,
    relation: interpretation.relation,
    relationLabel: interpretation.outcome === 'unavailable' ? '' : interpretation.outcomeLabel,
    theme: context.theme
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character] ?? character);
}

function defaultTooltip(ctx: A11yLineChartTooltipContext, context: ChartOptionContext): string {
  const { config, theme } = context;
  const hasBoth = ctx.relation !== 'incomplete';
  const direction = ctx.relation === 'above' ? 'up' : ctx.relation === 'below' ? 'down' : 'equal';
  const trendColor = ctx.interpretation.outcome === 'met'
    ? theme.trendUpColor
    : ctx.interpretation.outcome === 'not-met'
      ? theme.trendDownColor
      : theme.trendEqualColor;
  const trendSymbol = direction === 'up' ? theme.trendUpSymbol : direction === 'down' ? theme.trendDownSymbol : theme.trendEqualSymbol;
  const headerExtra = !hasBoth
    ? ''
    : config.trendMode === 'arrows'
      ? `<span class="perf-tooltip__trend perf-tooltip__trend--${direction}" aria-hidden="true" style="color:${escapeHtml(trendColor)}">${escapeHtml(trendSymbol)}</span>`
      : `<span class="perf-tooltip__status" style="background:${escapeHtml(trendColor)};color:#fff" aria-hidden="true">${escapeHtml(ctx.relationLabel)}</span>`;
  const defaultAria = ctx.interpretation.narrative;
  let aria = defaultAria;
  try { aria = context.buildTooltipAriaLabel?.(ctx) || defaultAria; } catch { /* use default */ }
  const hiddenClass = config.showTooltipVisual ? '' : ' perf-tooltip--visually-hidden';
  return `<div class="perf-tooltip${hiddenClass}" role="group" aria-label="${escapeHtml(aria)}">
    <div class="perf-tooltip__year">${escapeHtml(ctx.xLabel)} ${headerExtra}</div>
    <div class="perf-tooltip__row"><span class="perf-tooltip__label">${escapeHtml(config.actualSeriesLabel)}:</span> <span class="perf-tooltip__value">${escapeHtml(ctx.actualFormatted)}</span></div>
    <div class="perf-tooltip__row"><span class="perf-tooltip__label">${escapeHtml(config.targetSeriesLabel)}:</span> <span class="perf-tooltip__value">${escapeHtml(ctx.targetFormatted)}</span></div>
    ${ctx.interpretation.baseline ? `<div class="perf-tooltip__row"><span class="perf-tooltip__label">${escapeHtml(config.baselineSeriesLabel)} (${escapeHtml(ctx.interpretation.baseline.xLabel)}):</span> <span class="perf-tooltip__value">${escapeHtml(ctx.interpretation.baseline.formatted)}</span></div>` : ''}
    ${ctx.differenceLabel ? `<span class="perf-tooltip__diff">${escapeHtml(ctx.differenceLabel)}.</span>` : ''}
    ${ctx.interpretation.baseline?.difference ? `<span class="perf-tooltip__diff">Change from ${escapeHtml(config.baselineSeriesLabel.toLocaleLowerCase())}: ${escapeHtml(ctx.interpretation.baseline.difference.description)}.</span>` : ''}
  </div>`;
}

export function buildChartOptions(context: ChartOptionContext): EChartsCoreOption {
  const { config, data, formatValue, formatXValue, reducedMotion, theme } = context;
  const categories = data.map((item) => formatXValue(item.x));
  let actual = data.map((item) => item.actual ?? null);
  const target = data.map((item) => item.target ?? null);
  if (config.autoDetectGaps) {
    let last = -1;
    actual.forEach((value, index) => { if (value !== null) last = index; });
    actual = actual.map((value, index) => index > last && last >= 0 ? null : value);
  }
  const bounds = calculateYBounds(data, config, context.model);
  const series: Array<Record<string, unknown>> = [];
  const labelFormatter = (kind: 'actual' | 'target') => (parameter: { data?: number | null; dataIndex?: number }) => {
    const item = data[parameter.dataIndex ?? -1];
    return item ? formatValue(parameter.data ?? null, kind, item.x) : '';
  };

  if (context.model.baseline) {
    const baseline = context.model.baseline;
    series.push({
      id: 'baseline-main',
      name: config.baselineSeriesLabel,
      type: 'line',
      data: data.map(() => baseline.value),
      symbol: 'none',
      lineStyle: {
        color: theme.baselineColor,
        type: theme.baselineLineType,
        width: theme.baselineLineWidth
      },
      silent: true,
      tooltip: { show: false },
      z: 2
    });
    series.push({
      id: 'baseline-marker',
      name: config.baselineSeriesLabel,
      type: 'scatter',
      data: [[categories[0], baseline.value]],
      symbol: 'roundRect',
      symbolSize: theme.baselineSymbolSize,
      itemStyle: {
        color: theme.baselineColor,
        borderColor: theme.pointBorderColor,
        borderWidth: theme.pointBorderWidth
      },
      label: {
        show: true,
        formatter: `${baseline.xLabel} ${config.baselineSeriesLabel.toLocaleLowerCase()}: ${baseline.formatted}`,
        position: 'right',
        distance: 8,
        offset: [0, 14],
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 3,
        padding: [2, 4],
        color: theme.baselineLabelColor,
        fontSize: theme.labelFontSize,
        fontWeight: 600
      },
      silent: true,
      tooltip: { show: false },
      z: 3
    });
  }

  if (config.fillTarget) series.push({
    id: 'target-area', name: config.targetSeriesLabel, type: 'line', data: target, symbol: 'none',
    lineStyle: { width: 0 }, areaStyle: { color: areaColor('target', config, theme), opacity: theme.targetFillOpacity },
    silent: true, tooltip: { show: false }, z: 0
  });
  if (config.fillActual) series.push({
    id: 'actual-area', name: config.actualSeriesLabel, type: 'line', data: actual, connectNulls: false, symbol: 'none',
    lineStyle: { width: 0 }, areaStyle: { color: areaColor('actual', config, theme), opacity: theme.actualFillOpacity },
    silent: true, tooltip: { show: false }, z: 1
  });
  if (theme.targetLineOutlineWidth > theme.lineWidth) series.push({
    id: 'target-outline', name: config.targetSeriesLabel, type: 'line', data: target, symbol: 'none',
    lineStyle: { width: theme.targetLineOutlineWidth, color: theme.targetLineOutlineColor, cap: 'round', join: 'round' },
    silent: true, tooltip: { show: false }, z: 2
  });
  series.push({
    id: 'target-main', name: config.targetSeriesLabel, type: 'line', data: target, connectNulls: false, symbol: 'diamond', symbolSize: theme.targetSymbolSize,
    lineStyle: { color: theme.targetColor, type: 'dashed', width: theme.lineWidth },
    itemStyle: { color: theme.targetColor, borderColor: theme.pointBorderColor, borderWidth: theme.pointBorderWidth, shadowBlur: theme.pointShadowBlur, shadowColor: theme.pointShadowColor },
    emphasis: { scale: !reducedMotion, itemStyle: { borderColor: theme.targetEmphasisBorderColor, borderWidth: theme.emphasisBorderWidth, color: theme.targetEmphasisFillColor } },
    label: { show: config.showTargetValues, formatter: labelFormatter('target'), position: 'top', color: theme.targetLabelColor, fontSize: theme.labelFontSize }, z: 4
  });
  if (theme.actualLineOutlineWidth > theme.lineWidth) series.push({
    id: 'actual-outline', name: config.actualSeriesLabel, type: 'line', data: actual, connectNulls: false, symbol: 'none',
    lineStyle: { width: theme.actualLineOutlineWidth, color: theme.actualLineOutlineColor, cap: 'round', join: 'round' },
    silent: true, tooltip: { show: false }, z: 3
  });
  series.push({
    id: 'actual-main', name: config.actualSeriesLabel, type: 'line', data: actual, connectNulls: false, symbol: 'circle', symbolSize: theme.actualSymbolSize,
    lineStyle: { color: theme.actualColor, type: 'solid', width: theme.lineWidth },
    itemStyle: { color: theme.actualColor, borderColor: theme.pointBorderColor, borderWidth: theme.pointBorderWidth, shadowBlur: theme.pointShadowBlur, shadowColor: theme.pointShadowColor },
    emphasis: { scale: !reducedMotion, itemStyle: { borderColor: theme.actualEmphasisBorderColor, borderWidth: theme.emphasisBorderWidth, color: theme.actualEmphasisFillColor } },
    label: { show: config.showActualValues, formatter: labelFormatter('actual'), position: 'top', color: theme.actualLabelColor, fontSize: theme.labelFontSize }, z: 6
  });

  return {
    animation: !reducedMotion,
    animationDuration: reducedMotion ? 0 : 600,
    animationDurationUpdate: reducedMotion ? 0 : 650,
    animationEasing: reducedMotion ? 'linear' : 'cubicOut',
    animationEasingUpdate: reducedMotion ? 'linear' : 'cubicInOut',
    aria: { enabled: false },
    grid: { left: config.showYAxisTitle ? 70 : 42, right: 16, top: 54, bottom: config.showXAxisTitle ? 120 : 90 },
    legend: {
      top: 4,
      data: [config.actualSeriesLabel, config.targetSeriesLabel, ...(context.model.baseline ? [config.baselineSeriesLabel] : [])],
      textStyle: { fontSize: theme.legendFontSize },
      selected: {
        [config.actualSeriesLabel]: context.legendSelection?.[config.actualSeriesLabel] ?? config.showActualLine,
        [config.targetSeriesLabel]: context.legendSelection?.[config.targetSeriesLabel] ?? config.showTargetLine,
        ...(context.model.baseline ? {
          [config.baselineSeriesLabel]: context.legendSelection?.[config.baselineSeriesLabel] ?? true
        } : {})
      }
    },
    title: context.subtitle ? { text: context.subtitle, left: 'center', top: 24, textStyle: { fontSize: 12, fontWeight: 400 } } : undefined,
    series,
    tooltip: {
      trigger: 'axis', confine: true, renderMode: 'html', appendToBody: false,
      position: (
        point: [number, number],
        _parameters: TooltipParameter | TooltipParameter[],
        _element: HTMLElement,
        _rect: unknown,
        size: TooltipPositionSize
      ) => calculateTooltipPosition(point, size.contentSize, size.viewSize, context.getVisibleViewport?.()),
      axisPointer: { type: 'line', lineStyle: { color: theme.focusLineColor, width: theme.focusLineWidth, type: theme.focusLineType } },
      backgroundColor: 'transparent', borderWidth: 0, padding: 0, extraCssText: 'box-shadow:none;padding:0;',
      formatter: (parameters: TooltipParameter | TooltipParameter[]) => {
        const list = Array.isArray(parameters) ? parameters : [parameters];
        const main = list.find((parameter) => parameter.seriesId === 'actual-main' || parameter.seriesName === config.actualSeriesLabel)
          ?? list.find((parameter) => parameter.seriesId === 'target-main' || parameter.seriesName === config.targetSeriesLabel);
        const ctx = tooltipContext(main?.dataIndex ?? -1, context);
        if (!ctx) return '';
        if (context.renderTooltip) {
          try { return context.renderTooltip(ctx); } catch { /* use string renderer */ }
        }
        if (context.buildTooltipHtml) {
          try { return context.buildTooltipHtml(ctx); } catch { /* use default */ }
        }
        return defaultTooltip(ctx, context);
      }
    },
    xAxis: {
      type: 'category', boundaryGap: false, data: categories, axisLabel: { interval: 0, fontSize: theme.axisLabelFontSize },
      name: config.showXAxisTitle ? config.xAxisTitle : undefined, nameLocation: 'middle', nameGap: 50,
      nameTextStyle: { fontSize: theme.xAxisTitleFontSize, fontWeight: theme.xAxisTitleFontWeight, color: theme.xAxisTitleColor }
    },
    yAxis: {
      type: 'value', min: bounds.min, max: bounds.max,
      axisLabel: {
        fontSize: theme.axisLabelFontSize,
        formatter: (value: number) => `${Number(value).toFixed(config.axisDecimalPlaces)}${config.valuePreset === 'percent' ? '%' : ''}`
      },
      name: config.showYAxisTitle ? config.yAxisTitle : undefined, nameLocation: 'middle', nameGap: 48, nameRotate: 90,
      nameTextStyle: { fontSize: theme.yAxisTitleFontSize, fontWeight: theme.yAxisTitleFontWeight, color: theme.yAxisTitleColor }
    }
  };
}

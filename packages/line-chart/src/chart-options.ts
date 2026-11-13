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
import { copyTarget, isTargetRange } from './target.js';
import { ENGLISH_LINE_CHART_MESSAGES, formatLineMessage } from './messages.js';
import { normalizeLineData } from './semantic-model.js';
import { renderCardHtml } from '../../chart-core/src/ui/card-content.js';

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
  message?: (key: string, values?: Record<string, unknown>) => string;
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

type YBounds = { max: number; min: number };

function semanticYValues(model: A11yLineChartSemanticModel): number[] {
  const values: number[] = [];
  for (const point of model.points) {
    if (!point.actualSuppressed && typeof point.actualValue === 'number') values.push(point.actualValue);
    const target = point.targetValue;
    if (isTargetRange(target)) values.push(target.min, target.max);
    else if (typeof target === 'number') values.push(target);
  }
  if (model.baseline && Number.isFinite(model.baseline.value)) values.push(model.baseline.value);
  return values.filter(Number.isFinite);
}

function minMax(values: number[]): { min: number; max: number } | undefined {
  if (values.length === 0) return undefined;
  let min = values[0]!;
  let max = min;
  for (let index = 1; index < values.length; index += 1) {
    min = Math.min(min, values[index]!);
    max = Math.max(max, values[index]!);
  }
  return { min, max };
}

function calculateZoomBounds(values: number[], config: ResolvedA11yLineChartConfig): YBounds | undefined {
  const fullRange = config.yAxisBaseMax - config.yAxisBaseMin;
  if (!Number.isFinite(fullRange) || fullRange <= 0 || values.length === 0) return undefined;
  const extent = minMax(values);
  if (!extent) return undefined;
  let { min: valueMin, max: valueMax } = extent;
  // Never zoom a value outside the caller's domain or return clipped/invalid bounds.
  if (valueMin < config.yAxisBaseMin || valueMax > config.yAxisBaseMax) return undefined;
  if (valueMin === valueMax) {
    const halfSpan = Math.max(Math.abs(valueMin), 1) * 0.1;
    valueMin = Math.max(config.yAxisBaseMin, valueMin - halfSpan);
    valueMax = Math.min(config.yAxisBaseMax, valueMax + halfSpan);
  }
  const range = valueMax - valueMin;
  if (!Number.isFinite(range) || range <= 0) return undefined;
  const roughStep = range / 5;
  const exponent = Math.floor(Math.log10(roughStep));
  const magnitude = 10 ** exponent;
  if (!Number.isFinite(roughStep) || roughStep <= 0 || !Number.isFinite(magnitude) || magnitude <= 0) return undefined;
  const fraction = roughStep / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  const step = niceFraction * magnitude;
  const padding = range * 0.06;
  const round = (value: number): number => Number(value.toPrecision(12));
  const min = Math.max(config.yAxisBaseMin, round(Math.floor((valueMin - padding) / step) * step));
  const max = Math.min(config.yAxisBaseMax, round(Math.ceil((valueMax + padding) / step) * step));
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return undefined;
  return { min, max };
}

/** Offer a zoom only for a real spread that would use at most half the configured domain. */
export function shouldSuggestYAxisZoom(config: ResolvedA11yLineChartConfig, model: A11yLineChartSemanticModel): boolean {
  const values = semanticYValues(model);
  if (values.length < 2) return false;
  const extent = minMax(values);
  if (!extent) return false;
  const { min: valueMin, max: valueMax } = extent;
  if (!Number.isFinite(valueMax - valueMin) || valueMax <= valueMin) return false;
  const bounds = calculateZoomBounds(values, config);
  const fullRange = config.yAxisBaseMax - config.yAxisBaseMin;
  return bounds !== undefined && Number.isFinite(fullRange) && (bounds.max - bounds.min) / fullRange <= 0.5;
}

function calculateYBounds(config: ResolvedA11yLineChartConfig, model: A11yLineChartSemanticModel): YBounds {
  const full = { min: config.yAxisBaseMin, max: config.yAxisBaseMax };
  if (!config.initialZoomY) return full;
  return calculateZoomBounds(semanticYValues(model), config) ?? full;
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
      ? context.message?.('tooltipDifferenceEqual', { actual: context.config.actualSeriesLabel, target: context.config.targetSeriesLabel.toLocaleLowerCase() }) ?? `${context.config.actualSeriesLabel} equals ${context.config.targetSeriesLabel.toLocaleLowerCase()}`
      : context.message?.('tooltipDifference', { actual: context.config.actualSeriesLabel, description: interpretation.targetDifference.description }) ?? `${context.config.actualSeriesLabel} is ${interpretation.targetDifference.description}`
    : '';
  // The raw author datum may hold a suppressed zero; expose the model's masked actual instead.
  const copiedDatum: A11yLineChartDatum = { x: datum.x instanceof Date ? new Date(datum.x.getTime()) : datum.x, actual: interpretation.actualValue, target: copyTarget(datum.target) };
  const copiedInterpretation = {
    ...interpretation,
    x: interpretation.x instanceof Date ? new Date(interpretation.x.getTime()) : interpretation.x,
    targetValue: copyTarget(interpretation.targetValue),
    targetDifference: interpretation.targetDifference ? { ...interpretation.targetDifference } : null,
    baseline: interpretation.baseline ? {
      ...interpretation.baseline,
      x: interpretation.baseline.x instanceof Date ? new Date(interpretation.baseline.x.getTime()) : interpretation.baseline.x,
      difference: interpretation.baseline.difference ? { ...interpretation.baseline.difference } : null
    } : null
  };
  return {
    datum: copiedDatum,
    index,
    interpretation: copiedInterpretation,
    xLabel: interpretation.xLabel,
    year: datum.x instanceof Date ? interpretation.xLabel : datum.x,
    actualValue: interpretation.actualValue,
    targetValue: copyTarget(interpretation.targetValue),
    actualFormatted: interpretation.actualFormatted,
    targetFormatted: interpretation.targetFormatted,
    actualLabel: interpretation.actualFormatted,
    targetLabel: interpretation.targetFormatted,
    diffPercent: interpretation.targetDifference?.absoluteValue ?? null,
    diffFormatted: interpretation.targetDifference?.formatted ?? null,
    differenceLabel,
    relation: interpretation.relation,
    relationLabel: interpretation.outcome === 'unavailable' ? '' : interpretation.outcomeLabel,
    actualSuppressed: interpretation.actualSuppressed,
    theme: { ...context.theme }
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
  const trendSymbol = direction === 'up' ? theme.trendUpSymbol : direction === 'down' ? theme.trendDownSymbol : theme.trendEqualSymbol;
  const defaultAria = ctx.interpretation.narrative;
  let aria = defaultAria;
  try { aria = context.buildTooltipAriaLabel?.(ctx) || defaultAria; } catch { /* use default */ }
  const message = (key: keyof typeof ENGLISH_LINE_CHART_MESSAGES, values: Record<string, unknown>): string =>
    context.message?.(key, values) ?? formatLineMessage(ENGLISH_LINE_CHART_MESSAGES[key], values);
  const status = !hasBoth ? undefined : config.trendMode === 'arrows'
    ? { text: trendSymbol, className: `perf-tooltip__trend perf-tooltip__trend--${direction}`, ariaHidden: true }
    : { text: ctx.relationLabel, className: 'perf-tooltip__status', ariaHidden: true };
  return renderCardHtml({
    heading: message('tooltipHeader', { period: ctx.xLabel }),
    role: 'group', ariaLabel: aria, titleTag: 'div',
    rows: [
      { text: message('tooltipActual', { series: config.actualSeriesLabel, value: ctx.actualFormatted }) },
      { text: message('tooltipTarget', { series: config.targetSeriesLabel, value: ctx.targetFormatted }) }
    ],
    ...(ctx.differenceLabel ? { description: message('tooltipDifferenceText', { description: ctx.differenceLabel }) } : {}),
    ...(status ? { status } : {}),
    visuallyHidden: !config.showTooltipVisual
  }, {
    root: 'perf-tooltip', visuallyHidden: 'perf-tooltip--visually-hidden',
    header: 'perf-tooltip__year', heading: 'perf-tooltip__heading', title: 'perf-tooltip__title',
    status: '', values: 'perf-tooltip__values', row: 'perf-tooltip__row', description: 'perf-tooltip__diff'
  });
}

export function buildChartOptions(context: ChartOptionContext): EChartsCoreOption {
  // Suppression is decided by the semantic model; points arrive with actualValue already masked.
  const data = normalizeLineData(context.data);
  const safeContext = { ...context, data };
  const { config, formatValue, formatXValue, reducedMotion, theme } = context;
  const categories = data.map((item) => formatXValue(item.x));
  let actual = context.model.points.map((point) => point.actualValue);
  const target = data.map((item) => isTargetRange(item.target) ? item.target.min : item.target ?? null);
  const scalarTarget = data.map((item) => isTargetRange(item.target) ? null : item.target ?? null);
  const rangeUpper = data.map((item) => isTargetRange(item.target) ? item.target.max : null);
  const hasRanges = data.some((item) => isTargetRange(item.target));
  if (config.autoDetectGaps) {
    let last = -1;
    actual.forEach((value, index) => { if (value !== null) last = index; });
    actual = actual.map((value, index) => index > last && last >= 0 ? null : value);
  }
  const bounds = calculateYBounds(config, safeContext.model);
  const series: Array<Record<string, unknown>> = [];
  const labelFormatter = (kind: 'actual' | 'target') => (parameter: { data?: number | null; dataIndex?: number }) => {
    const item = data[parameter.dataIndex ?? -1];
    return item ? kind === 'target'
      ? safeContext.model.points[parameter.dataIndex ?? -1]?.targetFormatted ?? ''
      : formatValue(parameter.data ?? null, kind, item.x) : '';
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
    id: 'target-area', name: config.targetSeriesLabel, type: 'line', data: scalarTarget, connectNulls: false, symbol: 'none',
    lineStyle: { width: 0 }, areaStyle: { color: areaColor('target', config, theme), opacity: theme.targetFillOpacity },
    silent: true, tooltip: { show: false }, z: 0
  });
  if (hasRanges) {
    const fill = areaColor('target', config, theme);
    series.push({
      id: 'target-range', name: config.targetSeriesLabel, type: 'custom',
      data: data.map((item, index) => isTargetRange(item.target) ? [index, item.target.min, item.target.max] : [index, null, null]),
      encode: { x: 0, y: [1, 2] }, clip: true,
      renderItem: (parameters: { dataIndex: number }, api: { coord: (value: number[]) => number[] }) => {
        const index = parameters.dataIndex;
        const range = data[index]?.target;
        if (!isTargetRange(range)) return;
        const lower = api.coord([index, range.min]);
        const upper = api.coord([index, range.max]);
        const next = data[index + 1]?.target;
        const children: Array<Record<string, unknown>> = [];
        // Only adjacent range rows form a band; missing and scalar rows break it.
        if (config.fillTarget && isTargetRange(next)) {
          children.push({
            type: 'polygon', transition: ['shape'], shape: { points: [lower, api.coord([index + 1, next.min]), api.coord([index + 1, next.max]), upper] },
            style: { fill, opacity: theme.targetFillOpacity }
          });
        }
        // A whisker also exposes both bounds for isolated or single-period ranges.
        children.push({
          type: 'line', transition: ['shape'], shape: { x1: lower[0], y1: lower[1], x2: upper[0], y2: upper[1] },
          style: { stroke: theme.targetColor, lineWidth: 2, lineDash: [4, 4] }
        });
        return { type: 'group', children };
      },
      itemStyle: { color: theme.targetColor }, silent: true, tooltip: { show: false }, z: 2
    });
    if (theme.targetLineOutlineWidth > theme.lineWidth) series.push({
      id: 'target-upper-outline', name: config.targetSeriesLabel, type: 'line', data: rangeUpper, connectNulls: false, symbol: 'none',
      lineStyle: { width: theme.targetLineOutlineWidth, color: theme.targetLineOutlineColor, cap: 'round', join: 'round' },
      silent: true, tooltip: { show: false }, z: 2
    });
    series.push({
      id: 'target-upper', name: config.targetSeriesLabel, type: 'line', data: rangeUpper, connectNulls: false,
      symbol: 'diamond', symbolSize: theme.targetSymbolSize,
      lineStyle: { color: theme.targetColor, type: 'dashed', width: theme.lineWidth },
      itemStyle: { color: theme.targetColor, borderColor: theme.pointBorderColor, borderWidth: theme.pointBorderWidth },
      label: { show: config.showTargetValues, formatter: labelFormatter('target'), position: 'top', color: theme.targetLabelColor, fontSize: theme.labelFontSize },
      labelLayout: ({ dataIndex }: { dataIndex?: number }) => ({
        align: dataIndex === 0 ? 'left' : dataIndex === data.length - 1 ? 'right' : 'center', hideOverlap: true
      }), z: 4
    });
  }
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
    label: { show: config.showTargetValues, formatter: (parameter: { data?: number | null; dataIndex?: number }) => isTargetRange(data[parameter.dataIndex ?? -1]?.target) ? '' : labelFormatter('target')(parameter), position: 'top', color: theme.targetLabelColor, fontSize: theme.labelFontSize }, z: 4
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
      data: [hasRanges ? { name: config.actualSeriesLabel, icon: 'circle', itemStyle: { color: theme.actualColor } } : config.actualSeriesLabel, hasRanges ? {
        name: config.targetSeriesLabel, icon: 'diamond', itemStyle: { color: theme.targetColor }
      } : config.targetSeriesLabel, ...(context.model.baseline ? [config.baselineSeriesLabel] : [])],
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
        const ctx = tooltipContext(main?.dataIndex ?? -1, safeContext);
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
        formatter: (value: number) => new Intl.NumberFormat(config.locale, {
          ...(config.valuePreset === 'percent' ? { style: 'percent' as const } : {}),
          minimumFractionDigits: config.axisDecimalPlaces,
          maximumFractionDigits: config.axisDecimalPlaces
        }).format(config.valuePreset === 'percent' ? Number(value) / 100 : Number(value))
      },
      name: config.showYAxisTitle ? config.yAxisTitle : undefined, nameLocation: 'middle', nameGap: 48, nameRotate: 90,
      nameTextStyle: { fontSize: theme.yAxisTitleFontSize, fontWeight: theme.yAxisTitleFontWeight, color: theme.yAxisTitleColor }
    }
  };
}

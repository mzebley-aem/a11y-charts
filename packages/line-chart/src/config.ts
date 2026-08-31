import type {
  A11yLineChartConfig,
  A11yLineChartPattern,
  A11yLineChartTheme
} from './model.js';

export type ResolvedA11yLineChartConfig = Omit<Required<A11yLineChartConfig>, 'maxWidth'> & {
  maxWidth?: number;
};

export type ResolvedA11yLineChartTheme = Required<A11yLineChartTheme>;

const DEFAULT_CONFIG: ResolvedA11yLineChartConfig = {
  actualSeriesLabel: 'Actual',
  actualPattern: 'none',
  announceChanges: true,
  autoDetectGaps: false,
  autoPerPointMaxWidth: false,
  autoPerPointMinWidth: false,
  axisDecimalPlaces: 0,
  baselineSeriesLabel: 'Baseline',
  contextNote: '',
  decimalPlaces: 0,
  describeMissingAs: 'Missing',
  dynamicMaxWidth: false,
  dynamicMinWidth: false,
  fillActual: true,
  fillTarget: true,
  headingLevel: 2,
  initialZoomY: false,
  locale: 'en-US',
  minWidth: 720,
  perPointMaxWidth: 110,
  perPointMinWidth: 70,
  positiveDirection: 'above',
  reducedMotion: 'auto',
  showActualLine: true,
  showActualValues: false,
  showControls: true,
  showTable: true,
  showTargetLine: true,
  showTargetValues: false,
  showTooltipVisual: true,
  showXAxisTitle: false,
  showYAxisTitle: false,
  stepperVisibility: 'auto',
  tableVisibility: 'screen-reader',
  targetSeriesLabel: 'Target',
  targetPattern: 'none',
  trendMode: 'labels',
  valuePreset: 'percent',
  wrapAround: false,
  xAxisTitle: 'Year',
  yAxisBaseMax: 100,
  yAxisBaseMin: 0,
  yAxisTitle: 'Percent'
};

const DEFAULT_THEME: ResolvedA11yLineChartTheme = {
  actualColor: '#1e62d0',
  actualEmphasisBorderColor: '#000000',
  actualEmphasisFillColor: '#1e62d0',
  actualFill: '#87b0ff',
  actualFillOpacity: 1,
  actualLabelColor: '#143e82',
  actualLineOutlineColor: '#ffffff',
  actualLineOutlineWidth: 6,
  actualPatternColor: '#1e62d0',
  actualPatternType: 'none',
  actualSymbolSize: 12,
  baselineColor: '#7d335f',
  baselineLabelColor: '#64264b',
  baselineLineType: 'dotted',
  baselineLineWidth: 2,
  baselineSymbolSize: 12,
  emphasisBorderColor: '#000000',
  emphasisBorderWidth: 2,
  focusLineColor: 'rgba(0,0,0,0.45)',
  focusLineType: 'dashed',
  focusLineWidth: 1,
  axisLabelFontSize: 12,
  labelFontSize: 11,
  legendFontSize: 12,
  lineWidth: 4,
  pointBorderColor: '#ffffff',
  pointBorderWidth: 2,
  pointShadowBlur: 4,
  pointShadowColor: 'rgba(0,0,0,0.25)',
  targetColor: '#765f00',
  targetEmphasisBorderColor: '#000000',
  targetEmphasisFillColor: '#765f00',
  targetFill: '#e8dca4',
  targetFillOpacity: 1,
  targetLabelColor: '#6d5a00',
  targetLineOutlineColor: '#ffffff',
  targetLineOutlineWidth: 6,
  targetPatternColor: '#765f00',
  targetPatternType: 'none',
  targetSymbolSize: 14,
  trendDownColor: '#c62828',
  trendDownSymbol: '↓',
  trendEqualColor: '#444444',
  trendEqualSymbol: '=',
  trendUpColor: '#148f2a',
  trendUpSymbol: '↑',
  xAxisTitleColor: '#222222',
  xAxisTitleFontSize: 12,
  xAxisTitleFontWeight: 600,
  yAxisTitleColor: '#222222',
  yAxisTitleFontSize: 12,
  yAxisTitleFontWeight: 600
};

function finiteOrDefault(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function positiveOrDefault(value: number | undefined, fallback: number): number {
  const resolved = finiteOrDefault(value, fallback);
  return resolved > 0 ? resolved : fallback;
}

function opacityOrDefault(value: number | undefined, fallback: number): number {
  return Math.min(1, Math.max(0, finiteOrDefault(value, fallback)));
}

function integerOrDefault(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.round(finiteOrDefault(value, fallback)));
}

function textOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function resolveConfig(config: A11yLineChartConfig): ResolvedA11yLineChartConfig {
  const yAxisBaseMin = finiteOrDefault(config.yAxisBaseMin, DEFAULT_CONFIG.yAxisBaseMin);
  const requestedMax = finiteOrDefault(config.yAxisBaseMax, DEFAULT_CONFIG.yAxisBaseMax);

  return {
    ...DEFAULT_CONFIG,
    ...config,
    actualSeriesLabel: textOrDefault(config.actualSeriesLabel, DEFAULT_CONFIG.actualSeriesLabel),
    axisDecimalPlaces: integerOrDefault(config.axisDecimalPlaces, DEFAULT_CONFIG.axisDecimalPlaces),
    baselineSeriesLabel: textOrDefault(config.baselineSeriesLabel, DEFAULT_CONFIG.baselineSeriesLabel),
    contextNote: typeof config.contextNote === 'string' ? config.contextNote.trim() : '',
    decimalPlaces: integerOrDefault(config.decimalPlaces, DEFAULT_CONFIG.decimalPlaces),
    describeMissingAs: textOrDefault(config.describeMissingAs, DEFAULT_CONFIG.describeMissingAs),
    locale: textOrDefault(config.locale, DEFAULT_CONFIG.locale),
    minWidth: positiveOrDefault(config.minWidth, DEFAULT_CONFIG.minWidth),
    perPointMaxWidth: positiveOrDefault(config.perPointMaxWidth, DEFAULT_CONFIG.perPointMaxWidth),
    perPointMinWidth: positiveOrDefault(config.perPointMinWidth, DEFAULT_CONFIG.perPointMinWidth),
    positiveDirection: config.positiveDirection === 'below' ? 'below' : 'above',
    stepperVisibility: config.stepperVisibility === 'always' || config.stepperVisibility === 'never'
      ? config.stepperVisibility
      : 'auto',
    tableVisibility: config.tableVisibility ?? (config.showTable === false ? 'hidden' : DEFAULT_CONFIG.tableVisibility),
    targetSeriesLabel: textOrDefault(config.targetSeriesLabel, DEFAULT_CONFIG.targetSeriesLabel),
    valuePreset: config.valuePreset === 'number' ? 'number' : 'percent',
    xAxisTitle: textOrDefault(config.xAxisTitle, DEFAULT_CONFIG.xAxisTitle),
    yAxisBaseMax: requestedMax > yAxisBaseMin ? requestedMax : yAxisBaseMin + 1,
    yAxisBaseMin,
    yAxisTitle: textOrDefault(config.yAxisTitle, DEFAULT_CONFIG.yAxisTitle)
  };
}

function cssValue(host: Element | undefined, name: string): string {
  if (!host || typeof getComputedStyle === 'undefined') return '';
  try {
    return getComputedStyle(host).getPropertyValue(name).trim();
  } catch {
    return '';
  }
}

function resolveText(
  host: Element | undefined,
  input: string | undefined,
  cssName: string,
  fallback: string
): string {
  if (input?.trim()) {
    const value = input.trim();
    const match = value.match(/^var\((--[^,\s)]+)/);
    if (match) return cssValue(host, match[1]!) || fallback;
    if (value.startsWith('--')) return cssValue(host, value) || fallback;
    return value;
  }
  return cssValue(host, cssName).replace(/^['\"]|['\"]$/g, '') || fallback;
}

function resolveNumber(
  host: Element | undefined,
  input: number | undefined,
  cssName: string,
  fallback: number
): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const parsed = Number.parseFloat(cssValue(host, cssName).replace(/px$/, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveWeight(
  host: Element | undefined,
  input: number | string | undefined,
  cssName: string,
  fallback: number | string
): number | string {
  if (input !== undefined && String(input).trim()) return input;
  const value = resolveText(host, undefined, cssName, String(fallback));
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? value : parsed;
}

function pattern(value: string, fallback: A11yLineChartPattern): A11yLineChartPattern {
  return value === 'diagonal' || value === 'dots' || value === 'horizontal' || value === 'none'
    ? value
    : fallback;
}

export function resolveTheme(theme: A11yLineChartTheme, host?: Element): ResolvedA11yLineChartTheme {
  const color = (key: keyof A11yLineChartTheme, cssName: string): string =>
    resolveText(host, theme[key] as string | undefined, cssName, DEFAULT_THEME[key] as string);
  const number = (key: keyof A11yLineChartTheme, cssName: string): number =>
    resolveNumber(host, theme[key] as number | undefined, cssName, DEFAULT_THEME[key] as number);

  return {
    actualColor: color('actualColor', '--a11y-line-chart-actual-color'),
    actualEmphasisBorderColor: color('actualEmphasisBorderColor', '--a11y-line-chart-actual-emphasis-border-color'),
    actualEmphasisFillColor: color('actualEmphasisFillColor', '--a11y-line-chart-actual-emphasis-fill-color'),
    actualFill: color('actualFill', '--a11y-line-chart-actual-fill'),
    actualFillOpacity: opacityOrDefault(number('actualFillOpacity', '--a11y-line-chart-actual-fill-opacity'), 1),
    actualLabelColor: color('actualLabelColor', '--a11y-line-chart-actual-label-color'),
    actualLineOutlineColor: color('actualLineOutlineColor', '--a11y-line-chart-actual-line-outline-color'),
    actualLineOutlineWidth: number('actualLineOutlineWidth', '--a11y-line-chart-actual-line-outline-width'),
    actualPatternColor: color('actualPatternColor', '--a11y-line-chart-actual-pattern-color'),
    actualPatternType: pattern(resolveText(host, theme.actualPatternType, '--a11y-line-chart-actual-pattern-type', 'none'), 'none'),
    actualSymbolSize: number('actualSymbolSize', '--a11y-line-chart-actual-symbol-size'),
    baselineColor: color('baselineColor', '--a11y-line-chart-baseline-color'),
    baselineLabelColor: color('baselineLabelColor', '--a11y-line-chart-baseline-label-color'),
    baselineLineType: resolveText(host, theme.baselineLineType, '--a11y-line-chart-baseline-line-type', 'dotted') as ResolvedA11yLineChartTheme['baselineLineType'],
    baselineLineWidth: number('baselineLineWidth', '--a11y-line-chart-baseline-line-width'),
    baselineSymbolSize: number('baselineSymbolSize', '--a11y-line-chart-baseline-symbol-size'),
    emphasisBorderColor: color('emphasisBorderColor', '--a11y-line-chart-emphasis-border-color'),
    emphasisBorderWidth: number('emphasisBorderWidth', '--a11y-line-chart-emphasis-border-width'),
    focusLineColor: color('focusLineColor', '--a11y-line-chart-focus-line-color'),
    focusLineType: resolveText(host, theme.focusLineType, '--a11y-line-chart-focus-line-type', 'dashed') as ResolvedA11yLineChartTheme['focusLineType'],
    focusLineWidth: number('focusLineWidth', '--a11y-line-chart-focus-line-width'),
    axisLabelFontSize: number('axisLabelFontSize', '--a11y-line-chart-axis-label-font-size'),
    labelFontSize: number('labelFontSize', '--a11y-line-chart-label-font-size'),
    legendFontSize: number('legendFontSize', '--a11y-line-chart-legend-font-size'),
    lineWidth: number('lineWidth', '--a11y-line-chart-line-width'),
    pointBorderColor: color('pointBorderColor', '--a11y-line-chart-point-border-color'),
    pointBorderWidth: number('pointBorderWidth', '--a11y-line-chart-point-border-width'),
    pointShadowBlur: number('pointShadowBlur', '--a11y-line-chart-point-shadow-blur'),
    pointShadowColor: color('pointShadowColor', '--a11y-line-chart-point-shadow-color'),
    targetColor: color('targetColor', '--a11y-line-chart-target-color'),
    targetEmphasisBorderColor: color('targetEmphasisBorderColor', '--a11y-line-chart-target-emphasis-border-color'),
    targetEmphasisFillColor: color('targetEmphasisFillColor', '--a11y-line-chart-target-emphasis-fill-color'),
    targetFill: color('targetFill', '--a11y-line-chart-target-fill'),
    targetFillOpacity: opacityOrDefault(number('targetFillOpacity', '--a11y-line-chart-target-fill-opacity'), 1),
    targetLabelColor: color('targetLabelColor', '--a11y-line-chart-target-label-color'),
    targetLineOutlineColor: color('targetLineOutlineColor', '--a11y-line-chart-target-line-outline-color'),
    targetLineOutlineWidth: number('targetLineOutlineWidth', '--a11y-line-chart-target-line-outline-width'),
    targetPatternColor: color('targetPatternColor', '--a11y-line-chart-target-pattern-color'),
    targetPatternType: pattern(resolveText(host, theme.targetPatternType, '--a11y-line-chart-target-pattern-type', 'none'), 'none'),
    targetSymbolSize: number('targetSymbolSize', '--a11y-line-chart-target-symbol-size'),
    trendDownColor: color('trendDownColor', '--a11y-line-chart-trend-down-color'),
    trendDownSymbol: color('trendDownSymbol', '--a11y-line-chart-trend-down-symbol'),
    trendEqualColor: color('trendEqualColor', '--a11y-line-chart-trend-equal-color'),
    trendEqualSymbol: color('trendEqualSymbol', '--a11y-line-chart-trend-equal-symbol'),
    trendUpColor: color('trendUpColor', '--a11y-line-chart-trend-up-color'),
    trendUpSymbol: color('trendUpSymbol', '--a11y-line-chart-trend-up-symbol'),
    xAxisTitleColor: color('xAxisTitleColor', '--a11y-line-chart-x-axis-title-color'),
    xAxisTitleFontSize: number('xAxisTitleFontSize', '--a11y-line-chart-x-axis-title-font-size'),
    xAxisTitleFontWeight: resolveWeight(host, theme.xAxisTitleFontWeight, '--a11y-line-chart-x-axis-title-font-weight', 600),
    yAxisTitleColor: color('yAxisTitleColor', '--a11y-line-chart-y-axis-title-color'),
    yAxisTitleFontSize: number('yAxisTitleFontSize', '--a11y-line-chart-y-axis-title-font-size'),
    yAxisTitleFontWeight: resolveWeight(host, theme.yAxisTitleFontWeight, '--a11y-line-chart-y-axis-title-font-weight', 600)
  };
}

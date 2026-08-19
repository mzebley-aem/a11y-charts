export type A11yLineChartXValue = string | number | Date;

export interface A11yLineChartDatum {
  x: A11yLineChartXValue;
  actual?: number | null;
  target?: number | null;
}

export interface A11yLineChartLegacyDatum {
  year: string | number;
  actual?: number | null;
  target?: number | null;
}

export type A11yLineChartValuePreset = 'number' | 'percent';
export type A11yLineChartPattern = 'diagonal' | 'dots' | 'horizontal' | 'none';
export type A11yLineChartTableVisibility = 'hidden' | 'screen-reader' | 'visible';
export type A11yLineChartTrendMode = 'labels' | 'arrows';
export type A11yLineChartPositiveDirection = 'above' | 'below';
export type A11yLineChartRelation = 'above' | 'below' | 'equal' | 'incomplete';

export interface A11yLineChartFormatContext {
  value: number | null;
  series: 'actual' | 'target';
  x: A11yLineChartXValue;
  locale: string;
}

export type A11yLineChartValueFormatter = (context: A11yLineChartFormatContext) => string;
export type A11yLineChartAxisFormatter = (value: number, locale: string) => string;
export type A11yLineChartXFormatter = (value: A11yLineChartXValue, locale: string) => string;

export interface A11yLineChartTooltipContext {
  datum: A11yLineChartDatum;
  index: number;
  xLabel: string;
  year: string | number;
  actualValue: number | null;
  targetValue: number | null;
  actualFormatted: string;
  targetFormatted: string;
  actualLabel: string;
  targetLabel: string;
  diffPercent: number | null;
  diffFormatted: string | null;
  differenceLabel: string;
  relation: A11yLineChartRelation;
  relationLabel: string;
  theme: Required<A11yLineChartTheme>;
}

export type A11yLineChartTooltipHtmlBuilder = (context: A11yLineChartTooltipContext) => string;
export type A11yLineChartTooltipAriaLabelBuilder = (context: A11yLineChartTooltipContext) => string;
export type A11yLineChartTooltipRenderer = (context: A11yLineChartTooltipContext) => HTMLElement;

export interface A11yLineChartConfig {
  actualPattern?: A11yLineChartPattern;
  announceChanges?: boolean;
  autoPerPointMaxWidth?: boolean;
  autoPerPointMinWidth?: boolean;
  autoDetectGaps?: boolean;
  axisDecimalPlaces?: number;
  decimalPlaces?: number;
  describeMissingAs?: string;
  dynamicMaxWidth?: boolean;
  dynamicMinWidth?: boolean;
  equalLabel?: string;
  fillActual?: boolean;
  fillTarget?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  initialZoomY?: boolean;
  locale?: string;
  maxWidth?: number;
  minWidth?: number;
  negativeLabel?: string;
  positiveDirection?: A11yLineChartPositiveDirection;
  positiveLabel?: string;
  perPointMaxWidth?: number;
  perPointMinWidth?: number;
  reducedMotion?: 'always' | 'auto' | 'never';
  showActualLine?: boolean;
  showActualValues?: boolean;
  showControls?: boolean;
  showTable?: boolean;
  showTargetLine?: boolean;
  showTargetValues?: boolean;
  showTooltipVisual?: boolean;
  showXAxisTitle?: boolean;
  showYAxisTitle?: boolean;
  tableVisibility?: A11yLineChartTableVisibility;
  targetPattern?: A11yLineChartPattern;
  trendMode?: A11yLineChartTrendMode;
  valuePreset?: A11yLineChartValuePreset;
  wrapAround?: boolean;
  xAxisTitle?: string;
  yAxisBaseMax?: number;
  yAxisBaseMin?: number;
  yAxisTitle?: string;
}

export interface A11yLineChartTheme {
  actualColor?: string;
  actualEmphasisBorderColor?: string;
  actualEmphasisFillColor?: string;
  actualFill?: string;
  actualFillOpacity?: number;
  actualLabelColor?: string;
  actualLineOutlineColor?: string;
  actualLineOutlineWidth?: number;
  actualPatternColor?: string;
  actualPatternType?: A11yLineChartPattern;
  actualSymbolSize?: number;
  emphasisBorderColor?: string;
  emphasisBorderWidth?: number;
  focusLineColor?: string;
  focusLineType?: 'solid' | 'dashed' | 'dotted';
  focusLineWidth?: number;
  labelFontSize?: number;
  lineWidth?: number;
  pointBorderColor?: string;
  pointBorderWidth?: number;
  pointShadowBlur?: number;
  pointShadowColor?: string;
  targetColor?: string;
  targetEmphasisBorderColor?: string;
  targetEmphasisFillColor?: string;
  targetFill?: string;
  targetFillOpacity?: number;
  targetLabelColor?: string;
  targetLineOutlineColor?: string;
  targetLineOutlineWidth?: number;
  targetPatternColor?: string;
  targetPatternType?: A11yLineChartPattern;
  targetSymbolSize?: number;
  trendDownColor?: string;
  trendDownSymbol?: string;
  trendEqualColor?: string;
  trendEqualSymbol?: string;
  trendUpColor?: string;
  trendUpSymbol?: string;
  xAxisTitleColor?: string;
  xAxisTitleFontSize?: number;
  xAxisTitleFontWeight?: number | string;
  yAxisTitleColor?: string;
  yAxisTitleFontSize?: number;
  yAxisTitleFontWeight?: number | string;
}

export interface A11yLineChartConfigChangeDetail {
  config: Readonly<A11yLineChartConfig>;
  source: 'controls';
}

export interface A11yLineChartPointChangeDetail {
  actual: number | null;
  announcement: string;
  index: number;
  target: number | null;
  x: A11yLineChartXValue;
}

export interface A11yLineChartErrorDetail {
  code: 'invalid-data';
  message: string;
}

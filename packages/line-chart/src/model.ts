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
export type A11yLineChartStepperVisibility = 'always' | 'auto' | 'never';
export type A11yLineChartTrendMode = 'labels' | 'arrows';
export type A11yLineChartPositiveDirection = 'above' | 'below';
export type A11yLineChartRelation = 'above' | 'below' | 'equal' | 'incomplete';
export type A11yLineChartOutcome = 'met' | 'met-equal' | 'not-met' | 'unavailable';
export type A11yLineChartSeries = 'actual' | 'target' | 'baseline';

export interface A11yLineChartBaseline {
  explanation?: string;
  value: number;
  x: A11yLineChartXValue;
}

export interface A11yLineChartFormatContext {
  value: number | null;
  series: A11yLineChartSeries;
  x: A11yLineChartXValue;
  locale: string;
}

export type A11yLineChartValueFormatter = (context: A11yLineChartFormatContext) => string;
export type A11yLineChartAxisFormatter = (value: number, locale: string) => string;
export type A11yLineChartXFormatter = (value: A11yLineChartXValue, locale: string) => string;

export interface A11yLineChartDifferenceFormatContext {
  comparison: 'baseline' | 'target';
  locale: string;
  value: number;
  valuePreset: A11yLineChartValuePreset;
  x: A11yLineChartXValue;
}

export type A11yLineChartDifferenceFormatter = (
  context: A11yLineChartDifferenceFormatContext
) => string;

export interface A11yLineChartSemanticDifference {
  absoluteValue: number;
  description: string;
  formatted: string;
  relation: Exclude<A11yLineChartRelation, 'incomplete'>;
  signedValue: number;
}

export interface A11yLineChartBaselineInterpretation {
  difference: A11yLineChartSemanticDifference | null;
  explanation: string;
  formatted: string;
  value: number;
  x: A11yLineChartXValue;
  xLabel: string;
}

export interface A11yLineChartPointInterpretation {
  actualFormatted: string;
  actualValue: number | null;
  baseline: A11yLineChartBaselineInterpretation | null;
  index: number;
  narrative: string;
  outcome: A11yLineChartOutcome;
  outcomeLabel: string;
  position: number;
  relation: A11yLineChartRelation;
  targetDifference: A11yLineChartSemanticDifference | null;
  targetFormatted: string;
  targetValue: number | null;
  total: number;
  x: A11yLineChartXValue;
  xLabel: string;
}

export interface A11yLineChartSummary {
  comparableCount: number;
  latestActualIndex: number | null;
  metCount: number;
  primary: string;
  supporting: string[];
  text: string;
}

export interface A11yLineChartSemanticModel {
  baseline: A11yLineChartBaselineInterpretation | null;
  points: A11yLineChartPointInterpretation[];
  summary: A11yLineChartSummary;
}

export interface A11yLineChartTooltipContext {
  datum: A11yLineChartDatum;
  index: number;
  interpretation: A11yLineChartPointInterpretation;
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
  actualSeriesLabel?: string;
  actualPattern?: A11yLineChartPattern;
  announceChanges?: boolean;
  autoPerPointMaxWidth?: boolean;
  autoPerPointMinWidth?: boolean;
  autoDetectGaps?: boolean;
  axisDecimalPlaces?: number;
  baselineSeriesLabel?: string;
  contextNote?: string;
  decimalPlaces?: number;
  describeMissingAs?: string;
  dynamicMaxWidth?: boolean;
  dynamicMinWidth?: boolean;
  fillActual?: boolean;
  fillTarget?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  initialZoomY?: boolean;
  locale?: string;
  maxWidth?: number;
  minWidth?: number;
  positiveDirection?: A11yLineChartPositiveDirection;
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
  stepperVisibility?: A11yLineChartStepperVisibility;
  tableVisibility?: A11yLineChartTableVisibility;
  targetSeriesLabel?: string;
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
  baselineColor?: string;
  baselineLabelColor?: string;
  baselineLineType?: 'solid' | 'dashed' | 'dotted';
  baselineLineWidth?: number;
  baselineSymbolSize?: number;
  emphasisBorderColor?: string;
  emphasisBorderWidth?: number;
  focusLineColor?: string;
  focusLineType?: 'solid' | 'dashed' | 'dotted';
  focusLineWidth?: number;
  axisLabelFontSize?: number;
  labelFontSize?: number;
  legendFontSize?: number;
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
  source: 'controls' | 'legend';
}

export interface A11yLineChartPointChangeDetail {
  actual: number | null;
  announcement: string;
  baselineDifference: A11yLineChartSemanticDifference | null;
  index: number;
  outcome: A11yLineChartOutcome;
  outcomeLabel: string;
  target: number | null;
  targetDifference: A11yLineChartSemanticDifference | null;
  x: A11yLineChartXValue;
}

export interface A11yLineChartErrorDetail {
  code: 'invalid-baseline' | 'invalid-data';
  message: string;
}

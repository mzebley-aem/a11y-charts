export type A11yLineChartXValue = string | number | Date;

/** An inclusive target interval. Both bounds must be finite and min <= max. */
export interface A11yLineChartTargetRange {
  min: number;
  max: number;
}

export type A11yLineChartTarget = number | A11yLineChartTargetRange;

export interface A11yLineChartDatum {
  x: A11yLineChartXValue;
  actual?: number | null;
  target?: A11yLineChartTarget | null;
}

export interface A11yLineChartLegacyDatum {
  year: string | number;
  actual?: number | null;
  target?: A11yLineChartTarget | null;
}

export type A11yLineChartValuePreset = 'number' | 'percent';
export type A11yLineChartPattern = 'diagonal' | 'dots' | 'horizontal' | 'none';
export type A11yLineChartDataView = 'dialog' | 'inline' | 'none';
export type A11yLineChartPercentScale = 'whole' | 'fraction';
export type A11yLineChartStepperVisibility = 'always' | 'auto' | 'never';
export type A11yLineChartTrendMode = 'labels' | 'arrows';
export type A11yLineChartPositiveDirection = 'above' | 'below';
export type A11yLineChartRelation = 'above' | 'below' | 'equal' | 'within' | 'incomplete';
export type A11yLineChartOutcome = 'met' | 'met-equal' | 'not-met' | 'unavailable';
export type A11yLineChartSeries = 'actual' | 'target' | 'baseline';

export interface A11yLineChartBaseline {
  explanation?: string;
  value: number;
  x: A11yLineChartXValue;
}

export interface A11yLineChartFormatContext {
  value: number;
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
  actualSuppressed: boolean;
  baseline: A11yLineChartBaselineInterpretation | null;
  index: number;
  narrative: string;
  outcome: A11yLineChartOutcome;
  outcomeLabel: string;
  position: number;
  relation: A11yLineChartRelation;
  targetDifference: A11yLineChartSemanticDifference | null;
  targetFormatted: string;
  targetValue: A11yLineChartTarget | null;
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
  targetValue: A11yLineChartTarget | null;
  actualFormatted: string;
  targetFormatted: string;
  actualLabel: string;
  targetLabel: string;
  diffPercent: number | null;
  diffFormatted: string | null;
  differenceLabel: string;
  relation: A11yLineChartRelation;
  relationLabel: string;
  actualSuppressed?: boolean;
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
  dataView?: A11yLineChartDataView;
  dynamicMinWidth?: boolean;
  fillActual?: boolean;
  fillTarget?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  initialZoomY?: boolean;
  locale?: string;
  maxWidth?: number;
  minWidth?: number;
  percentScale?: A11yLineChartPercentScale;
  positiveDirection?: A11yLineChartPositiveDirection;
  perPointMaxWidth?: number;
  perPointMinWidth?: number;
  reducedMotion?: 'always' | 'auto' | 'never';
  showActualLine?: boolean;
  showActions?: boolean;
  showActualValues?: boolean;
  showContext?: boolean;
  showControls?: boolean;
  showExplanation?: boolean;
  showExport?: boolean;
  showGlossary?: boolean;
  showSummary?: boolean;
  showTargetLine?: boolean;
  showTargetValues?: boolean;
  showTooltipVisual?: boolean;
  showXAxisTitle?: boolean;
  showYAxisTitle?: boolean;
  stepperVisibility?: A11yLineChartStepperVisibility;
  targetSeriesLabel?: string;
  explanationExpanded?: boolean;
  glossaryExpanded?: boolean;
  targetPattern?: A11yLineChartPattern;
  trendMode?: A11yLineChartTrendMode;
  valuePreset?: A11yLineChartValuePreset;
  wrapAround?: boolean;
  xAxisTitle?: string;
  yAxisBaseMax?: number;
  yAxisBaseMin?: number;
  yAxisTitle?: string;
}

import type { A11yLineChartMessages } from './messages.js';
export type { A11yLineChartMessageKey, A11yLineChartMessages } from './messages.js';

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

export interface A11yLineChartSettingsChangeDetail {
  setting: keyof A11yLineChartConfig;
  value: A11yLineChartConfig[keyof A11yLineChartConfig];
  source: 'controls' | 'legend';
}

export interface A11yLineChartPointChangeDetail {
  actual: number | null;
  actualSuppressed: boolean;
  announcement: string;
  baselineDifference: A11yLineChartSemanticDifference | null;
  index: number;
  outcome: A11yLineChartOutcome;
  outcomeLabel: string;
  target: A11yLineChartTarget | null;
  targetDifference: A11yLineChartSemanticDifference | null;
  x: A11yLineChartXValue;
}

export interface A11yLineChartErrorDetail {
  code: 'invalid-baseline' | 'invalid-data' | 'invalid-messages';
  message: string;
}

export interface A11yLineChartDefinition { id: string; label: string; definition: string; }
export interface A11yLineChartDataViewChangeDetail { open: boolean; dataView: 'dialog' | 'inline'; }
export interface A11yLineChartDisclosureChangeDetail { disclosure: 'explanation' | 'glossary'; expanded: boolean; }
/** Emitted after initial render only when normalized data or its baseline changes. */
export interface A11yLineChartDataChangeDetail { data: A11yLineChartDatum[]; model: A11yLineChartSemanticModel | null; }

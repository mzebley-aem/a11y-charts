export type A11yTargetLineChartXValue = string | number | Date;

/** An inclusive target interval. Both bounds must be finite and min <= max. */
export interface A11yTargetLineChartTargetRange {
  min: number;
  max: number;
}

export type A11yTargetLineChartTarget = number | A11yTargetLineChartTargetRange;

export interface A11yTargetLineChartDatum {
  x: A11yTargetLineChartXValue;
  actual?: number | null;
  target?: A11yTargetLineChartTarget | null;
}

export interface A11yTargetLineChartLegacyDatum {
  year: string | number;
  actual?: number | null;
  target?: A11yTargetLineChartTarget | null;
}

export type A11yTargetLineChartValuePreset = 'number' | 'percent';
export type A11yTargetLineChartPattern = 'diagonal' | 'dots' | 'horizontal' | 'none';
export type A11yTargetLineChartDataView = 'dialog' | 'inline' | 'none';
export type A11yTargetLineChartPercentScale = 'whole' | 'fraction';
export type A11yTargetLineChartStepperVisibility = 'always' | 'auto' | 'never';
export type A11yTargetLineChartTrendMode = 'labels' | 'arrows';
export type A11yTargetLineChartPositiveDirection = 'above' | 'below';
export type A11yTargetLineChartRelation = 'above' | 'below' | 'equal' | 'within' | 'incomplete';
export type A11yTargetLineChartOutcome = 'met' | 'met-equal' | 'not-met' | 'unavailable';
export type A11yTargetLineChartSeries = 'actual' | 'target' | 'baseline';

export interface A11yTargetLineChartBaseline {
  explanation?: string;
  value: number;
  x: A11yTargetLineChartXValue;
}

export interface A11yTargetLineChartFormatContext {
  value: number;
  series: A11yTargetLineChartSeries;
  x: A11yTargetLineChartXValue;
  locale: string;
}

export type A11yTargetLineChartValueFormatter = (context: A11yTargetLineChartFormatContext) => string;
export type A11yTargetLineChartAxisFormatter = (value: number, locale: string) => string;
export type A11yTargetLineChartXFormatter = (value: A11yTargetLineChartXValue, locale: string) => string;

export interface A11yTargetLineChartDifferenceFormatContext {
  comparison: 'baseline' | 'target';
  locale: string;
  value: number;
  valuePreset: A11yTargetLineChartValuePreset;
  x: A11yTargetLineChartXValue;
}

export type A11yTargetLineChartDifferenceFormatter = (
  context: A11yTargetLineChartDifferenceFormatContext
) => string;

export interface A11yTargetLineChartSemanticDifference {
  absoluteValue: number;
  description: string;
  formatted: string;
  relation: Exclude<A11yTargetLineChartRelation, 'incomplete'>;
  signedValue: number;
}

export interface A11yTargetLineChartBaselineInterpretation {
  difference: A11yTargetLineChartSemanticDifference | null;
  explanation: string;
  formatted: string;
  value: number;
  x: A11yTargetLineChartXValue;
  xLabel: string;
}

export interface A11yTargetLineChartPointInterpretation {
  actualFormatted: string;
  actualValue: number | null;
  actualSuppressed: boolean;
  baseline: A11yTargetLineChartBaselineInterpretation | null;
  index: number;
  narrative: string;
  outcome: A11yTargetLineChartOutcome;
  outcomeLabel: string;
  position: number;
  relation: A11yTargetLineChartRelation;
  targetDifference: A11yTargetLineChartSemanticDifference | null;
  targetFormatted: string;
  targetValue: A11yTargetLineChartTarget | null;
  total: number;
  x: A11yTargetLineChartXValue;
  xLabel: string;
}

export interface A11yTargetLineChartSummary {
  comparableCount: number;
  latestActualIndex: number | null;
  metCount: number;
  primary: string;
  supporting: string[];
  text: string;
}

export interface A11yTargetLineChartSemanticModel {
  baseline: A11yTargetLineChartBaselineInterpretation | null;
  points: A11yTargetLineChartPointInterpretation[];
  summary: A11yTargetLineChartSummary;
}

export interface A11yTargetLineChartTooltipContext {
  datum: A11yTargetLineChartDatum;
  index: number;
  interpretation: A11yTargetLineChartPointInterpretation;
  xLabel: string;
  year: string | number;
  actualValue: number | null;
  targetValue: A11yTargetLineChartTarget | null;
  actualFormatted: string;
  targetFormatted: string;
  actualLabel: string;
  targetLabel: string;
  diffPercent: number | null;
  diffFormatted: string | null;
  differenceLabel: string;
  relation: A11yTargetLineChartRelation;
  relationLabel: string;
  actualSuppressed?: boolean;
  theme: Required<A11yTargetLineChartTheme>;
}

export type A11yTargetLineChartTooltipHtmlBuilder = (context: A11yTargetLineChartTooltipContext) => string;
export type A11yTargetLineChartTooltipAriaLabelBuilder = (context: A11yTargetLineChartTooltipContext) => string;
export type A11yTargetLineChartTooltipRenderer = (context: A11yTargetLineChartTooltipContext) => HTMLElement;

export interface A11yTargetLineChartConfig {
  actualSeriesLabel?: string;
  actualPattern?: A11yTargetLineChartPattern;
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
  dataView?: A11yTargetLineChartDataView;
  dynamicMinWidth?: boolean;
  fillActual?: boolean;
  fillTarget?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  initialZoomY?: boolean;
  locale?: string;
  maxWidth?: number;
  minWidth?: number;
  percentScale?: A11yTargetLineChartPercentScale;
  positiveDirection?: A11yTargetLineChartPositiveDirection;
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
  stepperVisibility?: A11yTargetLineChartStepperVisibility;
  targetSeriesLabel?: string;
  explanationExpanded?: boolean;
  glossaryExpanded?: boolean;
  targetPattern?: A11yTargetLineChartPattern;
  trendMode?: A11yTargetLineChartTrendMode;
  valuePreset?: A11yTargetLineChartValuePreset;
  wrapAround?: boolean;
  xAxisTitle?: string;
  yAxisBaseMax?: number;
  yAxisBaseMin?: number;
  yAxisTitle?: string;
}

import type { A11yTargetLineChartMessages } from './messages.js';
export type { A11yTargetLineChartMessageKey, A11yTargetLineChartMessages } from './messages.js';

export interface A11yTargetLineChartTheme {
  actualColor?: string;
  actualEmphasisBorderColor?: string;
  actualEmphasisFillColor?: string;
  actualFill?: string;
  actualFillOpacity?: number;
  actualLabelColor?: string;
  actualLineOutlineColor?: string;
  actualLineOutlineWidth?: number;
  actualPatternColor?: string;
  actualPatternType?: A11yTargetLineChartPattern;
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
  targetPatternType?: A11yTargetLineChartPattern;
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

export interface A11yTargetLineChartSettingsChangeDetail {
  setting: keyof A11yTargetLineChartConfig;
  value: A11yTargetLineChartConfig[keyof A11yTargetLineChartConfig];
  source: 'controls' | 'legend';
}

export interface A11yTargetLineChartPointChangeDetail {
  actual: number | null;
  actualSuppressed: boolean;
  announcement: string;
  baselineDifference: A11yTargetLineChartSemanticDifference | null;
  index: number;
  outcome: A11yTargetLineChartOutcome;
  outcomeLabel: string;
  target: A11yTargetLineChartTarget | null;
  targetDifference: A11yTargetLineChartSemanticDifference | null;
  x: A11yTargetLineChartXValue;
}

export interface A11yTargetLineChartErrorDetail {
  code: 'invalid-baseline' | 'invalid-data' | 'invalid-messages';
  message: string;
}

export interface A11yTargetLineChartDefinition { id: string; label: string; definition: string; }
export interface A11yTargetLineChartDataViewChangeDetail { open: boolean; dataView: 'dialog' | 'inline'; }
export interface A11yTargetLineChartDisclosureChangeDetail { disclosure: 'explanation' | 'glossary'; expanded: boolean; }
/** Emitted after initial render only when normalized data or its baseline changes. */
export interface A11yTargetLineChartDataChangeDetail { data: A11yTargetLineChartDatum[]; model: A11yTargetLineChartSemanticModel | null; }

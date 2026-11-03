/** Inclusive target interval, expressed in the same units as value. */
export interface A11yBarChartTargetRange {
  min: number;
  max: number;
}

export type A11yBarChartTarget = number | A11yBarChartTargetRange;
export type A11yBarChartTargetRelation = 'below' | 'within' | 'above' | 'equal' | 'incomplete';
export type A11yBarChartTargetOutcome = 'met' | 'not-met' | 'unavailable';
export type A11yBarChartTargetStyle = 'none' | 'color' | 'texture' | 'color-and-texture';

export interface A11yBarChartDatum {
  id: string;
  label: string;
  value: number | null;
  /** Explicitly redact this value. false also opts a true zero out of legacy global suppression. */
  valueSuppressed?: boolean;
  target?: A11yBarChartTarget | null;
  targetSuppressed?: boolean;
  definition?: string;
}

export interface A11yBarChartConfig {
  scaleMode?: 'largest' | 'population-share';
  /** Infer a missing total from complete rows. Defaults true for the base chart. */
  inferTotal?: boolean;
  /** Shared count scale across views. Positive finite values only. */
  scaleMaximum?: number;
  dataView?: 'dialog' | 'inline';
  /** Explicit table visibility overrides the legacy showTable boolean. */
  tableVisibility?: 'hidden' | 'screen-reader' | 'visible';
  /** @deprecated Use tableVisibility. */
  showTable?: boolean;
  showSummary?: boolean;
  showContext?: boolean;
  showActions?: boolean;
  showExplanation?: boolean;
  showGlossary?: boolean;
  showExport?: boolean;
  explanationExpanded?: boolean;
  glossaryExpanded?: boolean;
  showCounts?: boolean;
  showPercentages?: boolean;
  showTotal?: boolean;
  /** Experimental category cards on hover, focus, or activation. Default false. */
  showDetails?: boolean;
  /** Optional outcome encoding for comparable bars with targets. Default none. */
  targetStyle?: A11yBarChartTargetStyle;
  /** Numeric targets only; equality always passes. Default above, like line charts. */
  positiveDirection?: 'above' | 'below';
  locale?: string;
  countDecimals?: number;
  percentageDecimals?: number;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  announceChanges?: boolean;
}

export interface ResolvedA11yBarChartConfig {
  scaleMode: 'largest' | 'population-share';
  inferTotal: boolean;
  scaleMaximum?: number;
  dataView: 'dialog' | 'inline';
  tableVisibility: 'hidden' | 'screen-reader' | 'visible';
  showSummary: boolean;
  showContext: boolean;
  showActions: boolean;
  showExplanation: boolean;
  showGlossary: boolean;
  showExport: boolean;
  explanationExpanded: boolean;
  glossaryExpanded: boolean;
  showCounts: boolean;
  showPercentages: boolean;
  showTotal: boolean;
  showDetails: boolean;
  targetStyle: A11yBarChartTargetStyle;
  positiveDirection: 'above' | 'below';
  locale: string;
  countDecimals: number;
  percentageDecimals: number;
  headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
  announceChanges: boolean;
}

export interface A11yBarChartValueFormatContext {
  value: number;
  series: 'count' | 'percentage' | 'total' | 'target';
  locale: string;
  id?: string;
  label?: string;
}

/** Return display text for one canonical numeric value. */
export type A11yBarChartValueFormatter = (context: A11yBarChartValueFormatContext) => string;

export type A11yBarChartPattern = 'none' | 'diagonal' | 'dots' | 'horizontal';

export interface A11yBarChartTheme {
  color?: string;
  targetColor?: string;
  positiveColor?: string;
  negativeColor?: string;
  positivePatternType?: A11yBarChartPattern;
  negativePatternType?: A11yBarChartPattern;
  positivePatternColor?: string;
  negativePatternColor?: string;
  /** Decorative texture applied to every bar; defaults to solid (`none`). */
  patternType?: A11yBarChartPattern;
  /** CSS color for texture marks, independent of the bar's base color. */
  patternColor?: string;
  track?: string;
  text?: string;
  muted?: string;
  border?: string;
  focus?: string;
  surface?: string;
  space?: string;
  font?: string;
  barHeight?: string;
  borderRadius?: string;
  buttonRadius?: string;
  fontSize?: string;
  titleFontSize?: string;
  lineHeight?: string;
  gap?: string;
  rowGap?: string;
  buttonPadding?: string;
}

export type A11yBarChartValueStatus = 'reported' | 'suppressed' | 'missing';

export interface A11yBarChartRow {
  id: string;
  label: string;
  value: number | null;
  status: A11yBarChartValueStatus;
  valueText: string;
  percentage: number | null;
  percentageText: string;
  barRatio: number;
  target: A11yBarChartTarget | null;
  targetSuppressed: boolean;
  targetText: string;
  targetRelation: A11yBarChartTargetRelation;
  targetOutcome: A11yBarChartTargetOutcome;
  targetOutcomeLabel: string;
  targetNarrative: string;
  /** Clamped positions on the same scale as barRatio; null when unavailable. */
  targetStartRatio: number | null;
  targetEndRatio: number | null;
  definition: string;
  narrative: string;
}

export interface A11yBarChartSemanticModel {
  rows: A11yBarChartRow[];
  total: number | null;
  totalText: string;
  summary: string;
  explanation: string[];
  indicators: string[];
  warnings: string[];
  hasMissingValues: boolean;
}

export interface BarModelOptions {
  total?: number | null;
  suppressed?: boolean;
  filtered?: boolean;
  config?: A11yBarChartConfig | ResolvedA11yBarChartConfig;
  messages?: MessageDictionary;
  formatValue?: A11yBarChartValueFormatter;
}

export interface ValidationFailure {
  valid: false;
  code: string;
  message: string;
  params?: Record<string, string | number>;
}

export interface ValidationSuccess<T> {
  valid: true;
  data: T;
}

export type BarValidationResult = ValidationSuccess<A11yBarChartDatum[]> | ValidationFailure;

import type { MessageDictionary } from './messages.js';

import type { PercentScale } from '../../chart-core/src/csv.js';

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
  /** null means not reported. A zero is suppressed only when the chart-wide `suppressed` flag is on. */
  value: number | null;
  target?: A11yBarChartTarget | null;
  definition?: string;
}

export interface A11yBarChartConfig {
  scaleMode?: 'largest' | 'population-share';
  /** Infer a missing total from complete rows. Defaults true for the base chart. */
  inferTotal?: boolean;
  /** Shared count scale across views. Positive finite values only. */
  scaleMaximum?: number;
  /**
   * Full-data view: 'dialog' (modal), 'inline' (disclosure under the chart), or
   * 'none' (no data table, data action, or CSV export). Default 'dialog'.
   */
  dataView?: 'dialog' | 'inline' | 'none';
  /** Scale of the percent value passed to formatValue. Default 'whole' (45.5 for 45.5%). */
  percentScale?: PercentScale;
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
  dataView: 'dialog' | 'inline' | 'none';
  percentScale: PercentScale;
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
  /**
   * Canonical numeric value. For series 'percentage' it is a whole percent
   * (45.5 for 45.5%) under the default percentScale 'whole', or a fraction
   * (0.455) when percentScale is 'fraction'. Count, total, and target values
   * are always in their data units.
   */
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
  /** Chart-wide flag: zero values read as Suppressed. Hosts suppress upstream and send 0. */
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

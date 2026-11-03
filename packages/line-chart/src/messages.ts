/** English defaults for every line-chart-owned message. Override these with the messages property. */
import { createPluralSelector, formatTemplate } from '../../chart-core/src/messages.js';
export const ENGLISH_LINE_CHART_MESSAGES = {
  title: 'Actual vs Target Performance',
  summaryLabel: 'Chart summary', controlsLabel: 'Display options', valuesLegend: 'Values',
  actualLine: '{series} line', targetLine: '{series} line', actualValue: '{series} label', targetValueLabel: '{series} label', actualFill: '{series} fill', targetFill: '{series} fill',
  tooltipVisible: 'Tooltip visible', xAxisTitle: 'X axis title', yAxisTitle: 'Y axis title', zoomYAxis: 'Zoom Y-axis', restoreYAxis: 'Restore full Y-axis',
  patternType: '{series} pattern type:', patternSet: '{series} pattern set to {value}',
  patternNone: 'None', patternDiagonal: 'Diagonal', patternDots: 'Dots', patternHorizontal: 'Horizontal',
  enabled: '{label} enabled', disabled: '{label} disabled',
  seriesShown: '{series} shown', seriesHidden: '{series} hidden', stepperStatus: '{period} · {position} of {total}',
  keyboardHelp: 'Keyboard guidance: focus the chart then use Left and Right Arrow keys to move through periods; Home jumps to first period; End jumps to last period. Tooltip content is announced as you navigate.',
  overflowHelp: 'Chart is wider than the available space. The selected value is scrolled into view as you navigate.',
  navigatorLabel: 'Use Left and Right Arrow keys to move across periods. Home jumps to the first period. End jumps to the last period. Current period {period}, {position} of {total}.',
  noData: 'No chart data is available. Provide at least one data point.',
  invalidData: '{message} Check the data supplied to the chart.',
  invalidBaseline: '{message} The chart remains available without baseline context; check the baseline supplied to the chart.',
  previous: 'Previous', next: 'Next', navigationLabel: 'Chart period navigation', previousPeriod: 'Previous period', previousPeriodAt: 'Previous period, {period}', nextPeriod: 'Next period', nextPeriodAt: 'Next period, {period}',
  dataAction: 'Data', dataHeading: 'Chart data', closeData: 'Close data', inlineData: 'View chart data',
  exportCsv: 'Download CSV', exportUnavailable: 'CSV export is unavailable in this browser.',
  explain: 'Explain', glossary: 'Glossary', filteredIndicator: 'Filtered data', suppressionIndicator: 'Some values are suppressed.',
  explanationHeading: 'Chart explanation', glossaryHeading: 'Chart glossary',
  periodExplanations: 'Period explanations',
  suppressed: 'Suppressed', contextLabel: 'Context', dataNoteLabel: 'Data note',
  actualSuppressed: '{series} value suppressed.', targetSuppressed: '{series} value suppressed.',
  summaryAllSuppressed: 'Reported values are protected for {period}; the target outcome cannot be determined.',
  summaryLatestSuppressed: 'The latest {series} value for {period} is suppressed; no comparison is available.',
  summaryTargetSuppressed: 'The {series} value for {period} is suppressed; no target comparison is available.',
  chartRole: 'interactive time series', invalidMessages: 'The messages attribute must be valid JSON containing supported message keys and string values.',
  dataCaption: 'Underlying {actual} and {target} {unit} by period.', dataCaptionBaseline: 'Underlying {actual} and {target} {unit} by period. {baseline}: {period}, {value}.',
  targetOutcome: 'Target outcome', changeFrom: 'Change from {series}',
  baselineContext: '{series} context: {message}', baselineDescription: '{series}: {period}, {value}. {message}',
  unitPercentages: 'percentages', unitValues: 'values', percentSuffix: ' %',
  rangeWithin: 'within {series} range', rangeLowerBound: 'the lower bound of {series} range', rangeUpperBound: 'the upper bound of {series} range',
  differenceEqual: 'equal to {comparison}', differenceRelative: '{formatted} {relation} {comparison}',
  outcomeMet: 'Target met', outcomeMetEqual: 'Target met — on target', outcomeNotMet: 'Target not met', outcomeUnavailable: 'Target outcome unavailable', outcomeUnavailableSentence: 'Target outcome unavailable.',
  narrativePeriod: '{period}, {position} of {total}.', noActual: 'No {series} value has been reported.', noTarget: 'No {series} value has been reported.', noTargetOutcome: 'Target outcome unavailable.',
  targetValue: '{series} {value}.', narrativeOutcome: '{outcome}.', periodTargetOutcome: '{outcome} in {period}.', actualValueSentence: '{series} {value}.',
  withinNarrative: '{series} is {description}.', differenceSentence: '{description}.',
  summaryNone: 'No reported result yet.', summaryCannotDetermine: 'Target outcome cannot be determined for {period}.', summaryMissingTarget: '{actual} was {value}, but no {target} value was reported.',
  summaryMetEqual: 'Target met in {period} — on target.', summaryWithin: 'Target met in {period} — within range.', summaryOutcome: '{outcome} in {period}.',
  summaryEqual: '{actual} equaled {target} at {value}.', summaryComparison: '{actual} was {actualValue}. {target} was {targetValue}—{description}.',
  summaryBaseline: '{actual} was {description} of {value}.', summaryBaselineOnly: '{series} is {period} at {value}.', summaryNoLater: 'No {series} data has been reported after {period}.',
  'summaryPeriods.one': 'The target was met in {met} of {total} comparable reported period.',
  'summaryPeriods.other': 'The target was met in {met} of {total} comparable reported periods.',
  tableActualHeader: '{series}{suffix}', tableTargetHeader: '{series}{suffix}',
  missing: 'Missing', baselineLabel: 'Baseline', targetLabel: 'Target', actualLabel: 'Actual',
  defaultXAxisTitle: 'Year', defaultYAxisTitle: 'Percent',
  pointAnnouncement: '{narrative}', 'dataUpdated.one': 'Chart data updated. {count} period is available.', 'dataUpdated.other': 'Chart data updated. {count} periods are available.',
  validationInvalidRange: 'Target ranges must have finite bounds with the minimum no greater than the maximum.',
  validationInvalidBaseline: 'The baseline must include a finite value and a period present in the chart data.',
  validationBaselineObject: 'Chart baseline must be an object with x and value properties.', validationBaselineX: 'Chart baseline requires a valid x value.', validationBaselineValue: 'Chart baseline requires a finite numeric value.',
  validationBaselineExplanation: 'Chart baseline explanation must be text when provided.', validationBaselinePeriod: 'Chart baseline x must match the earliest displayed data period.',
  validationDataArray: 'Chart data must be an array.', validationDataItemObject: 'Chart data item {index} must be an object.', validationDataX: 'Chart data item {index} requires a valid x or year value.',
  validationDataActual: 'Chart data item {index} requires a finite numeric or null actual value.', validationDataTarget: 'Chart data item {index} requires a finite numeric target, null, or a range with finite min and max bounds where min <= max.',
  validationSuppressionFlag: 'Chart data item {index} suppression flags must be boolean when provided.',
  differenceNumber: '{value}', 'differencePercent.one': '{value} percentage point', 'differencePercent.other': '{value} percentage points',
  tooltipHeader: '{period}', tooltipActual: '{series}: {value}', tooltipTarget: '{series}: {value}',
  tooltipDifferenceEqual: '{actual} equals {target}', tooltipDifference: '{actual} is {description}', tooltipDifferenceText: '{description}.', rangeSeparator: 'to',
  tooltipRange: '{series} range from {minimum} to {maximum}', tooltipAria: '{period}, {actual}, {target}. {description}',
  relationAbove: 'above', relationBelow: 'below', relationEqual: 'equal', relationWithin: 'within', relationIncomplete: 'incomplete',
  baselineDifference: 'the {period} {series}', lower: 'lower', upper: 'upper'
} as const;

export type A11yLineChartMessageKey = keyof typeof ENGLISH_LINE_CHART_MESSAGES | 'summaryPeriods.zero' | 'summaryPeriods.two' | 'summaryPeriods.few' | 'summaryPeriods.many' | 'dataUpdated.zero' | 'dataUpdated.two' | 'dataUpdated.few' | 'dataUpdated.many' | 'differencePercent.zero' | 'differencePercent.two' | 'differencePercent.few' | 'differencePercent.many';
export type A11yLineChartMessages = Partial<Record<A11yLineChartMessageKey, string>>;

export function isLineChartMessageKey(key: string): key is A11yLineChartMessageKey {
  if (Object.prototype.hasOwnProperty.call(ENGLISH_LINE_CHART_MESSAGES, key)) return true;
  return /^(summaryPeriods|dataUpdated|differencePercent)\.(zero|one|two|few|many|other)$/.test(key);
}

export function formatLineMessage(template: string, values: Record<string, unknown> = {}): string {
  return formatTemplate(template, values, '\\{([a-zA-Z][\\w]*)\\}');
}

export function pluralLineMessage(
  messages: A11yLineChartMessages,
  key: 'summaryPeriods' | 'dataUpdated' | 'differencePercent',
  count: number,
  locale: string,
  values: Record<string, unknown>
): string {
  const category = createPluralSelector(locale)(count);
  const fullKey = `${key}.${category}` as A11yLineChartMessageKey;
  const selected = messages[fullKey];
  const fallback = messages[`${key}.other` as A11yLineChartMessageKey];
  const englishSpecific = ENGLISH_LINE_CHART_MESSAGES[fullKey as keyof typeof ENGLISH_LINE_CHART_MESSAGES];
  const english = ENGLISH_LINE_CHART_MESSAGES[`${key}.other` as keyof typeof ENGLISH_LINE_CHART_MESSAGES];
  const template = typeof selected === 'string' && selected ? selected
    : typeof fallback === 'string' && fallback ? fallback
      : englishSpecific ?? english;
  return formatLineMessage(template, values);
}

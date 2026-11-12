import { encodeCsvCell } from '../../chart-core/src/csv.js';
import { createFixedDecimalFormatter } from '../../chart-core/src/format.js';
import { formatTemplate } from '../../chart-core/src/messages.js';
import { safeHtmlToText } from '../../chart-core/src/content.js';
import { canonicalLocaleOrDefault } from '../../chart-core/src/validation.js';
import { buildBarXlsx } from '../../bar-chart/src/xlsx.js';
import type { A11yBarChartSemanticModel } from '../../bar-chart/src/model.js';

export interface A11ySegmentedBarChartDatum {
  id: string;
  label: string;
  value: number | null;
  valueSuppressed?: boolean;
  definition?: string;
}

export interface A11ySegmentedBarChartConfig {
  mode?: 'breakdown' | 'comparison';
  presentation?: 'full' | 'compact';
  highlightedId?: string;
  segmentOrder?: 'value' | 'source' | 'label';
  separateCategoryIds?: string[];
  inferTotal?: boolean;
  dataView?: 'dialog' | 'inline';
  tableVisibility?: 'hidden' | 'screen-reader' | 'visible';
  /** Compatibility alias; tableVisibility takes precedence. */
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
  showDetails?: boolean;
  locale?: string;
  countDecimals?: number;
  percentageDecimals?: number;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  announceChanges?: boolean;
}

export type SegmentedPattern = 'none' | 'diagonal' | 'dots' | 'horizontal';
export interface SegmentedThemeEntry {
  color?: string;
  pattern?: SegmentedPattern;
  patternColor?: string;
}
export interface A11ySegmentedBarChartTheme {
  segments?: Record<string, SegmentedThemeEntry>;
  other?: SegmentedThemeEntry;
  color?: string;
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
export interface A11ySegmentedBarChartValueFormatContext {
  value: number;
  series: 'count' | 'percentage' | 'total';
  locale: string;
  id?: string;
  label?: string;
}
export type A11ySegmentedBarChartValueFormatter = (context: A11ySegmentedBarChartValueFormatContext) => string;
export type MessageDictionary = Record<string, string>;
export interface SegmentedRow {
  id: string;
  label: string;
  definition: string;
  value: number | null;
  status: 'reported' | 'missing' | 'suppressed';
  valueText: string;
  percentage: number | null;
  percentageText: string;
  ratio: number;
}
export type SegmentedDisplaySegment =
  | { kind: 'category'; key: string; row: SegmentedRow; members: SegmentedRow[] }
  | { kind: 'other'; key: string; label: string; value: number | null;
      status: 'reported' | 'incomplete' | 'suppressed'; valueText: string;
      percentage: number | null; percentageText: string; ratio: number; members: SegmentedRow[] };
export interface SegmentedModel {
  rows: SegmentedRow[];
  displaySegments: SegmentedDisplaySegment[];
  total: number | null;
  totalText: string;
  error: string | null;
  errorCode: string | null;
  warning: string | null;
  summary: string;
}
export interface SegmentedOptions {
  total?: number | null;
  suppressed?: boolean;
  filtered?: boolean;
  config?: A11ySegmentedBarChartConfig;
  messages?: MessageDictionary;
  formatValue?: A11ySegmentedBarChartValueFormatter;
}

export const ENGLISH_MESSAGES = {
  title: 'Chart', subtitle: '', filtered: 'Filtered', suppressed: 'Suppressed',
  empty: 'No categories are available.', unavailable: 'Unavailable',
  missingValue: 'Missing', suppressedValue: 'Suppressed', incompleteValue: 'Incomplete',
  totalUnavailable: 'Unavailable', total: 'Total', metricOf: 'of {total} {label}',
  invalidData: 'Chart data is invalid. Check the supplied categories and values.',
  invalidMessages: 'The messages setting is not valid JSON. Correct it and try again.',
  mismatch: 'The category values do not add up to the total. Supply a complete breakdown or use comparison mode.',
  comparisonRequiresTotal: 'Comparison requires one category and an explicit total.',
  exceedsTotal: 'The value exceeds the reference total. The bar is limited to the full track.',
  incomplete: 'A complete proportional breakdown is unavailable because some values are missing or suppressed.',
  zeroTotal: 'The total is zero. Percentages are unavailable.',
  overflow: 'The values exceed the supported numeric range. Percentages are unavailable.',
  validationInvalidData: 'Supply an array of categories.',
  validationInvalidRecord: 'Category {position} is invalid. Supply an ID, label, and nonnegative value or null.',
  validationEmptyId: 'Each category needs a nonempty ID.',
  validationDuplicateId: 'The category ID {id} is repeated. Use unique IDs.',
  validationInvalidLabel: 'Category {id} needs a text label.',
  validationInvalidValue: 'Category {id} needs a finite nonnegative value or null.',
  validationInvalidTotal: 'The total must be a finite nonnegative number or null.',
  validationInvalidHighlight: 'The highlighted category does not exist. Choose a supplied category ID.',
  validationInvalidGrouping: 'Choose up to three unique, nonempty category IDs.',
  validationInvalidGroupingHighlight: 'The highlighted category {label} ({id}) would be grouped. Choose categories that keep it separate.',
  otherCategories: 'Other categories',
  categoryHeader: 'Category', countHeader: 'Count', percentageHeader: 'Percentage of total',
  csvCategoryHeader: 'Category', csvCountHeader: 'Count', csvPercentageHeader: 'Percentage of total', csvTotalHeader: 'Total',
  csvContextLabel: 'Context', csvDataNoteLabel: 'Data note', explanationLabel: 'Explanation',
  contextLabel: 'Context', dataNoteLabel: 'Data note',
  showData: 'View complete data', close: 'Close', explain: 'Explain', hideExplanation: 'Hide explanation',
  glossary: 'Glossary', hideGlossary: 'Hide glossary',
  dataDialogTitle: '{title}: complete data', dataTableCaption: '{title}: complete data', dataInlineSummary: 'View complete data',
  exportCsv: 'Download CSV', exportXlsx: 'Download Excel',
  detailsAction: 'Details for {label}', detailsHelp: 'Hover or focus a category for details. Activate to keep details open; press Escape to close.',
  detailsPreview: 'Preview. Select to keep details open.', detailsPinned: 'Kept open. Select again to close.',
  summaryCategoryValue: '{label}: {value}.', summaryCategoryShare: '{label}: {value} ({percentage}).',
  summaryComparison: '{label}: {value}, equivalent to {percentage} of the reference total.',
  announcementDataUpdated: 'Chart data updated.',
  dialogUnsupported: 'This browser cannot open the data dialog. Use the inline data view.',
  dialogUnavailable: 'The data dialog could not open. Try again or use the inline data view.',

};
export type MessageKey = keyof typeof ENGLISH_MESSAGES;
export function formatMessage(key: MessageKey, messages?: MessageDictionary, values: Record<string, unknown> = {}): string {
  const override = messages?.[key];
  return formatTemplate(typeof override === 'string' ? override : ENGLISH_MESSAGES[key], values);
}

const booleanDefaults = {
  inferTotal: true, showSummary: true, showContext: true, showActions: true,
  showExplanation: true, showGlossary: true, showExport: true,
  explanationExpanded: false, glossaryExpanded: false,
  showCounts: true, showPercentages: true, showTotal: true, showDetails: false,
  announceChanges: true
};
function decimals(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 20 ? value : fallback;
}
export function resolveConfig(input?: A11ySegmentedBarChartConfig | null) {
  const c = input && typeof input === 'object' ? input : {};
  const flags = { ...booleanDefaults };
  for (const key of Object.keys(flags) as Array<keyof typeof flags>) {
    if (typeof c[key] === 'boolean') flags[key] = c[key];
  }
  return {
    ...flags,
    mode: c.mode === 'comparison' ? 'comparison' as const : 'breakdown' as const,
    ...(c.separateCategoryIds !== undefined ? { separateCategoryIds: Array.isArray(c.separateCategoryIds) ? [...c.separateCategoryIds] : c.separateCategoryIds } : {}),
    segmentOrder: c.segmentOrder === 'source' || c.segmentOrder === 'label' ? c.segmentOrder : 'value' as const,
    presentation: c.presentation === 'compact' ? 'compact' as const : 'full' as const,
    ...(typeof c.highlightedId === 'string' && c.highlightedId.trim() ? { highlightedId: c.highlightedId } : {}),
    dataView: c.dataView === 'inline' ? 'inline' as const : 'dialog' as const,
    tableVisibility: c.tableVisibility === 'hidden' || c.tableVisibility === 'screen-reader' || c.tableVisibility === 'visible'
      ? c.tableVisibility : c.showTable === false ? 'hidden' as const : 'visible' as const,
    locale: canonicalLocaleOrDefault(c.locale, 'en-US'),
    countDecimals: decimals(c.countDecimals, 0),
    percentageDecimals: decimals(c.percentageDecimals, 2),
    headingLevel: (Number.isInteger(c.headingLevel) && c.headingLevel! >= 1 && c.headingLevel! <= 6 ? c.headingLevel! : 2) as 1 | 2 | 3 | 4 | 5 | 6
  };
}
export type ResolvedA11ySegmentedBarChartConfig = ReturnType<typeof resolveConfig>;
export interface SegmentedValidationFailure { valid: false; code: MessageKey; message: string; params?: Record<string, string | number> }
export type SegmentedValidationResult = { valid: true; data: A11ySegmentedBarChartDatum[] } | SegmentedValidationFailure;

export function validateSegmentedBarData(input: unknown): SegmentedValidationResult {
  const fail = (code: MessageKey, params?: Record<string, string | number>): SegmentedValidationFailure => ({
    valid: false, code, message: formatMessage(code, undefined, params), ...(params ? { params } : {})
  });
  if (!Array.isArray(input)) return fail('validationInvalidData');
  const ids = new Set<string>();
  const data: A11ySegmentedBarChartDatum[] = [];
  for (const [index, item] of input.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return fail('validationInvalidRecord', { position: index + 1 });
    if (typeof item.id !== 'string' || !item.id.trim()) return fail('validationEmptyId');
    if (ids.has(item.id)) return fail('validationDuplicateId', { id: item.id });
    if (typeof item.label !== 'string' || !item.label.trim()) return fail('validationInvalidLabel', { id: item.id });
    if ((item.valueSuppressed !== undefined && typeof item.valueSuppressed !== 'boolean') ||
        (item.definition !== undefined && typeof item.definition !== 'string')) return fail('validationInvalidRecord', { position: index + 1 });
    // Never access an explicitly protected source value, even via an accessor.
    const value: unknown = item.valueSuppressed === true ? null : item.value;
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) return fail('validationInvalidValue', { id: item.id });
    ids.add(item.id);
    data.push({ id: item.id, label: item.label, value: value as number | null,
      ...(typeof item.valueSuppressed === 'boolean' ? { valueSuppressed: item.valueSuppressed } : {}),
      ...(typeof item.definition === 'string' ? { definition: item.definition } : {}) });
  }
  return { valid: true, data };
}
export function validateSegmentedBarTotal(value: unknown): { valid: true; total: number | null } | SegmentedValidationFailure {
  if (value === undefined || value === null) return { valid: true, total: null };
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return { valid: true, total: value };
  return { valid: false, code: 'validationInvalidTotal', message: ENGLISH_MESSAGES.validationInvalidTotal };
}

export function buildSegmentedBarModel(input: A11ySegmentedBarChartDatum[], options: SegmentedOptions = {}): SegmentedModel {
  const c = resolveConfig(options.config);
  const msg = (key: MessageKey, values: Record<string, unknown> = {}) => formatMessage(key, options.messages, values);
  const failure = (code: MessageKey, params?: Record<string, string | number>): SegmentedModel => ({
    rows: [], displaySegments: [], total: null, totalText: msg('totalUnavailable'), error: msg(code, params), errorCode: code, warning: null, summary: msg(code, params)
  });
  const validation = validateSegmentedBarData(input);
  if (!validation.valid) return failure(validation.code, validation.params);
  const checkedTotal = validateSegmentedBarTotal(options.total);
  if (!checkedTotal.valid) return failure(checkedTotal.code);
  const data = validation.data;
  const protectedRow = (d: A11ySegmentedBarChartDatum) => d.valueSuppressed === true ||
    (options.suppressed === true && d.valueSuppressed !== false && d.value === 0);
  const complete = data.length > 0 && data.every(d => !protectedRow(d) && d.value !== null);
  const sum = complete ? data.reduce((result, d) => result + d.value!, 0) : null;
  const total = checkedTotal.total ?? (c.mode === 'breakdown' && c.inferTotal && complete && Number.isFinite(sum) && !options.suppressed ? sum : null);
  let errorCode: MessageKey | null = null;
  if (data.length && c.mode === 'comparison' && (data.length !== 1 || checkedTotal.total === null)) errorCode = 'comparisonRequiresTotal';
  if (c.highlightedId && !data.some(d => d.id === c.highlightedId)) errorCode = 'validationInvalidHighlight';
  const selection = options.config?.separateCategoryIds;
  if (c.mode === 'breakdown' && selection !== undefined &&
      (!Array.isArray(selection) || selection.length > 3 ||
       selection.some(id => typeof id !== 'string' || !id.trim()) || new Set(selection).size !== selection.length)) errorCode = 'validationInvalidGrouping';
  // Allow floating-point summation noise, never silently normalize a mismatch.
  if (c.mode === 'breakdown' && complete && checkedTotal.total !== null && sum !== null &&
      Math.abs(sum - checkedTotal.total) > Math.max(Number.MIN_VALUE, Math.abs(sum), Math.abs(checkedTotal.total)) * Number.EPSILON * Math.max(8, data.length * 2)) errorCode = 'mismatch';
  const countFormat = createFixedDecimalFormatter(c.locale);
  const percentageFormat = createFixedDecimalFormatter(c.locale, 'percent');
  const fmt = (value: number, series: 'count' | 'percentage' | 'total', d?: A11ySegmentedBarChartDatum): string => {
    if (typeof options.formatValue === 'function') {
      try {
        const formatted = options.formatValue({ value, series, locale: c.locale, ...(d ? { id: d.id, label: d.label } : {}) });
        if (typeof formatted === 'string' && formatted.trim()) return formatted;
      } catch { /* Use the canonical localized formatter. */ }
    }
    return series === 'percentage' ? percentageFormat(value, c.percentageDecimals) : countFormat(value, c.countDecimals);
  };
  let overflow = sum !== null && !Number.isFinite(sum);
  const rows: SegmentedRow[] = data.map(d => {
    const status = protectedRow(d) ? 'suppressed' : d.value === null ? 'missing' : 'reported';
    const value = status === 'reported' ? d.value : null;
    const rawRatio = value !== null && total !== null && total > 0 ? value / total : null;
    if (rawRatio !== null && !Number.isFinite(rawRatio)) overflow = true;
    const percentage = rawRatio !== null && Number.isFinite(rawRatio) ? rawRatio : null;
    return { id: d.id, label: d.label, definition: d.definition ?? '', value, status,
      valueText: value === null ? msg(status === 'suppressed' ? 'suppressedValue' : 'missingValue') : fmt(value, 'count', d),
      percentage, percentageText: percentage === null ? msg(status === 'suppressed' ? 'suppressedValue' : 'unavailable') : fmt(percentage, 'percentage', d),
      ratio: percentage === null || errorCode || (c.mode === 'breakdown' && !complete) ? 0 : Math.min(1, percentage) };
  });
  let selected: SegmentedRow[];
  if (c.mode === 'comparison' || (selection === undefined && rows.length <= 4)) selected = rows;
  else if (Array.isArray(selection)) selected = [...new Set(selection)].slice(0, 3).flatMap(id => {
    const row = rows.find(candidate => candidate.id === id);
    return row ? [row] : [];
  });
  else {
    const ordered = [...rows];
    if (c.segmentOrder === 'value') ordered.sort((a, b) => {
      if (a.value === null) return b.value === null ? 0 : 1;
      if (b.value === null) return -1;
      return b.value - a.value;
    });
    if (c.segmentOrder === 'label') {
      const collator = new Intl.Collator(c.locale);
      ordered.sort((a, b) => collator.compare(a.label, b.label));
    }
    selected = ordered.slice(0, 3);
  }
  const selectedIds = new Set(selected.map(row => row.id));
  const members = rows.filter(row => !selectedIds.has(row.id));
  const groupedHighlight = c.mode === 'breakdown' && c.highlightedId ? members.find(row => row.id === c.highlightedId) : undefined;
  if (groupedHighlight && !errorCode) {
    errorCode = 'validationInvalidGroupingHighlight';
    for (const row of rows) row.ratio = 0;
  }
  const displaySegments: SegmentedDisplaySegment[] = selected.map(row => ({ kind: 'category', key: `category:${row.id}`, row, members: [row] }));
  if (members.length) {
    const status = members.some(row => row.status === 'suppressed') ? 'suppressed' :
      members.some(row => row.status === 'missing') ? 'incomplete' : 'reported';
    const aggregate = status === 'reported' ? members.reduce((result, row) => result + row.value!, 0) : null;
    const value = aggregate !== null && Number.isFinite(aggregate) ? aggregate : null;
    if (aggregate !== null && !Number.isFinite(aggregate)) overflow = true;
    const rawRatio = value !== null && total !== null && total > 0 ? value / total : null;
    if (rawRatio !== null && !Number.isFinite(rawRatio)) overflow = true;
    const percentage = rawRatio !== null && Number.isFinite(rawRatio) ? rawRatio : null;
    displaySegments.push({ kind: 'other', key: 'group:other', label: msg('otherCategories'), members, status, value,
      valueText: value === null ? msg(status === 'suppressed' ? 'suppressedValue' : status === 'incomplete' ? 'incompleteValue' : 'unavailable') : fmt(value, 'count'),
      percentage, percentageText: percentage === null ? msg(status === 'suppressed' ? 'suppressedValue' : 'unavailable') : fmt(percentage, 'percentage'),
      ratio: percentage === null || errorCode || !complete ? 0 : Math.min(1, percentage) });
  }
  const warning = overflow ? msg('overflow') : c.mode === 'breakdown' && data.length && !complete ? msg('incomplete') :
    total === 0 ? msg('zeroTotal') : c.mode === 'comparison' && rows[0]?.percentage != null && rows[0].percentage > 1 ? msg('exceedsTotal') : null;
  const error = errorCode ? msg(errorCode, groupedHighlight ? { id: groupedHighlight.id, label: groupedHighlight.label } : {}) : null;
  const summaryRows = displaySegments.map(segment => segment.kind === 'category' ? segment.row : segment);
  const summary = error ?? (summaryRows.length ? summaryRows.map(row => msg(row.percentage === null ? 'summaryCategoryValue' :
    c.mode === 'comparison' ? 'summaryComparison' : 'summaryCategoryShare', { label: row.label, value: row.valueText, percentage: row.percentageText })).join(' ') : msg('empty'));
  return { rows, displaySegments, total, totalText: total === null ? msg('totalUnavailable') : fmt(total, 'total'), error, errorCode, warning, summary };
}

export interface SegmentedExportOptions {
  chartTitle?: string;
  categoryHeader?: string;
  countHeader?: string;
  percentageHeader?: string;
  totalHeader?: string;
  messages?: MessageDictionary;
  locale?: string;
  context?: string;
  dataNote?: string;
  contextText?: string;
  explanationText?: string;
  dataNoteText?: string;
}
function metadataText(options: SegmentedExportOptions, name: 'context' | 'dataNote'): string {
  const plain = options[`${name}Text`];
  return typeof plain === 'string' ? plain : options[name] ? safeHtmlToText(options[name]!) : '';
}
export function buildSegmentedBarCsv(model: SegmentedModel, options: SegmentedExportOptions = {}): string {
  const msg = (key: MessageKey) => formatMessage(key, options.messages);
  const rows: string[][] = [];
  for (const [label, value] of [
    [msg('title'), options.chartTitle], [msg('csvContextLabel'), metadataText(options, 'context')],
    [msg('explanationLabel'), options.explanationText], [msg('csvDataNoteLabel'), metadataText(options, 'dataNote')]
  ]) if (value?.trim()) rows.push([label!, value.trim()]);
  rows.push([options.categoryHeader ?? msg('csvCategoryHeader'), options.countHeader ?? msg('csvCountHeader'), options.percentageHeader ?? msg('csvPercentageHeader')],
    ...model.rows.map(row => [row.label, row.valueText, row.percentageText]),
    [options.totalHeader ?? msg('csvTotalHeader'), model.totalText, '']);
  return rows.map(row => row.map(value => encodeCsvCell(value)).join(',')).join('\r\n');
}
export function buildSegmentedBarXlsx(model: SegmentedModel, options: SegmentedExportOptions = {}): Uint8Array<ArrayBuffer> {
  // Reuse the existing OOXML writer; the adapter contains only safe canonical
  // values. The standalone build inlines this source, not a runtime dependency.
  const adapted: A11yBarChartSemanticModel = {
    rows: model.rows.map(row => ({ ...row, barRatio: row.ratio, target: null, targetSuppressed: false, targetText: '',
      targetRelation: 'incomplete', targetOutcome: 'unavailable', targetOutcomeLabel: '', targetNarrative: '',
      targetStartRatio: null, targetEndRatio: null, narrative: '' })),
    total: model.total, totalText: model.totalText, summary: model.summary, explanation: [], indicators: [],
    warnings: model.warning ? [model.warning] : [], hasMissingValues: model.rows.some(row => row.status === 'missing')
  };
  return buildBarXlsx(adapted, { ...options, contextText: metadataText(options, 'context'), dataNoteText: metadataText(options, 'dataNote') });
}

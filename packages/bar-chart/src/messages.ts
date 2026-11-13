import { createPluralSelector, formatTemplate } from '../../chart-core/src/messages.js';

export const ENGLISH_MESSAGES = {
  title: 'Chart',
  subtitle: '',
  filtered: 'Filtered',
  suppressed: 'Suppressed',
  empty: 'No categories are available.',
  invalidData: 'Chart data is invalid. Check the supplied categories and values.',
  invalidMessages: 'The messages setting is not valid JSON. Correct the messages value and try again.',
  total: 'Total',
  totalUnavailable: 'Unavailable',
  totalSuppressed: 'Suppressed',
  countHeader: 'Count',
  targetHeader: 'Target',
  csvTargetHeader: 'Target',
  targetUnavailable: 'Not set',
  targetRange: '{min} to {max}',
  outcomeMet: 'Target met',
  outcomeNotMet: 'Target not met',
  targetBelow: '{label} is below the target ({target}).',
  targetWithin: '{label} is within the target range ({target}).',
  targetAbove: '{label} is above the target ({target}).',
  targetEqual: '{label} equals the target ({target}).',
  targetIncomplete: '{label}: target {target}; comparison unavailable.',
  warningTargetClipped: 'The target for {label} exceeds the supplied total; its marker is limited to the chart track. The full target is shown in text.',
  warningTargetScaleUnavailable: 'The target for {label} cannot be positioned without a positive total. The full target is shown in text.',
  percentageHeader: 'Percentage of total',
  categoryHeader: 'Category',
  csvCategoryHeader: 'Category',
  csvCountHeader: 'Count',
  csvPercentageHeader: 'Percentage of total',
  csvTotalHeader: 'Total',
  percentageUnavailable: 'Unavailable',
  percentageSuppressed: 'Suppressed',
  definitionToggle: 'Definition for {label}',
  explain: 'Explain',
  hideExplanation: 'Hide explanation',
  showData: 'View complete data',
  dialogUnsupported: 'This browser does not support modal chart data dialogs.',
  dialogUnavailable: 'The chart data dialog could not be opened as a modal.',
  close: 'Close',
  detailsAction: 'Details for {label}',
  detailsHint: 'Details',
  detailsHelp: 'Hover or focus a bar to preview details. Use Arrow Up or Arrow Down to move between categories; Home and End go to the first and last. Click, tap, Enter, or Space to keep details open. Press Escape to dismiss; Tab moves through the chart normally.',
  detailsPreview: 'Preview. Select the bar to keep open.',
  detailsPinned: 'Kept open. Select the bar again to close.',
  dataDialogTitle: 'Complete chart data',
  dataTableCaption: 'Complete data for {title}',
  dataInlineSummary: 'View complete data',
  exportCsv: 'Download CSV',
  explanationLabel: 'Explanation',
  plainLanguageSummary: 'Plain language summary',
  warningScaleClipped: 'The value or target for {label} exceeds the shared scale maximum; its marker or bar is limited to the chart track.',
  scaleShared: 'Bars use a shared count scale up to {maximum}',
  scaleLargest: 'Bars scaled to the largest reported value',
  scalePopulationShare: 'Bars scaled to the reported total',
  missingValue: 'Not reported',
  suppressedValue: 'Suppressed',
  suppressionNote: 'Some values are suppressed to protect privacy.',
  noDefinitions: 'No category definitions are available.',
  contextLabel: 'Context',
  dataNoteLabel: 'Data note',
  csvContextLabel: 'Context',
  csvDataNoteLabel: 'Data note',
  glossary: 'Glossary',
  hideGlossary: 'Hide glossary',
  noContext: '',
  summaryNoData: 'No category data has been reported.',
  'summaryAllZero.one': 'The single reported category has a value of zero.',
  'summaryAllZero.other': 'All {count} reported categories have a value of zero.',
  summaryTotal: 'The reported total is {total}.',
  summaryCategoryShare: '{label} accounts for {percentage} of the reported total.',
  summaryCategoryValue: '{label}: {value}.',
  summaryLargestCategory: '{label} has the largest reported value: {value}.',
  summaryLargestCategoryShare: '{label} has the largest reported value at {value}, or {percentage} of the reported total.',
  summaryTiedLargestCategories: '{labels} share the largest reported value at {value}.',
  summaryTiedLargestCategoriesShare: '{labels} share the largest reported value at {value}, or {percentage} of the reported total.',
  summaryReportedCategory: 'Reported values include {label} at {value}. Some category values may be unavailable.',
  summaryNoReportedValues: 'No numeric category values are available to summarize.',
  explanationTotal: 'The reported total is {total}.',
  explanationTotalUnavailable: 'The total is {total}.',
  explanationDifference: '{label} differs from {otherLabel} by {difference}.',
  validationInvalidData: 'Expected chart data to be an array of category records.',
  validationDuplicateId: 'Category identifiers must be unique. Duplicate identifier: {id}.',
  validationEmptyId: 'Every category needs a non-empty identifier.',
  validationInvalidLabel: 'Category {id} needs a text label.',
  validationInvalidValue: 'Category {id} must have a finite, nonnegative value or null.',
  validationInvalidTarget: 'Category {id} needs a finite, nonnegative target or a range with finite, nonnegative min and max and min <= max.',
  validationInvalidRecord: 'Category at position {position} must be a valid record.',
  validationInvalidTotal: 'The total must be a finite, nonnegative number.',
  warningTotalMismatch: 'The reported category values sum to {sum}, which exceeds the supplied total of {total}.',
  warningComputedTotalOverflow: 'The reported values exceed the numeric range for a total. The total and percentages are unavailable until a valid total is supplied.',
  warningReportedSumOverflow: 'The sum of the reported values exceeds the numeric range that can be represented.',
  warningPercentageOverflow: 'The percentage for {label} is unavailable because its count-to-total ratio exceeds the numeric range that can be represented.',
  'announcementDataUpdated.one': 'Chart data updated. {count} category is shown.',
  'announcementDataUpdated.other': 'Chart data updated. {count} categories are shown.',
  announcementDataError: 'Chart data could not be updated. Review the error message.',
  narrativeValue: '{label}: {value}.',
  narrativeShare: '{label}: {value}, {percentage} of the total.',
  narrativeMissing: '{label}: value not reported.',
  narrativeSuppressed: '{label}: value suppressed.',
  narrativeContext: 'Additional context is available.',
  scaleWarning: 'Some reported values exceed the supplied total; bar lengths are limited to the chart track.'
} as const;

/** Unambiguous name for the bar chart English catalog; safe to import alongside other chart packages. */
export const ENGLISH_BAR_CHART_MESSAGES = ENGLISH_MESSAGES;

type CatalogKey = keyof typeof ENGLISH_MESSAGES;
type PluralBaseKey = 'summaryAllZero' | 'announcementDataUpdated';
type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export type MessageKey = CatalogKey | PluralBaseKey | `${PluralBaseKey}.${PluralCategory}`;
export type MessageDictionary = Partial<Record<MessageKey, string>>;

export function resolveMessages(messages?: MessageDictionary | null): Record<CatalogKey, string> {
  const result = { ...ENGLISH_MESSAGES } as Record<CatalogKey, string>;
  if (messages && typeof messages === 'object') {
    for (const [key, value] of Object.entries(messages)) {
      if (typeof value === 'string' && value.trim() && (Object.prototype.hasOwnProperty.call(ENGLISH_MESSAGES, key) || /^(summaryAllZero|announcementDataUpdated)\.(zero|one|two|few|many|other)$/.test(key))) {
        (result as Record<string, string>)[key] = value;
      }
    }
  }
  return result;
}

function safeLocale(locale: string): string {
  try { return Intl.getCanonicalLocales(locale)[0] ?? 'en-US'; }
  catch { return 'en-US'; }
}

export function formatMessage(
  template: string,
  params: Record<string, string | number> = {},
  _locale = 'en-US'
): string {
  return formatTemplate(template, params);
}

export type MessageTranslator = (key: MessageKey, params?: Record<string, string | number>) => string;

/** Create a translator for one operation, reusing its resolved catalog and plural rules. */
export function createMessageResolver(
  messages?: MessageDictionary | null,
  locale = 'en-US'
): MessageTranslator {
  const catalog = resolveMessages(messages);
  const canonicalLocale = safeLocale(locale);
  let selectPlural: ReturnType<typeof createPluralSelector> | undefined;
  return (key, params = {}) => {
    const isPluralBase = key === 'summaryAllZero' || key === 'announcementDataUpdated';
    let template: string;
    if (typeof key === 'string' && key.includes('.')) {
      const [base] = key.split('.') as [PluralBaseKey, PluralCategory];
      const override = Object.prototype.hasOwnProperty.call(messages ?? {}, key) ? messages?.[key] : undefined;
      template = typeof override === 'string' && override.trim()
        ? override
        : catalog[key as CatalogKey] ?? catalog[`${base}.other` as CatalogKey];
    } else if (isPluralBase) {
      const count = Number(params.count);
      const category = (selectPlural ??= createPluralSelector(canonicalLocale))(count);
      const candidate = `${key}.${category}` as CatalogKey;
      const fallback = `${key}.other` as CatalogKey;
      const candidateOverride = Object.prototype.hasOwnProperty.call(messages ?? {}, candidate) ? messages?.[candidate] : undefined;
      const fallbackOverride = Object.prototype.hasOwnProperty.call(messages ?? {}, fallback) ? messages?.[fallback] : undefined;
      template = typeof candidateOverride === 'string' && candidateOverride.trim() ? candidateOverride
        : typeof fallbackOverride === 'string' && fallbackOverride.trim() ? fallbackOverride
          : catalog[candidate] ?? catalog[fallback];
    } else template = catalog[key as CatalogKey];
    return formatMessage(template, params, canonicalLocale);
  };
}

export function message(
  key: MessageKey,
  messages?: MessageDictionary | null,
  params: Record<string, string | number> = {},
  locale = 'en-US'
): string {
  return createMessageResolver(messages, locale)(key, params);
}

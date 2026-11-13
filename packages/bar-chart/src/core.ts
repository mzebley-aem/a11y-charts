/** DOM-free helpers for server rendering, data preparation, and export. */
export { resolveConfig } from './config.js';
export { ENGLISH_MESSAGES, ENGLISH_BAR_CHART_MESSAGES, formatMessage, message, resolveMessages } from './messages.js';
export type { MessageDictionary, MessageKey } from './messages.js';
export { validateBarData, validateBarTotal } from './validation.js';
export { buildBarModel } from './semantic-model.js';
export { buildBarCsv } from './csv.js';
export type { BarCsvOptions } from './csv.js';
export { themeToCssVariables } from './theme.js';
export type { A11yBarChartThemeVariable } from './theme.js';
export type {
  A11yBarChartConfig,
  A11yBarChartDatum,
  A11yBarChartTarget,
  A11yBarChartTargetRange,
  A11yBarChartTargetRelation,
  A11yBarChartTargetOutcome,
  A11yBarChartTargetStyle,
  A11yBarChartRow,
  A11yBarChartSemanticModel,
  A11yBarChartValueStatus,
  A11yBarChartTheme,
  A11yBarChartPattern,
  A11yBarChartValueFormatContext,
  A11yBarChartValueFormatter,
  BarModelOptions,
  BarValidationResult,
  ResolvedA11yBarChartConfig,
  ValidationFailure,
  ValidationSuccess
} from './model.js';
export type { A11yBarChartPreparedView, A11yBarChartViewSection, A11yBarChartGroupMessages, A11yBarChartGroupSelectionChangeDetail, PreparedBarView, BarViewSection } from './grouped-model.js';
export { prepareBarViewSection } from './prepare-views.js';
export type { BarPopulationRecord, BarPopulationOption, BarPreparedViewContext, PrepareBarViewsOptions } from './prepare-views.js';

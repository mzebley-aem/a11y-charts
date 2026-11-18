/** DOM-free helpers for server rendering, data preparation, and export. */
export { resolveConfig } from './config.js';
export { ENGLISH_TARGET_LINE_CHART_MESSAGES, formatLineMessage, isTargetLineChartMessageKey, pluralLineMessage } from './messages.js';
export type { A11yTargetLineChartMessageKey, A11yTargetLineChartMessages } from './messages.js';
export { validateBaseline, validateData } from './validation.js';
export type { BaselineValidationResult, DataValidationResult } from './validation.js';
export { buildSemanticModel, normalizeLineData } from './semantic-model.js';
export type { A11yTargetLineChartSemanticContext } from './semantic-model.js';
export { buildLineCsv } from './csv.js';
export type { BuildLineCsvOptions } from './csv.js';
export { copyTarget, formatTarget, isTargetRange } from './target.js';
export type {
  A11yTargetLineChartBaseline,
  A11yTargetLineChartConfig,
  A11yTargetLineChartDatum,
  A11yTargetLineChartSemanticModel,
  A11yTargetLineChartTarget,
  A11yTargetLineChartTargetRange,
  A11yTargetLineChartTheme,
  A11yTargetLineChartXValue
} from './model.js';

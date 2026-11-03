/** DOM-free helpers for server rendering, data preparation, and export. */
export { resolveConfig } from './config.js';
export { ENGLISH_LINE_CHART_MESSAGES, formatLineMessage, isLineChartMessageKey, pluralLineMessage } from './messages.js';
export type { A11yLineChartMessageKey, A11yLineChartMessages } from './messages.js';
export { validateBaseline, validateData } from './validation.js';
export type { BaselineValidationResult, DataValidationResult } from './validation.js';
export { buildSemanticModel, normalizeLineData } from './semantic-model.js';
export type { A11yLineChartSemanticContext } from './semantic-model.js';
export { buildLineCsv } from './csv.js';
export type { BuildLineCsvOptions } from './csv.js';
export { copyTarget, formatTarget, isTargetRange } from './target.js';
export type {
  A11yLineChartBaseline,
  A11yLineChartConfig,
  A11yLineChartDatum,
  A11yLineChartSemanticModel,
  A11yLineChartTarget,
  A11yLineChartTargetRange,
  A11yLineChartTheme,
  A11yLineChartXValue
} from './model.js';

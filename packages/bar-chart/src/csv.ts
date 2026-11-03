import type { A11yBarChartSemanticModel } from './model.js';
import { message, type MessageDictionary } from './messages.js';
import { richContentToText } from './rich-content.js';
import { encodeCsvCell } from '../../chart-core/src/csv.js';

export interface BarCsvOptions {
  chartTitle?: string;
  categoryHeader?: string;
  countHeader?: string;
  percentageHeader?: string;
  totalHeader?: string;
  targetHeader?: string;
  messages?: MessageDictionary;
  locale?: string;
  /** Authored rich HTML; converting it requires a browser DOM unless contextText is supplied. */
  context?: string;
  /** Authored rich HTML; converting it requires a browser DOM unless dataNoteText is supplied. */
  dataNote?: string;
  /** Already-plain context text for DOM-free CSV generation. A string, including empty, takes precedence over context. */
  contextText?: string;
  /** Already-plain data note text for DOM-free CSV generation. A string, including empty, takes precedence over dataNote. */
  dataNoteText?: string;
  /** Plain text converted from authored safe rich HTML by the browser caller. */
  explanationText?: string;
}

export function buildBarCsv(model: A11yBarChartSemanticModel, options: BarCsvOptions = {}): string {
  const locale = options.locale ?? 'en-US';
  const metadata: string[][] = [];
  if (options.chartTitle?.trim()) metadata.push([message('title', options.messages, {}, locale), options.chartTitle.trim()]);
  if (typeof options.contextText === 'string') {
    if (options.contextText.trim()) metadata.push([message('csvContextLabel', options.messages, {}, locale), options.contextText.trim()]);
  } else if (typeof options.context === 'string' && options.context.trim()) {
    const value = richContentToText(options.context);
    if (value) metadata.push([message('csvContextLabel', options.messages, {}, locale), value]);
  }
  if (options.explanationText?.trim()) metadata.push([message('explanationLabel', options.messages, {}, locale), options.explanationText.trim()]);
  if (typeof options.dataNoteText === 'string') {
    if (options.dataNoteText.trim()) metadata.push([message('csvDataNoteLabel', options.messages, {}, locale), options.dataNoteText.trim()]);
  } else if (typeof options.dataNote === 'string' && options.dataNote.trim()) {
    const value = richContentToText(options.dataNote);
    if (value) metadata.push([message('csvDataNoteLabel', options.messages, {}, locale), value]);
  }
  const hasTargets = model.rows.some((row) => row.target !== null || row.targetSuppressed);
  const rows = [
    ...metadata,
    [options.categoryHeader ?? message('csvCategoryHeader', options.messages, {}, locale),
      options.countHeader ?? message('csvCountHeader', options.messages, {}, locale),
      options.percentageHeader ?? message('csvPercentageHeader', options.messages, {}, locale),
      ...(hasTargets ? [options.targetHeader ?? message('csvTargetHeader', options.messages, {}, locale)] : [])],
    ...model.rows.map((row) => [row.label, row.valueText, row.percentageText, ...(hasTargets ? [row.targetText] : [])]),
    [options.totalHeader ?? message('csvTotalHeader', options.messages, {}, locale), model.totalText, '', ...(hasTargets ? [''] : [])]
  ];
  return rows.map((row) => row.map((cell) => encodeCsvCell(String(cell))).join(',')).join('\r\n');
}

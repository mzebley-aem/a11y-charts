import type { A11yLineChartDatum, A11yLineChartSemanticModel } from './model.js';
import { normalizeLineData } from './semantic-model.js';
import { formatTarget } from './target.js';
import { lineRichContentToText } from './rich-content.js';
import { encodeCsvCell } from '../../chart-core/src/csv.js';

export interface BuildLineCsvOptions {
  data: readonly A11yLineChartDatum[];
  model: A11yLineChartSemanticModel;
  headers: readonly string[];
  formatPeriod: (value: A11yLineChartDatum['x']) => string;
  formatValue: (value: number, series: 'actual' | 'target' | 'baseline', x: A11yLineChartDatum['x']) => string;
  missing: string;
  suppressed: string;
  /** Authored rich HTML; converting it requires a browser DOM unless contextText is supplied. */
  context?: string;
  /** Authored rich HTML; converting it requires a browser DOM unless dataNoteText is supplied. */
  dataNote?: string;
  /** Already-plain context text for DOM-free CSV generation. A string, including empty, takes precedence over context. */
  contextText?: string;
  /** Already-plain data note text for DOM-free CSV generation. A string, including empty, takes precedence over dataNote. */
  dataNoteText?: string;
  contextLabel?: string;
  dataNoteLabel?: string;
  rangeSeparator?: string;
  unavailableOutcome?: string;
}

/** Build a CRLF CSV of the current line-chart values and canonical outcomes. */
export function buildLineCsv(options: BuildLineCsvOptions): string {
  const data = normalizeLineData(options.data);
  const rows: string[][] = [];
  if (typeof options.contextText === 'string') {
    if (options.contextText.trim()) rows.push([options.contextLabel ?? 'Context', options.contextText.trim()]);
  } else if (options.context) rows.push([options.contextLabel ?? 'Context', lineRichContentToText(options.context)]);
  if (typeof options.dataNoteText === 'string') {
    if (options.dataNoteText.trim()) rows.push([options.dataNoteLabel ?? 'Data note', options.dataNoteText.trim()]);
  } else if (options.dataNote) rows.push([options.dataNoteLabel ?? 'Data note', lineRichContentToText(options.dataNote)]);
  rows.push([...options.headers]);
  data.forEach((datum, index) => {
    const point = options.model.points[index];
    const actualSuppressed = point?.actualSuppressed === true;
    const actual = actualSuppressed ? options.suppressed : datum.actual == null ? options.missing : point?.actualFormatted ?? options.formatValue(datum.actual, 'actual', datum.x);
    let target = options.missing;
    if (datum.target != null) target = point?.targetFormatted ?? formatTarget(datum.target as NonNullable<A11yLineChartDatum['target']>, (value) => value === null ? options.missing : options.formatValue(value, 'target', datum.x), options.rangeSeparator);
    const outcome = actualSuppressed
      ? (point?.outcome === 'unavailable' ? point.outcomeLabel : options.unavailableOutcome ?? options.missing)
      : point?.outcomeLabel ?? options.missing;
    const row = [point?.xLabel ?? options.formatPeriod(datum.x), actual, target, outcome];
    if (options.model.baseline) row.push(actualSuppressed ? options.suppressed : point?.baseline?.difference?.description ?? options.missing);
    rows.push(row);
  });
  return rows.map((row) => row.map((cell) => encodeCsvCell(cell, { alwaysQuote: true, preserveNegativeNumericLiteral: true })).join(',')).join('\r\n');
}

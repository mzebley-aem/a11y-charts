import { describe, expect, it } from 'vitest';
import { lineRichContentToText, renderLineRichContent } from '../../line-chart/src/rich-content.js';
import { richContentToText, renderRichContent } from '../../bar-chart/src/rich-content.js';
import { formatLineMessage, pluralLineMessage } from '../src/messages.js';
import { formatMessage, message } from '../../bar-chart/src/messages.js';
import { copyTarget as copyLineTarget, isTargetRange as isLineRange } from '../src/target.js';
import { copyTarget as copyBarTarget, isTargetRange as isBarRange } from '../../bar-chart/src/target.js';
import { encodeCsvCell } from '../../chart-core/src/csv.js';
import { createFixedDecimalFormatter } from '../../chart-core/src/format.js';
import { compareToNumericOrRange } from '../../chart-core/src/target.js';
import { buildLineCsv } from '../src/csv.js';
import { buildBarCsv } from '../../bar-chart/src/csv.js';

describe('shared chart-core facade contracts', () => {
  it('uses the same sanitizer, text conversion, and output markup from both chart facades', () => {
    const html = '<p>Hello <strong>charts</strong><script>bad()</script> <a href="javascript:bad()">link</a></p>';
    expect(lineRichContentToText(html)).toBe(richContentToText(html));
    expect(lineRichContentToText(html)).toBe('Hello charts link');
    expect(renderLineRichContent(html).firstChild?.textContent).toBe(renderRichContent(html).firstChild?.textContent);
    expect(renderLineRichContent(html).querySelector('script')).toBeNull();
    expect(renderRichContent(html).querySelector('a')?.hasAttribute('href')).toBe(false);
  });

  it('keeps range copying and type guards equivalent while isolating nested bounds', () => {
    const input = { min: 2, max: 5 };
    const lineCopy = copyLineTarget(input);
    const barCopy = copyBarTarget(input);
    expect(isLineRange(input)).toBe(true);
    expect(isBarRange(input)).toBe(true);
    expect(lineCopy).toEqual(barCopy);
    expect(lineCopy).not.toBe(input);
    expect(barCopy).not.toBe(input);
    expect(compareToNumericOrRange(4, input)).toBe('within');
    expect(compareToNumericOrRange(1, 4)).toBe('below');
  });

  it('preserves distinct CSV quoting policies through the shared encoder', () => {
    expect(encodeCsvCell('plain')).toBe('plain');
    expect(encodeCsvCell('plain', { alwaysQuote: true, preserveNegativeNumericLiteral: true })).toBe('"plain"');
    expect(encodeCsvCell('-12')).toBe("'-12");
    expect(encodeCsvCell('-12', { alwaysQuote: true, preserveNegativeNumericLiteral: true })).toBe('"-12"');
  });

  it('preserves those quoting policies through both chart CSV facades', () => {
    const lineCsv = buildLineCsv({
      data: [], model: { points: [], baseline: null } as never,
      headers: ['=formula', 'plain'], formatPeriod: String, formatValue: String,
      missing: 'Missing', suppressed: 'Suppressed'
    });
    const barCsv = buildBarCsv({ rows: [], totalText: '-12' } as never, {
      categoryHeader: '=formula', countHeader: 'plain', percentageHeader: 'share', totalHeader: 'Total'
    });
    expect(lineCsv).toBe('"\'=formula","plain"');
    expect(barCsv.split('\r\n')[0]).toBe("'=formula,plain,share");
    const barRows = barCsv.split('\r\n');
    expect(barRows[barRows.length - 1]).toBe("Total,'-12,");
  });

  it('keeps chart message facades on the shared interpolation contract', () => {
    expect(formatLineMessage('Value: {value}', { value: 3 })).toBe(formatMessage('Value: {value}', { value: 3 }));
    expect(formatLineMessage('{2bad}', { '2bad': 'kept literal' })).toBe('{2bad}');
    expect(pluralLineMessage({ 'differencePercent.few': '{value} few' }, 'differencePercent', 2, 'ru-RU', { value: 2 }))
      .toBe(message('summaryAllZero', { 'summaryAllZero.few': '{count} few' }, { count: 2 }, 'ru-RU'));
  });

  it('formats fixed decimals using a reusable locale-bound factory', () => {
    const format = createFixedDecimalFormatter('fr-FR', 'percent');
    expect(format(0.25, 1)).toBe('25,0 %');
    expect(format(0.5, 1)).toBe('50,0 %');
  });
});

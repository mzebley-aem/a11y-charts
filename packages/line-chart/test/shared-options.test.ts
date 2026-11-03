import { describe, expect, it } from 'vitest';
import { buildLineCsv } from '../src/csv.js';
import { resolveConfig } from '../src/config.js';
import { buildSemanticModel } from '../src/semantic-model.js';
import { lineRichContentToText, renderLineRichContent } from '../src/rich-content.js';

describe('line shared data tools', () => {
  const buildModel = (data: Array<{ x: string; actual?: number | null; target?: number | null; actualSuppressed?: boolean; targetSuppressed?: boolean }>) => {
    const config = resolveConfig({ valuePreset: 'number' });
    const formatValue = (value: number | null) => value === null ? 'Missing' : String(value);
    return buildSemanticModel({ config, data, formatDifference: ({ value }) => String(value), formatValue, formatXValue: String });
  };

  it('exports localized metadata rows, suppressed states, and leaves numeric negatives unescaped', () => {
    const data = [
      { x: 'Q1', actual: -2, target: 0 },
      { x: 'Q2', actual: 91, actualSuppressed: true, target: 77 },
      { x: 'Q3', actual: null, target: 4, targetSuppressed: true }
    ];
    const model = buildModel(data);
    const csv = buildLineCsv({
      data, model, headers: ['Period', 'Actual', 'Target', 'Outcome'],
      formatPeriod: String, formatValue: String, missing: 'Missing', suppressed: 'Protected', context: '<p>Safe <strong>context</strong></p><script>bad()</script>', dataNote: 'Note',
      contextLabel: 'Context', dataNoteLabel: 'Data note'
    });
    expect(csv).toContain('"Context","Safe context"\r\n"Data note","Note"');
    expect(csv).toContain('"Q1","-2","0"');
    expect(csv).toContain('"Q2","Protected","77"');
    expect(csv).toContain('"Q3","Missing","Protected","Target outcome unavailable"');
    expect(csv).not.toContain('91');
  });

  it('sanitizes rich content with a small allowlist and turns it into plain text', () => {
    const fragment = renderLineRichContent('<p>Useful <strong>note</strong><img src=x onerror=alert(1)><a href="javascript:alert(1)">link</a></p><script>secret()</script>');
    const host = document.createElement('div'); host.append(fragment);
    expect(host.innerHTML).toBe('<p>Useful <strong>note</strong><a>link</a></p>');
    expect(lineRichContentToText('<p>Useful <strong>note</strong></p>')).toBe('Useful note');
  });

  it('escapes formula-like negative text without quoting real negative numbers as text', () => {
    const data = [{ x: '-1+HYPERLINK("https://bad")', actual: -2, target: 0 }];
    const model = buildModel(data);
    const csv = buildLineCsv({ data, model, headers: ['Period', 'Actual', 'Target', 'Outcome'], formatPeriod: String, formatValue: String, missing: 'Missing', suppressed: 'Protected' });
    expect(csv).toContain("\"'-1+HYPERLINK");
    expect(csv).toContain('"-2"');
  });
});

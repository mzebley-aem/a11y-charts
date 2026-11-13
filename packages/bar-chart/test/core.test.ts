import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { buildBarCsv } from '../src/csv.js';
import { ENGLISH_MESSAGES, formatMessage, message, resolveMessages } from '../src/messages.js';
import { buildBarModel } from '../src/semantic-model.js';
import { themeToCssVariables } from '../src/theme.js';
import type { A11yBarChartConfig, A11yBarChartDatum } from '../src/model.js';
import { renderRichContent, richContentToText } from '../src/rich-content.js';
import { validateBarData, validateBarTotal } from '../src/validation.js';

describe('bar chart validation and configuration', () => {
  it('rejects invalid records and duplicate identities with machine-readable errors', () => {
    expect(validateBarData({})).toMatchObject({ valid: false, code: 'validationInvalidData' });
    expect(validateBarData([{ id: '', label: 'A', value: 1 }])).toMatchObject({ valid: false, code: 'validationEmptyId' });
    expect(validateBarData([{ id: 'a', label: 'A', value: 1 }, { id: 'a', label: 'B', value: 2 }])).toMatchObject({ valid: false, code: 'validationDuplicateId', params: { id: 'a' } });
    for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY, '4']) {
      expect(validateBarData([{ id: 'a', label: 'A', value }])).toMatchObject({ valid: false, code: 'validationInvalidValue' });
    }
    expect(validateBarTotal(-1)).toMatchObject({ valid: false, code: 'validationInvalidTotal' });
    expect(validateBarTotal(0)).toEqual({ valid: true, total: 0 });
  });

  it('returns independent data copies and sane immutable configuration defaults', () => {
    const source = [{ id: 'a', label: 'A', value: 2, definition: '<p>Meaning</p>' }];
    const result = validateBarData(source);
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    result.data[0]!.label = 'changed';
    expect(source[0]!.label).toBe('A');
    expect(resolveConfig({ locale: 'no_such_locale', countDecimals: -1, headingLevel: 9 } as unknown as A11yBarChartConfig)).toEqual({
      scaleMode: 'largest', inferTotal: true, dataView: 'dialog', percentScale: 'whole', showSummary: true, showContext: true,
      showActions: true, showExplanation: true, showGlossary: true, showExport: true, explanationExpanded: false,
      glossaryExpanded: false, showCounts: true, showPercentages: true, showTotal: true, showDetails: false, locale: 'en-US', countDecimals: 0,
      percentageDecimals: 2, headingLevel: 2, announceChanges: true,
      targetStyle: 'none', positiveDirection: 'above'
    });
  });

  it('resolves the single data-view setting and the percent scale with safe fallbacks', () => {
    expect(resolveConfig({ dataView: 'none' }).dataView).toBe('none');
    expect(resolveConfig({ dataView: 'inline' }).dataView).toBe('inline');
    expect(resolveConfig({ dataView: 'sideways' } as unknown as A11yBarChartConfig).dataView).toBe('dialog');
    expect(resolveConfig({ percentScale: 'fraction' }).percentScale).toBe('fraction');
    expect(resolveConfig({ percentScale: 'percent' } as unknown as A11yBarChartConfig).percentScale).toBe('whole');
    expect(resolveConfig({ showSummary: false, showExport: false, showCounts: false }).showSummary).toBe(false);
    expect(resolveConfig({ showSummary: false, showExport: false, showCounts: false })).toMatchObject({ showExport: false, showCounts: false });
  });
});

describe('bar semantic model', () => {
  const data: A11yBarChartDatum[] = [
    { id: 'zero', label: 'Zero', value: 0 },
    { id: 'one', label: 'One', value: 10 },
    { id: 'missing', label: 'Missing', value: null }
  ];

  it('distinguishes a supplied zero total from an omitted total', () => {
    expect(buildBarModel([{ id: 'z', label: 'Zero', value: 0 }], { total: 0 }).rows[0]!.percentage).toBeNull();
    expect(buildBarModel([{ id: 'z', label: 'Zero', value: 0 }]).total).toBe(0);
  });

  it('suppresses only zero values and keeps filtered zeros visible', () => {
    const model = buildBarModel(data, { total: 20, suppressed: true, filtered: true });
    expect(model.rows.map((row) => row.status)).toEqual(['suppressed', 'reported', 'missing']);
    expect(model.rows[0]).toMatchObject({ valueText: 'Suppressed', percentage: null, barRatio: 0 });
    expect(model.rows[1]!.valueText).toBe('10');
    expect(model.rows[1]!.percentage).toBe(0.5);
    expect(model.indicators).toEqual(['Suppressed', 'Filtered']);
  });

  it('keeps unknown denominators unknown and applies both scale modes safely', () => {
    const unknown = buildBarModel(data, { suppressed: true, config: { scaleMode: 'population-share' } });
    expect(unknown.total).toBeNull();
    expect(unknown.totalText).toBe('Suppressed');
    expect(unknown.rows[1]!.percentage).toBeNull();
    expect(unknown.rows[1]!.barRatio).toBe(0);

    const population = buildBarModel(data, { total: 5, config: { scaleMode: 'population-share' } });
    expect(population.rows[1]!.percentage).toBe(2);
    expect(population.rows[1]!.barRatio).toBe(1);
    expect(population.warnings).toHaveLength(1);
    const largest = buildBarModel(data, { total: 100, config: { scaleMode: 'largest' } });
    expect(largest.rows[1]!.barRatio).toBe(1);
    expect(largest.rows[0]!.barRatio).toBe(0);
  });

  it('preserves input order, does not mutate data, and distinguishes empty from all-zero', () => {
    const input = structuredClone(data);
    const model = buildBarModel(input, { filtered: true });
    expect(input).toEqual(data);
    expect(model.rows.map((row) => row.id)).toEqual(['zero', 'one', 'missing']);
    expect(buildBarModel([]).summary).toBe('No category data has been reported.');
    expect(buildBarModel([{ id: 'zero', label: 'Zero', value: 0 }]).summary).toBe('The single reported category has a value of zero.');
  });

  it('summarizes the largest or tied largest values in display order, and stays conservative for incomplete data', () => {
    const unsorted = buildBarModel([
      { id: 'small', label: 'Small', value: 2 },
      { id: 'leader-a', label: 'Alpha', value: 8 },
      { id: 'leader-c', label: 'Charlie', value: 8 }
    ]);
    expect(unsorted.summary).toBe('Alpha and Charlie share the largest reported value at 8, or 44.44% of the reported total.');

    const incomplete = buildBarModel([
      { id: 'first', label: 'First', value: 2 },
      { id: 'larger', label: 'Larger', value: 8 },
      { id: 'unknown', label: 'Unknown', value: null }
    ]);
    expect(incomplete.summary).toContain('Reported values include First at 2.');
    expect(incomplete.summary).not.toContain('largest');
    const suppressed = buildBarModel([
      { id: 'one', label: 'Visible', value: 8 },
      { id: 'zero', label: 'Protected', value: 0 }
    ], { suppressed: true, total: 10 });
    expect(suppressed.summary).toContain('Reported values include Visible at 8.');
    expect(suppressed.summary).not.toContain('largest');
  });

  it('marks invalid direct totals unavailable and exposes a localized warning', () => {
    const model = buildBarModel([{ id: 'a', label: 'A', value: 1 }], { total: Number.NaN });
    expect(model.total).toBeNull();
    expect(model.rows[0]!.percentageText).toBe('Unavailable');
    expect(model.warnings).toContain('The total must be a finite, nonnegative number.');
  });

  it('keeps overflowed inferred totals and count-to-total ratios unavailable', () => {
    const sumOverflow = buildBarModel([
      { id: 'first', label: 'First', value: 1e308 },
      { id: 'second', label: 'Second', value: 1e308 }
    ]);
    expect(sumOverflow.total).toBeNull();
    expect(sumOverflow.totalText).toBe('Unavailable');
    expect(sumOverflow.rows.every((row) => row.percentage === null && row.percentageText === 'Unavailable')).toBe(true);
    expect(sumOverflow.warnings).toContain(ENGLISH_MESSAGES.warningComputedTotalOverflow);
    expect(JSON.stringify(sumOverflow)).not.toMatch(/Infinity|NaN/);

    const ratioOverflow = buildBarModel([
      { id: 'large', label: 'Large', value: 1e308 }
    ], { total: 1e-308, config: { scaleMode: 'population-share' } });
    expect(ratioOverflow.rows[0]).toMatchObject({ percentage: null, percentageText: 'Unavailable', barRatio: 0 });
    expect(ratioOverflow.warnings.some((warning) => warning.includes('percentage for Large is unavailable'))).toBe(true);
    expect(JSON.stringify(ratioOverflow)).not.toMatch(/Infinity|NaN/);
  });

  it('uses a supplied formatter consistently across reported values and total', () => {
    const calls: Array<{ value: number; series: string; id?: string }> = [];
    const model = buildBarModel([
      { id: 'a', label: 'Alpha', value: 4 },
      { id: 'zero', label: 'Zero', value: 0 }
    ], {
      total: 8,
      formatValue: ({ value, series, id }) => {
        calls.push({ value, series, ...(id ? { id } : {}) });
        return `${series}:${value}`;
      }
    });
    expect(model.rows.map((row) => [row.valueText, row.percentageText])).toEqual([
      ['count:4', 'percentage:50'],
      ['count:0', 'percentage:0']
    ]);
    expect(model.totalText).toBe('total:8');
    expect(model.rows[0]!.narrative).toContain('count:4');
    expect(model.rows[0]!.narrative).toContain('percentage:50');
    expect(calls).toEqual([
      { value: 8, series: 'total' },
      { value: 4, series: 'count', id: 'a' },
      { value: 50, series: 'percentage', id: 'a' },
      { value: 0, series: 'count', id: 'zero' },
      { value: 0, series: 'percentage', id: 'zero' }
    ]);
  });

  it('passes fractional percentages to the formatter only when percentScale is fraction', () => {
    const calls: number[] = [];
    const formatValue = ({ value, series }: { value: number; series: string }) => {
      if (series === 'percentage') calls.push(value);
      return `${series}:${value}`;
    };
    const rows = [{ id: 'a', label: 'Alpha', value: 4 }, { id: 'b', label: 'Beta', value: 1 }];
    const whole = buildBarModel(rows, { total: 8, formatValue });
    const fraction = buildBarModel(rows, { total: 8, formatValue, config: { percentScale: 'fraction' } });
    expect(calls).toEqual([50, 12.5, 0.5, 0.125]);
    expect(whole.rows[0]!.percentage).toBe(0.5);
    expect(fraction.rows[0]!.percentage).toBe(0.5);
    expect(fraction.rows[0]!.percentageText).toBe('percentage:0.5');
  });

  it('never formats missing or suppressed values and falls back for invalid formatter output', () => {
    const calls: string[] = [];
    const model = buildBarModel([
      { id: 'protected', label: 'Protected', value: 0 },
      { id: 'missing', label: 'Missing', value: null },
      { id: 'reported', label: 'Reported', value: 2 }
    ], {
      total: 4,
      suppressed: true,
      formatValue: ({ series, id }) => {
        calls.push(`${series}:${id ?? ''}`);
        if (series === 'total') throw new Error('custom format failed');
        if (series === 'count') return 42 as unknown as string;
        return '';
      }
    });
    expect(calls).toEqual(['total:', 'count:reported', 'percentage:reported']);
    expect(model.rows.map((row) => row.status)).toEqual(['suppressed', 'missing', 'reported']);
    expect(model.rows.map((row) => row.valueText)).toEqual(['Suppressed', 'Not reported', '2']);
    expect(model.rows[2]!.percentageText).toBe('50.00%');
    expect(model.totalText).toBe('4');
  });

  it('falls back on English message entries and supports reordered whole templates/plurals', () => {
    expect(resolveMessages({ title: 'Resultados', total: 3 } as never).title).toBe('Resultados');
    expect(resolveMessages({ title: 'Resultados' }).empty).toBe(ENGLISH_MESSAGES.empty);
    expect(formatMessage('{count} items', { count: 2 })).toBe('2 items');
    expect(message('summaryAllZero', { 'summaryAllZero.one': 'Zero: {count}', 'summaryAllZero.other': 'Zeros: {count}' }, { count: 2 })).toBe('Zeros: 2');
    expect(message('summaryAllZero', {
      'summaryAllZero.zero': 'Aucune catégorie.',
      'summaryAllZero.one': 'Une catégorie sur {count} est à zéro.',
      'summaryAllZero.other': '{count} catégories sont à zéro.'
    }, { count: 0 }, 'ar')).toBe('Aucune catégorie.');
    expect(message('summaryAllZero', { 'summaryAllZero.one': 'Uno', 'summaryAllZero.other': 'Muchos' }, { count: 1 }, 'not_a_locale')).toBe('Uno');
    expect(formatMessage('{label} representa {percentage}', { label: 'A', percentage: '50%' })).toBe('A representa 50%');
  });
});

describe('rich content and CSV output', () => {
  it('allows supported formatting while removing scripts, styles, unsafe URLs and collisions', () => {
    const fragment = renderRichContent('<p id="collision" onclick="x()">Read <strong>this</strong><script>alert(1)</script> <a href="javascript:alert(1)" style="color:red">link</a> <a href="https://example.test" target="_blank">safe</a> <a href="resources/details">relative</a></p><p>Second paragraph</p>');
    const host = document.createElement('div');
    host.append(fragment);
    expect(host.querySelector('script')).toBeNull();
    expect(host.querySelector('[onclick], [style], [id]')).toBeNull();
    expect(host.querySelector('a[href="javascript:alert(1)"]')).toBeNull();
    expect(host.querySelector('a[target]')).toBeNull();
    expect(host.querySelector('a[href="https://example.test"]')).not.toBeNull();
    expect(host.querySelector('a[href="resources/details"]')).not.toBeNull();
    expect(richContentToText(host.innerHTML)).toBe('Read this link safe relative\nSecond paragraph');
  });

  it('quotes CSV correctly, includes the total, and neutralizes formula-like labels', () => {
    const model = buildBarModel([
      { id: 'formula', label: '=SUM(A1:A2)', value: 2 },
      { id: 'quoted', label: 'Label, "quoted"', value: null }
    ], { total: 4 });
    expect(buildBarCsv(model)).toBe([
      'Category,Count,Percentage of total',
      "'=SUM(A1:A2),2,50.00%",
      '"Label, ""quoted""",Not reported,Unavailable',
      'Total,4,'
    ].join('\r\n'));
  });

  it('adds only supplied CSV metadata as localized plain-text rows before the header', () => {
    const model = buildBarModel([{ id: 'a', label: 'A', value: 1 }]);
    const csv = buildBarCsv(model, {
      context: '<p>Local <strong>context</strong></p><script>do not export</script>',
      dataNote: 'Updated, 2026',
      messages: { csvContextLabel: 'Contexte', csvDataNoteLabel: 'Note des données' },
      locale: 'fr-FR'
    });
    expect(csv.split('\r\n').slice(0, 3)).toEqual([
      'Contexte,Local context',
      'Note des données,"Updated, 2026"',
      'Category,Count,Percentage of total'
    ]);
    expect(csv).not.toContain('<p>');
    expect(csv).not.toContain('do not export');
    expect(buildBarCsv(model)).toBe(buildBarCsv(model, { context: '  ', dataNote: '' }));
  });

  it('maps typed theme keys to CSS variables without mutating source', () => {
    const theme = { color: '#123456', borderRadius: '1rem', buttonPadding: '0.5rem 1rem' } as const;
    expect(themeToCssVariables(theme)).toEqual({
      '--a11y-bar-chart-color': '#123456',
      '--a11y-bar-chart-border-radius': '1rem',
      '--a11y-bar-chart-button-padding': '0.5rem 1rem'
    });
    expect(theme).toEqual({ color: '#123456', borderRadius: '1rem', buttonPadding: '0.5rem 1rem' });
    expect(themeToCssVariables({ color: '  ', surface: 3 as never })).toEqual({});
  });

  it('resolves named textures, independent mark colors, and safe solid fallbacks', () => {
    for (const patternType of ['diagonal', 'horizontal', 'dots'] as const) {
      const theme = Object.freeze({ patternType, patternColor: ' #ffe566 ' });
      const variables = themeToCssVariables(theme);
      expect(variables['--a11y-bar-chart-pattern-image']).not.toBe('none');
      expect(variables['--a11y-bar-chart-pattern-color']).toBe('#ffe566');
      expect(variables['--a11y-bar-chart-pattern-size']).toBe(patternType === 'dots' ? '12px 12px' : 'auto');
    }
    for (const patternType of ['none', 'url(https://example.org/untrusted.svg)', null] as const) {
      expect(themeToCssVariables({ patternType: patternType as never })).toEqual({
        '--a11y-bar-chart-pattern-image': 'none', '--a11y-bar-chart-pattern-size': 'auto'
      });
    }
    expect(themeToCssVariables({})).toEqual({});
  });
});

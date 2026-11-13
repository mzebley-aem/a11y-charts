import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { ENGLISH_LINE_CHART_MESSAGES, formatLineMessage, pluralLineMessage } from '../src/messages.js';

describe('line chart messages', () => {
  it('uses the shared complete-data, not-reported, and disclosure toggle defaults', () => {
    expect(ENGLISH_LINE_CHART_MESSAGES.dataAction).toBe('View complete data');
    expect(ENGLISH_LINE_CHART_MESSAGES.inlineData).toBe('View complete data');
    expect(ENGLISH_LINE_CHART_MESSAGES.missing).toBe('Not reported');
    expect(ENGLISH_LINE_CHART_MESSAGES.explain).toBe('Explain');
    expect(ENGLISH_LINE_CHART_MESSAGES.hideExplanation).toBe('Hide explanation');
    expect(ENGLISH_LINE_CHART_MESSAGES.glossary).toBe('Glossary');
    expect(ENGLISH_LINE_CHART_MESSAGES.hideGlossary).toBe('Hide glossary');
    expect(resolveConfig(undefined).describeMissingAs).toBe('Not reported');
  });

  it('substitutes named values without evaluating markup or unknown placeholders', () => {
    expect(formatLineMessage('<b>{value}</b> {unknown}', { value: '<script>' }))
      .toBe('<b><script></b> {unknown}');
  });

  it('selects locale plural variants and falls back to other for absent categories', () => {
    expect(pluralLineMessage({ 'summaryPeriods.few': '{met} of {total} few' }, 'summaryPeriods', 2, 'ru', { met: 1, total: 2 }))
      .toBe('1 of 2 few');
    expect(pluralLineMessage({ 'summaryPeriods.other': '{met}/{total}' }, 'summaryPeriods', 1, 'ru', { met: 1, total: 1 }))
      .toBe('1/1');
    expect(pluralLineMessage({}, 'dataUpdated', 2, 'not_a_locale', { count: 2 }))
      .toBe('Chart data updated. 2 periods are available.');
  });
});

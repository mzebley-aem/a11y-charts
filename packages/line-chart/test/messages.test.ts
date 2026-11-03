import { describe, expect, it } from 'vitest';
import { formatLineMessage, pluralLineMessage } from '../src/messages.js';

describe('line chart messages', () => {
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

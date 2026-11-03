import { describe, expect, it } from 'vitest';
import { ENGLISH_MESSAGES, createMessageResolver, formatMessage, message, resolveMessages } from '../src/messages.js';
import { buildBarModel } from '../src/semantic-model.js';

describe('bar message override hardening', () => {
  it('ignores inherited keys and blank overrides', () => {
    const inherited = Object.create({ title: 'inherited', toString: 'unsafe' }) as Record<string, string>;
    inherited.subtitle = '   ';
    inherited['summaryAllZero.one'] = '';
    expect(resolveMessages(inherited)).toMatchObject({ title: ENGLISH_MESSAGES.title, subtitle: ENGLISH_MESSAGES.subtitle });
    expect(message('summaryAllZero', inherited, { count: 1 })).toBe('The single reported category has a value of zero.');
  });

  it('keeps resolver output aligned with the public message API for localized plural categories', () => {
    const overrides = {
      'summaryAllZero.one': 'one: {count}',
      'summaryAllZero.few': 'few: {count}',
      'summaryAllZero.other': 'other: {count}',
      'announcementDataUpdated.one': 'updated one',
      'announcementDataUpdated.other': 'updated other'
    };
    const translate = createMessageResolver(overrides, 'ru-RU');

    for (const count of [1, 2, 5, 21, Number.NaN]) {
      expect(translate('summaryAllZero', { count })).toBe(message('summaryAllZero', overrides, { count }, 'ru-RU'));
      expect(translate('announcementDataUpdated', { count })).toBe(message('announcementDataUpdated', overrides, { count }, 'ru-RU'));
    }
    expect(formatMessage('Count {count}', { count: 3 }, 'not_a_locale')).toBe('Count 3');
  });

  it('resolves a catalog once per model and preserves custom plural messages', () => {
    const model = buildBarModel([{ id: 'only', label: 'Only', value: 0 }], {
      config: { locale: 'en-US' },
      messages: { 'summaryAllZero.one': 'Custom single zero.' }
    });
    expect(model.summary).toBe('Custom single zero.');
  });
});

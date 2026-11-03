import { describe, expect, it } from 'vitest';
import { ENGLISH_MESSAGES } from '../src/messages.js';
import { BAR_DEMO_MESSAGES, BAR_DEMO_PAGE_MESSAGES, getBarDemoContent } from '../demo/locales.js';

describe('bar chart demo localization', () => {
  it('provides complete catalogs for every component-owned message', () => {
    const keys = Object.keys(ENGLISH_MESSAGES).sort();
    for (const locale of ['en-US', 'fr-FR', 'es-ES'] as const) {
      expect(Object.keys(BAR_DEMO_MESSAGES[locale]).sort()).toEqual(keys);
      for (const key of keys) expect(typeof BAR_DEMO_MESSAGES[locale][key as keyof typeof ENGLISH_MESSAGES]).toBe('string');
    }
    expect(BAR_DEMO_MESSAGES['fr-FR'].showData).toBe('Voir toutes les données');
    expect(BAR_DEMO_MESSAGES['es-ES'].showData).toBe('Ver todos los datos');
    expect(BAR_DEMO_MESSAGES['fr-FR']['summaryLargestCategory']).toContain('valeur déclarée');
    expect(BAR_DEMO_MESSAGES['es-ES']['summaryLargestCategory']).toContain('valor notificado');
    expect(BAR_DEMO_MESSAGES['fr-FR']['warningPercentageOverflow']).toContain('indisponible');
    expect(BAR_DEMO_MESSAGES['es-ES']['warningPercentageOverflow']).toContain('no está disponible');
    expect(BAR_DEMO_MESSAGES['fr-FR']['announcementDataUpdated.other']).toContain('mises à jour');
    expect(BAR_DEMO_MESSAGES['es-ES']['announcementDataUpdated.other']).toContain('actualizaron');
  });

  it('localizes page-owned controls and surrounding copy without translating language names', () => {
    expect(BAR_DEMO_PAGE_MESSAGES['fr-FR'].controlsHeading).toBe('Essayer le composant');
    expect(BAR_DEMO_PAGE_MESSAGES['fr-FR'].scalePopulationShare).toBe('Part de la population');
    expect(BAR_DEMO_PAGE_MESSAGES['es-ES'].referenceHeading).toBe('Casos de referencia');
    expect(BAR_DEMO_PAGE_MESSAGES['es-ES'].footer).toContain('Los controles');
    expect(BAR_DEMO_PAGE_MESSAGES['fr-FR'].documentTitle).not.toBe(BAR_DEMO_PAGE_MESSAGES['en-US'].documentTitle);
  });

  it('localizes all four displayed examples and alternate data with stable values, totals, ids, and order', () => {
    const english = getBarDemoContent('en-US');
    for (const locale of ['fr-FR', 'es-ES'] as const) {
      const translated = getBarDemoContent(locale);
      expect(translated).toHaveLength(5); // Four displayed charts plus the alternate primary dataset.
      for (let index = 0; index < english.length; index += 1) {
        const source = english[index]!;
        const localized = translated[index]!;
        expect(localized.title).not.toBe(source.title);
        expect(localized.subtitle).not.toBe(source.subtitle);
        expect(localized.total).toBe(source.total);
        expect(localized.data.map(({ id }) => id)).toEqual(source.data.map(({ id }) => id));
        expect(localized.data.map(({ value }) => value)).toEqual(source.data.map(({ value }) => value));
        expect(localized.data.map(({ label }) => label)).not.toEqual(source.data.map(({ label }) => label));
        expect(localized.context).not.toBe(source.context);
        expect(localized.dataNote).not.toBe(source.dataNote);
      }
      expect(translated[0]!.data.map(({ value }) => value)).toEqual([89, 25, 11]);
      expect(translated[1]!.data.map(({ value }) => value)).toEqual([72, 18, null]);
      expect(translated[2]!.data.map(({ value }) => value)).toEqual([14, 13]);
      expect(translated[3]!.data.map(({ value }) => value)).toEqual([290, 220, 0]);
      expect(translated[4]!.data.map(({ value }) => value)).toEqual([46, 35, 19]);
      expect(translated[0]!.data.every(({ definition }) => definition && !definition.includes('Illustrative'))).toBe(true);
      expect(translated[4]!.data.map(({ definition }) => definition)).toEqual(locale === 'fr-FR'
        ? ['<p>Programmes de la zone de service nord.</p>', '<p>Programmes de la zone de service centrale.</p>', '<p>Programmes de la zone de service sud.</p>']
        : ['<p>Programas de la zona de servicio norte.</p>', '<p>Programas de la zona de servicio central.</p>', '<p>Programas de la zona de servicio sur.</p>']);
    }
  });
});

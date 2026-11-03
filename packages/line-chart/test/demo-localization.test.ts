import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { buildSemanticModel } from '../src/semantic-model.js';
import { ENGLISH_LINE_CHART_MESSAGES, formatLineMessage, pluralLineMessage } from '../src/messages.js';
import { LINE_DEMO_CONTENT, LINE_DEMO_MESSAGES, type DemoLocale } from '../demo/locales.js';
import type { A11yLineChartDatum } from '../src/model.js';

const locales: DemoLocale[] = ['en-US', 'fr-FR', 'es-ES'];

function semanticExample(
  locale: Exclude<DemoLocale, 'en-US'>,
  data: A11yLineChartDatum[] = [{ x: 2024, actual: 72, target: 70 }]
) {
  const messages = LINE_DEMO_MESSAGES[locale];
  const content = LINE_DEMO_CONTENT[locale];
  const config = resolveConfig({
    locale,
    actualSeriesLabel: content.actualSeriesLabel,
    targetSeriesLabel: content.targetSeriesLabel,
    baselineSeriesLabel: content.baselineSeriesLabel,
    xAxisTitle: content.yearLabel,
    yAxisTitle: content.percentLabel,
    valuePreset: 'percent'
  });
  const translate = (key: string, values: Record<string, unknown> = {}): string => {
    if (key === 'summaryPeriods') {
      return pluralLineMessage(messages, 'summaryPeriods', Number(values['total'] ?? 0), locale, values);
    }
    return formatLineMessage(messages[key as keyof typeof messages] ?? ENGLISH_LINE_CHART_MESSAGES[key as keyof typeof ENGLISH_LINE_CHART_MESSAGES] ?? key, values);
  };
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return buildSemanticModel({
    baseline: { x: data[0]?.x ?? 2024, value: 60, explanation: content.baselineExplanations[0] },
    config,
    data,
    formatDifference: ({ value }) => pluralLineMessage(messages, 'differencePercent', value, locale, { value: number.format(value) }),
    formatValue: (value) => value === null ? messages.missing : `${number.format(value)} %`,
    formatXValue: (value) => String(value),
    message: translate
  });
}

describe('line chart demo localization', () => {
  it('provides every component message key for each supported locale', () => {
    const required = Object.keys(ENGLISH_LINE_CHART_MESSAGES).sort();
    for (const locale of locales) {
      expect(Object.keys(LINE_DEMO_MESSAGES[locale]).sort(), locale).toEqual(required);
      expect(Object.values(LINE_DEMO_MESSAGES[locale]).every((value) => typeof value === 'string')).toBe(true);
    }
  });

  it('translates generated narratives, comparisons, and baseline context as whole sentences', () => {
    const french = semanticExample('fr-FR');
    expect(french.points[0]?.narrative).toContain('Résultat');
    expect(french.points[0]?.narrative).toContain('Objectif atteint');
    expect(french.points[0]?.targetDifference?.description).toBe('Écart de 2 points de pourcentage par rapport à « objectif » : au-dessus');
    expect(french.summary.primary).toContain('Objectif atteint');
    expect(french.summary.text).toContain('Résultat : Écart de 12 points de pourcentage par rapport à « la valeur de référence pour 2024 » : au-dessus (référence : 60 %).');
    expect(french.summary.text).not.toContain(' the ');
    expect(french.summary.text).not.toMatch(/\.\./);

    const spanish = semanticExample('es-ES');
    expect(spanish.points[0]?.narrative).toContain('Resultado');
    expect(spanish.points[0]?.narrative).toContain('Meta alcanzada');
    expect(spanish.points[0]?.targetDifference?.description).toBe('Diferencia de 2 puntos porcentuales respecto a «meta»: por encima');
    expect(spanish.summary.primary).toContain('Meta alcanzada');
    expect(spanish.summary.text).toContain('Resultado: Diferencia de 12 puntos porcentuales respecto a «la referencia para 2024»: por encima (referencia: 60 %).');
    expect(spanish.summary.text).not.toContain(' the ');
    expect(spanish.summary.text).not.toMatch(/\.\./);

    const frenchBelow = semanticExample('fr-FR', [{ x: 2024, actual: 65, target: 70 }]);
    expect(frenchBelow.points[0]?.targetDifference?.description).toBe('Écart de 5 points de pourcentage par rapport à « objectif » : en dessous');
    const spanishBelow = semanticExample('es-ES', [{ x: 2024, actual: 65, target: 70 }]);
    expect(spanishBelow.points[0]?.targetDifference?.description).toBe('Diferencia de 5 puntos porcentuales respecto a «meta»: por debajo');

    const frenchLowerBound = semanticExample('fr-FR', [{ x: 2024, actual: 65, target: { min: 70, max: 80 } }]);
    expect(frenchLowerBound.points[0]?.targetDifference?.description).toContain('« limite inférieure de la plage (objectif) »');
    const spanishLowerBound = semanticExample('es-ES', [{ x: 2024, actual: 65, target: { min: 70, max: 80 } }]);
    expect(spanishLowerBound.points[0]?.targetDifference?.description).toContain('«límite inferior del rango (meta)»');
    expect(spanishLowerBound.points[0]?.targetDifference?.description).not.toContain('de el');

    const frenchEqual = semanticExample('fr-FR', [{ x: 2024, actual: 72, target: 72 }]);
    expect(frenchEqual.summary.text).toContain('Résultat a égalé « objectif » à');
    const spanishEqual = semanticExample('es-ES', [{ x: 2024, actual: 72, target: 72 }]);
    expect(spanishEqual.summary.text).toContain('Resultado igualó «meta» en');

    const manyPeriods = semanticExample('es-ES', Array.from({ length: 6 }, (_, index) => ({
      x: 2024 + index, actual: index === 0 ? 71 : 69, target: 70
    })));
    expect(manyPeriods.summary.text).toContain('Periodos comparables informados: 6; periodos con la meta alcanzada: 1.');
  });

  it('uses translated plural sentences and supports reordered placeholders', () => {
    expect(pluralLineMessage(LINE_DEMO_MESSAGES['fr-FR'], 'summaryPeriods', 1, 'fr-FR', { met: 1, total: 1 }))
      .toBe('Période comparable publiée : 1 ; périodes avec objectif atteint : 1.');
    expect(pluralLineMessage(LINE_DEMO_MESSAGES['fr-FR'], 'summaryPeriods', 2, 'fr-FR', { met: 1, total: 2 }))
      .toBe('Périodes comparables publiées : 2 ; périodes avec objectif atteint : 1.');
    expect(pluralLineMessage(LINE_DEMO_MESSAGES['es-ES'], 'dataUpdated', 1, 'es-ES', { count: 1 }))
      .toBe('Datos del gráfico actualizados. Hay 1 periodo disponible.');
    expect(pluralLineMessage(LINE_DEMO_MESSAGES['es-ES'], 'dataUpdated', 3, 'es-ES', { count: 3 }))
      .toBe('Datos del gráfico actualizados. Hay 3 periodos disponibles.');
    expect(formatLineMessage(LINE_DEMO_MESSAGES['es-ES'].summaryMissingTarget, {
      actual: 'Resultado', target: 'Meta', value: '72 %'
    })).toBe('No se informó ningún valor de Meta, aunque Resultado registró 72 %.');
    expect(pluralLineMessage(LINE_DEMO_MESSAGES['fr-FR'], 'differencePercent', 2, 'fr-FR', { value: '2' }))
      .toBe('2 points de pourcentage');
  });

  it('includes authored page, chart, context, baseline, axis, and selector copy in every language', () => {
    for (const locale of locales) {
      const copy = LINE_DEMO_CONTENT[locale];
      expect(copy.chartTitles).toHaveLength(3);
      expect(copy.subtitles).toHaveLength(3);
      expect(copy.contextNotes).toHaveLength(3);
      expect(copy.baselineExplanations).toHaveLength(2);
      expect(copy.quarterPeriods).toHaveLength(6);
      expect(copy.documentTitle).toBeTruthy();
      expect(copy.pageTitle).toBeTruthy();
      expect(copy.introduction).toBeTruthy();
      expect(copy.languageLabel).toBeTruthy();
      expect(copy.languageOptions).toHaveLength(3);
      expect(copy.dialogButton).toBeTruthy();
      expect(copy.inlineButton).toBeTruthy();
      expect(copy.updateButton).toBeTruthy();
    }
    expect(LINE_DEMO_CONTENT['fr-FR'].chartTitles[2]).not.toBe(LINE_DEMO_CONTENT['en-US'].chartTitles[2]);
    expect(LINE_DEMO_CONTENT['es-ES'].baselineExplanations[0]).not.toBe(LINE_DEMO_CONTENT['en-US'].baselineExplanations[0]);
  });
});

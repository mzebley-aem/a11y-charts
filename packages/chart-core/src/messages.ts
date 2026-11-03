/** Pure interpolation and locale-aware plural selection shared by chart packages. */
export function formatTemplate(
  template: string,
  values: Record<string, unknown> = {},
  placeholderPattern = '\\{([\\w]+)\\}'
): string {
  return template.replace(new RegExp(placeholderPattern, 'g'), (whole, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole
  );
}

export function createPluralSelector(locale: string): (count: number) => Intl.LDMLPluralRule {
  let rules: Intl.PluralRules;
  try {
    rules = new Intl.PluralRules(Intl.getCanonicalLocales(locale)[0] ?? 'en-US');
  } catch {
    rules = new Intl.PluralRules('en-US');
  }
  return (count) => Number.isFinite(count) ? rules.select(count) : 'other';
}

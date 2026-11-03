import type { A11yBarChartTheme } from './model.js';

export type A11yBarChartThemeVariable =
  | '--a11y-bar-chart-color'
  | '--a11y-bar-chart-target-color'
  | '--a11y-bar-chart-positive-color'
  | '--a11y-bar-chart-negative-color'
  | '--a11y-bar-chart-positive-pattern-color'
  | '--a11y-bar-chart-negative-pattern-color'
  | '--a11y-bar-chart-positive-pattern-image'
  | '--a11y-bar-chart-negative-pattern-image'
  | '--a11y-bar-chart-positive-pattern-size'
  | '--a11y-bar-chart-negative-pattern-size'
  | '--a11y-bar-chart-pattern-image'
  | '--a11y-bar-chart-pattern-size'
  | '--a11y-bar-chart-pattern-color'
  | '--a11y-bar-chart-track'
  | '--a11y-bar-chart-text'
  | '--a11y-bar-chart-muted'
  | '--a11y-bar-chart-border'
  | '--a11y-bar-chart-focus'
  | '--a11y-bar-chart-surface'
  | '--a11y-bar-chart-space'
  | '--a11y-bar-chart-font'
  | '--a11y-bar-chart-bar-height'
  | '--a11y-bar-chart-border-radius'
  | '--a11y-bar-chart-button-radius'
  | '--a11y-bar-chart-font-size'
  | '--a11y-bar-chart-title-font-size'
  | '--a11y-bar-chart-line-height'
  | '--a11y-bar-chart-gap'
  | '--a11y-bar-chart-row-gap'
  | '--a11y-bar-chart-button-padding';

const VARIABLE_BY_KEY: Record<Exclude<keyof A11yBarChartTheme, 'patternType' | 'positivePatternType' | 'negativePatternType'>, A11yBarChartThemeVariable> = {
  color: '--a11y-bar-chart-color',
  targetColor: '--a11y-bar-chart-target-color',
  positiveColor: '--a11y-bar-chart-positive-color',
  negativeColor: '--a11y-bar-chart-negative-color',
  positivePatternColor: '--a11y-bar-chart-positive-pattern-color',
  negativePatternColor: '--a11y-bar-chart-negative-pattern-color',
  patternColor: '--a11y-bar-chart-pattern-color',
  track: '--a11y-bar-chart-track',
  text: '--a11y-bar-chart-text',
  muted: '--a11y-bar-chart-muted',
  border: '--a11y-bar-chart-border',
  focus: '--a11y-bar-chart-focus',
  surface: '--a11y-bar-chart-surface',
  space: '--a11y-bar-chart-space',
  font: '--a11y-bar-chart-font',
  barHeight: '--a11y-bar-chart-bar-height',
  borderRadius: '--a11y-bar-chart-border-radius',
  buttonRadius: '--a11y-bar-chart-button-radius',
  fontSize: '--a11y-bar-chart-font-size',
  titleFontSize: '--a11y-bar-chart-title-font-size',
  lineHeight: '--a11y-bar-chart-line-height',
  gap: '--a11y-bar-chart-gap',
  rowGap: '--a11y-bar-chart-row-gap',
  buttonPadding: '--a11y-bar-chart-button-padding'
};

/** Maps authored theme values to CSS custom properties without mutating input. */
export function themeToCssVariables(theme?: A11yBarChartTheme | null): Partial<Record<A11yBarChartThemeVariable, string>> {
  if (!theme || typeof theme !== 'object') return {};
  const result: Partial<Record<A11yBarChartThemeVariable, string>> = {};
  for (const [key, variable] of Object.entries(VARIABLE_BY_KEY) as Array<[keyof A11yBarChartTheme, A11yBarChartThemeVariable]>) {
    const value = theme[key];
    if (typeof value === 'string' && value.trim()) result[variable] = value.trim();
  }
  for (const [key, imageVariable, sizeVariable] of [
    ['patternType', '--a11y-bar-chart-pattern-image', '--a11y-bar-chart-pattern-size'],
    ['positivePatternType', '--a11y-bar-chart-positive-pattern-image', '--a11y-bar-chart-positive-pattern-size'],
    ['negativePatternType', '--a11y-bar-chart-negative-pattern-image', '--a11y-bar-chart-negative-pattern-size']
  ] as const) {
    if (theme[key] === undefined) continue;
    // Only named patterns become CSS. Unknown runtime values safely render solid.
    let image = 'none';
    let size = 'auto';
    switch (theme[key]) {
      case 'diagonal':
        image = 'repeating-linear-gradient(135deg, transparent 0 6px, currentColor 6px 8px)';
        break;
      case 'horizontal':
        image = 'repeating-linear-gradient(0deg, transparent 0 6px, currentColor 6px 8px)';
        break;
      case 'dots':
        image = 'radial-gradient(circle at 3px 3px, currentColor 2px, transparent 2.5px)';
        size = '12px 12px';
        break;
    }
    result[imageVariable] = image;
    result[sizeVariable] = size;
  }
  return result;
}

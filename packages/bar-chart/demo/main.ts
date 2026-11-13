import '../src/define.ts';
import '../src/styles.css';
import './page.css';
import type { A11yBarChartConfig, A11yBarChartPattern, A11yBarChartTargetStyle, A11yBarChartValueFormatContext } from '../src/index.js';
import type { A11yBarChartElement } from '../src/a11y-bar-chart-element.js';
import { BAR_DEMO_MESSAGES, BAR_DEMO_PAGE_MESSAGES, getBarDemoContent, type BarDemoLocale } from './locales.js';

const charts = Array.from(document.querySelectorAll<A11yBarChartElement>('a11y-bar-chart'));
const scale = document.querySelector<HTMLSelectElement>('#scale-mode')!;
const dataView = document.querySelector<HTMLSelectElement>('#data-view')!;
const localeSelect = document.querySelector<HTMLSelectElement>('#locale')!;
const filtered = document.querySelector<HTMLInputElement>('#filtered')!;
const suppressed = document.querySelector<HTMLInputElement>('#suppressed')!;
const replaceData = document.querySelector<HTMLInputElement>('#replace-data')!;
const themeSelect = document.querySelector<HTMLSelectElement>('#theme')!;
const textureSelect = document.querySelector<HTMLSelectElement>('#texture')!;
const formatterSelect = document.querySelector<HTMLSelectElement>('#formatter')!;
const targetStyle = document.querySelector<HTMLSelectElement>('#target-style')!;
const positiveDirection = document.querySelector<HTMLSelectElement>('#positive-direction')!;
const positiveColor = document.querySelector<HTMLInputElement>('#positive-color')!;
const negativeColor = document.querySelector<HTMLInputElement>('#negative-color')!;
const positiveTexture = document.querySelector<HTMLSelectElement>('#positive-texture')!;
const negativeTexture = document.querySelector<HTMLSelectElement>('#negative-texture')!;
const optionControls = {
  showDetails: document.querySelector<HTMLInputElement>('#show-details')!,
  showSummary: document.querySelector<HTMLInputElement>('#show-summary')!,
  showContext: document.querySelector<HTMLInputElement>('#show-context')!,
  showActions: document.querySelector<HTMLInputElement>('#show-actions')!,
  showExplanation: document.querySelector<HTMLInputElement>('#show-explanation')!,
  showGlossary: document.querySelector<HTMLInputElement>('#show-glossary')!,
  showExport: document.querySelector<HTMLInputElement>('#show-export')!,
  showCounts: document.querySelector<HTMLInputElement>('#show-counts')!,
  showPercentages: document.querySelector<HTMLInputElement>('#show-percentages')!,
  showTotal: document.querySelector<HTMLInputElement>('#show-total')!,
  explanationExpanded: document.querySelector<HTMLInputElement>('#explanation-expanded')!,
  glossaryExpanded: document.querySelector<HTMLInputElement>('#glossary-expanded')!
};

const text = (selector: string, value: string) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value;
};

// Percentage values arrive as whole percents (45.5 for 45.5%) under the default percentScale.
const prefixedValueFormatter = ({ value, series, locale }: A11yBarChartValueFormatContext): string => series === 'percentage'
  ? `≈ ${new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value / 100)}`
  : `≈ ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)}`;

function update(): void {
  const locale = localeSelect.value as BarDemoLocale;
  const page = BAR_DEMO_PAGE_MESSAGES[locale];
  const messageDictionary = BAR_DEMO_MESSAGES[locale];
  const datasets = getBarDemoContent(locale);
  const usesColor = targetStyle.value === 'color' || targetStyle.value === 'color-and-texture';
  const usesTexture = targetStyle.value === 'texture' || targetStyle.value === 'color-and-texture';
  positiveColor.disabled = negativeColor.disabled = !usesColor;
  positiveTexture.disabled = negativeTexture.disabled = !usesTexture;
  const primary = datasets[replaceData.checked ? 4 : 0];

  document.documentElement.lang = locale;
  text('#document-title', page.documentTitle);
  text('.demo-kicker', page.kicker);
  text('#page-heading', page.heading);
  text('#page-introduction', page.introduction);
  text('#controls-heading', page.controlsHeading);
  text('#scale-label', page.scaleLabel);
  text('#scale-mode option[value="largest"]', page.scaleLargest);
  text('#scale-mode option[value="population-share"]', page.scalePopulationShare);
  text('#data-view-label', page.dataViewLabel);
  text('#data-view option[value="dialog"]', page.dialogMode);
  text('#data-view option[value="inline"]', page.inlineMode);
  text('#data-view option[value="none"]', page.noneMode);
  text('#locale-label', page.localeLabel);
  text('#filtered-label', page.filteredLabel);
  text('#suppressed-label', page.suppressedLabel);
  text('#replace-data-label', page.alternateLabel);
  text('#theme-label', page.themeLabel);
  text('#theme option[value="reference"]', page.themeDefault);
  text('#theme option[value="high-contrast"]', page.themeHighContrast);
  text('#texture-label', page.textureLabel);
  text('#texture option[value="none"]', page.textureNone);
  text('#texture option[value="diagonal"]', page.textureDiagonal);
  text('#texture option[value="dots"]', page.textureDots);
  text('#texture option[value="horizontal"]', page.textureHorizontal);
  text('#formatter-label', page.formatterLabel);
  text('#formatter option[value="locale"]', page.formatterDefault);
  text('#formatter option[value="prefix"]', page.formatterCustom);
  text('#target-style-label', page.targetStyleLabel);
  text('#target-style option[value="none"]', page.targetStyleNone);
  text('#target-style option[value="color"]', page.targetStyleColor);
  text('#target-style option[value="texture"]', page.targetStyleTexture);
  text('#target-style option[value="color-and-texture"]', page.targetStyleBoth);
  text('#positive-direction-label', page.positiveDirectionLabel);
  text('#positive-direction option[value="above"]', page.positiveAbove);
  text('#positive-direction option[value="below"]', page.positiveBelow);
  text('#positive-color-label', page.positiveColorLabel);
  text('#negative-color-label', page.negativeColorLabel);
  text('#positive-texture-label', page.positiveTextureLabel);
  text('#negative-texture-label', page.negativeTextureLabel);
  for (const selector of ['positive-texture', 'negative-texture']) {
    text(`#${selector} option[value="none"]`, page.textureNone);
    text(`#${selector} option[value="dots"]`, page.textureDots);
    text(`#${selector} option[value="diagonal"]`, page.textureDiagonal);
    text(`#${selector} option[value="horizontal"]`, page.textureHorizontal);
  }
  const optionLabels: Record<keyof typeof optionControls, string> = {
    showDetails: page.showDetails,
    showSummary: page.showSummary, showContext: page.showContext, showActions: page.showActions,
    showExplanation: page.showExplanation, showGlossary: page.showGlossary, showExport: page.showExport,
    showCounts: page.showCounts, showPercentages: page.showPercentages, showTotal: page.showTotal,
    explanationExpanded: page.explanationExpanded, glossaryExpanded: page.glossaryExpanded
  };
  for (const [option, label] of Object.entries(optionLabels)) text(`#${option.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-label`, label);
  text('#reference-heading', page.referenceHeading);
  text('#reference-introduction', page.referenceIntroduction);
  text('[data-reporting-notes]', page.reportingNotes);
  text('#demo-footer', page.footer);

  const data = [primary, datasets[1], datasets[2], datasets[3]];
  charts.forEach((chart, index) => {
    const config: A11yBarChartConfig = {
      ...chart.config,
      dataView: dataView.value as 'dialog' | 'inline' | 'none',
      scaleMode: scale.value as 'largest' | 'population-share',
      targetStyle: targetStyle.value as A11yBarChartTargetStyle,
      positiveDirection: positiveDirection.value as 'above' | 'below',
      locale,
      percentageDecimals: 1,
      ...Object.fromEntries(Object.entries(optionControls).map(([key, control]) => [key, control.checked]))
    };
    // `config` intentionally exposes every shared visibility/disclosure option in this demo.
    chart.config = config;
    const theme = themeSelect.value === 'high-contrast'
      ? { color: '#000000', track: '#ffffff', text: '#000000', muted: '#292929', border: '#000000', focus: '#005fcc', surface: '#ffffff', space: '1rem', font: 'inherit', barHeight: '3rem', borderRadius: '0', buttonRadius: '0', fontSize: '1rem', titleFontSize: '1.375rem', lineHeight: '1.5', gap: '0.75rem', rowGap: '1.25rem', buttonPadding: '0.6rem 0.8rem' }
      : {};
    chart.theme = {
      ...theme, patternType: textureSelect.value as A11yBarChartPattern,
      positiveColor: positiveColor.value, negativeColor: negativeColor.value,
      positivePatternType: positiveTexture.value as A11yBarChartPattern,
      negativePatternType: negativeTexture.value as A11yBarChartPattern
    };
    chart.formatValue = formatterSelect.value === 'prefix' ? prefixedValueFormatter : undefined;
    chart.lang = locale;
    chart.messages = messageDictionary;
    chart.setAttribute('chart-title', data[index].title);
    chart.setAttribute('subtitle', data[index].subtitle);
    chart.context = data[index].context;
    chart.dataNote = data[index].dataNote;
    chart.total = data[index].total;
    chart.data = data[index].data;
    chart.filtered = filtered.checked;
    chart.suppressed = suppressed.checked || index === 3;
  });
}

for (const control of [scale, dataView, localeSelect, filtered, suppressed, replaceData, themeSelect, textureSelect, formatterSelect, targetStyle, positiveDirection, positiveColor, negativeColor, positiveTexture, negativeTexture, ...Object.values(optionControls)]) control.addEventListener('change', update);
update();

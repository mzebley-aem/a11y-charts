import '../src/define.ts';
import '../src/styles.css';
import type { A11yLineChartDatum, A11yLineChartElement, A11yLineChartXValue } from '../src/index.ts';
import { LINE_DEMO_CONTENT, LINE_DEMO_MESSAGES, type DemoLocale } from './locales.ts';
import './page.css';

const charts = [...document.querySelectorAll<A11yLineChartElement>('a11y-line-chart')];
const localeSelect = document.querySelector<HTMLSelectElement>('[data-demo-locale]');

const config = {
  announceChanges: true,
  autoDetectGaps: true,
  axisDecimalPlaces: 0,
  decimalPlaces: 2,
  describeMissingAs: '-',
  tableVisibility: 'screen-reader' as const,
  wrapAround: true
};

// These values and their order are the source data; changing the demo language never mutates them.
const data: A11yLineChartDatum[][] = [
  [
    { x: 2015, actual: 40.00, target: 80.00 },
    { x: 2016, actual: 68.90, target: 80.00 },
    { x: 2017, actual: 70.32, target: 80.00 },
    { x: 2018, actual: 69.06, target: 80.00 },
    { x: 2019, actual: 72.51, target: 80.00 },
    { x: 2020, actual: 83.92, target: 77.02 },
    { x: 2021, target: 78.27 },
    { x: 2022, target: 79.52 },
    { x: 2023, target: 80.77 },
    { x: 2024, target: 82.02 },
    { x: 2025, target: 83.27 }
  ],
  [
    { x: 2015, actual: 57.12, target: 80.00 },
    { x: 2016, actual: 64.15, target: 80.00 },
    { x: 2017, actual: 65.34, target: 80.00 },
    { x: 2018, actual: 63.53, target: 80.00 },
    { x: 2019, actual: 64.26, target: 80.00 },
    { x: 2020, actual: 70.78, target: 70.78 },
    { x: 2021, target: 70.78 },
    { x: 2022, target: 70.78 },
    { x: 2023, target: 70.78 },
    { x: 2024, target: 72.30 },
    { x: 2025, target: 73.50 }
  ],
  [
    { x: 'Q1', actual: 65, target: { min: 70, max: 80 } },
    { x: 'Q2', actual: 70, target: { min: 70, max: 80 } },
    { x: 'Q3', actual: 76, target: { min: 72, max: 82 } },
    { x: 'Q4', actual: 86, target: { min: 74, max: 84 } },
    { x: 'Q5', actual: 79, target: { min: 74, max: 84 } },
    { x: 'Q6', actual: null, target: { min: 76, max: 86 } }
  ]
];

const baselines = [
  { x: 2015, value: 38 },
  { x: 2015, value: 55 }
] as const;

charts.forEach((chart, index) => {
  chart.config = {
    ...config,
    ...(index === 2 ? { tableVisibility: 'visible' as const, fillActual: false, showTargetValues: true } : {})
  };
  chart.data = data[index] ?? [];
  chart.dataNote = LINE_DEMO_CONTENT['en-US'].dataNote;
  chart.definitions = [{ id: 'reported-result', label: LINE_DEMO_CONTENT['en-US'].definitionLabel, definition: LINE_DEMO_CONTENT['en-US'].definitionText }];
});

function formatPeriod(value: A11yLineChartXValue, locale: DemoLocale, index: number): string {
  if (typeof value === 'string') {
    const quarter = /^Q([1-6])$/.exec(value);
    if (quarter && index === 2) return LINE_DEMO_CONTENT[locale].quarterPeriods[Number(quarter[1]) - 1] ?? value;
    return value;
  }
  if (value instanceof Date) {
    try { return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value); } catch { return value.toLocaleDateString('en-US'); }
  }
  return String(value);
}

function applyLocale(locale: DemoLocale): void {
  const content = LINE_DEMO_CONTENT[locale];
  const messages = LINE_DEMO_MESSAGES[locale];
  document.documentElement.lang = locale;
  document.title = content.documentTitle;
  const pageTitle = document.querySelector<HTMLElement>('#demo-title');
  if (pageTitle) pageTitle.textContent = content.pageTitle;
  const introduction = document.querySelector<HTMLElement>('#demo-introduction');
  if (introduction) introduction.textContent = content.introduction;
  const controlsHeading = document.querySelector<HTMLElement>('#demo-controls-heading');
  if (controlsHeading) controlsHeading.textContent = content.controlsHeading;
  const sharedLegend = document.querySelector<HTMLElement>('[data-demo-shared-legend]');
  if (sharedLegend) sharedLegend.textContent = content.sharedOptionsLegend;
  document.querySelectorAll<HTMLElement>('[data-demo-option-label]').forEach((label) => {
    const index = Number(label.dataset['demoOptionLabel']); label.textContent = content.sharedOptions[index] ?? label.textContent;
  });
  const languageLabel = document.querySelector<HTMLLabelElement>('label[for="demo-locale"]');
  if (languageLabel) languageLabel.textContent = content.languageLabel;
  const languageOptions = localeSelect?.querySelectorAll<HTMLOptionElement>('option');
  languageOptions?.forEach((option, index) => { option.textContent = content.languageOptions[index] ?? option.textContent; });
  const updateHelp = document.querySelector<HTMLElement>('#demo-update-help');
  if (updateHelp) updateHelp.textContent = content.updateHelp;
  document.querySelectorAll<HTMLButtonElement>('[data-demo-view="dialog"]').forEach((button) => { button.textContent = content.dialogButton; });
  document.querySelectorAll<HTMLButtonElement>('[data-demo-view="inline"]').forEach((button) => { button.textContent = content.inlineButton; });
  document.querySelectorAll<HTMLButtonElement>('[data-demo-update]').forEach((button) => { button.textContent = content.updateButton; });
  const sharedOptions = document.querySelector<HTMLElement>('.demo-options');
  if (sharedOptions) sharedOptions.setAttribute('aria-label', content.sharedOptionsLegend);

  charts.forEach((chart, index) => {
    chart.setAttribute('lang', locale);
    chart.chartTitle = content.chartTitles[index] ?? content.chartTitles[0];
    chart.subtitle = content.subtitles[index] ?? content.subtitles[0];
    chart.messages = messages;
    chart.config = {
      ...chart.config,
      locale,
      actualSeriesLabel: content.actualSeriesLabel,
      targetSeriesLabel: content.targetSeriesLabel,
      baselineSeriesLabel: content.baselineSeriesLabel,
      describeMissingAs: messages.missing,
      contextNote: content.contextNotes[index] ?? '',
      xAxisTitle: index === 2 ? content.quarterLabel : content.yearLabel,
      yAxisTitle: content.percentLabel
    };
    chart.dataNote = content.dataNote;
    chart.definitions = [{ id: 'reported-result', label: content.definitionLabel, definition: content.definitionText }];
    chart.formatXValue = (value) => formatPeriod(value, locale, index);
    chart.baseline = index < baselines.length
      ? { ...baselines[index]!, explanation: content.baselineExplanations[index] }
      : undefined;
  });
}

localeSelect?.addEventListener('change', () => {
  const locale = localeSelect.value;
  if (locale === 'fr-FR' || locale === 'es-ES' || locale === 'en-US') applyLocale(locale);
});

document.querySelectorAll<HTMLButtonElement>('[data-demo-view]').forEach((button) => {
  button.addEventListener('click', () => {
    const dataView = button.dataset['demoView'] === 'inline' ? 'inline' : 'dialog';
    charts.forEach((chart) => { chart.config = { ...chart.config, dataView }; });
  });
});

document.querySelectorAll<HTMLInputElement>('[data-demo-option]').forEach((input) => {
  input.addEventListener('change', () => {
    const key = input.dataset['demoOption'];
    if (key === 'filtered') { charts.forEach((chart) => { chart.filtered = input.checked; }); return; }
    if (key && ['showSummary', 'showContext', 'showActions', 'showExplanation', 'showGlossary', 'showExport'].includes(key)) {
      charts.forEach((chart) => { chart.config = { ...chart.config, [key]: input.checked }; });
    }
  });
});

document.querySelector<HTMLInputElement>('[data-demo-suppression]')?.addEventListener('change', (event) => {
  const chart = charts[2]; if (!chart) return;
  const updated = chart.data; const sample = updated[3]; if (!sample) return;
  if ((event.currentTarget as HTMLInputElement).checked) sample.actualSuppressed = true;
  else { delete sample.actualSuppressed; sample.actual = data[2]?.[3]?.actual ?? null; }
  chart.data = updated;
});

document.querySelector<HTMLButtonElement>('[data-demo-update]')?.addEventListener('click', () => {
  const chart = charts[2];
  if (!chart) return;
  const updated = chart.data;
  const last = updated.at(-1);
  if (last) last.actual = (last.actual ?? 70) + 1;
  chart.data = updated;
});

applyLocale(localeSelect?.value === 'fr-FR' || localeSelect?.value === 'es-ES' ? localeSelect.value : 'en-US');

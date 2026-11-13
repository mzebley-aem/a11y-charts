import '../packages/line-chart/src/define.js';
import '../packages/bar-chart/src/define.js';
import '../packages/line-chart/src/styles.css';
import '../packages/bar-chart/src/styles.css';
import './gallery.css';
import './adapt-report-theme.css';
import { A11yLineChartElement } from '../packages/line-chart/src/a11y-line-chart-element.js';
import { A11yBarChartElement } from '../packages/bar-chart/src/a11y-bar-chart-element.js';
import { chartGalleryExamples, type ChartGalleryExample } from './examples.js';
import { mountSettings } from './settings.js';
import { mountThemeComparisons } from './theme-comparison.js';

function textElement<K extends keyof HTMLElementTagNameMap>(tag: K, text: string, className = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

function applyExample(chart: A11yLineChartElement | A11yBarChartElement, example: ChartGalleryExample): void {
  chart.chartTitle = example.title;
  chart.context = example.context ?? '';
  chart.dataNote = example.dataNote ?? '';
  chart.suppressed = example.suppressed === true;
  if (chart instanceof A11yLineChartElement && example.kind === 'line') {
    chart.config = { showControls: false, ...example.config, headingLevel: 4 };
    chart.data = structuredClone(example.data);
    chart.baseline = example.baseline ? structuredClone(example.baseline) : undefined;
    chart.config = { ...chart.config, valuePreset: example.valuePreset ?? 'number' };
    chart.theme = { ...example.theme };
    chart.definitions = structuredClone(example.definitions ?? []);
  } else if (chart instanceof A11yBarChartElement && example.kind === 'bar') {
    chart.config = { ...example.config, headingLevel: 4 };
    chart.data = structuredClone(example.data);
    chart.total = example.total;
    chart.theme = { ...example.theme };
  }
}

function createExample(example: ChartGalleryExample, index: number): HTMLElement {
  const article = document.createElement('article');
  article.className = 'example';
  article.id = example.id;
  article.dataset.exampleId = example.id;
  const headingId = `${example.id}-heading`;
  article.setAttribute('aria-labelledby', headingId);
  const header = document.createElement('header');
  header.className = 'example-header';
  const heading = textElement('h3', example.title);
  heading.id = headingId;
  header.append(textElement('p', `${example.kind} example ${String(index + 1).padStart(2, '0')}`, 'example-number'), heading, textElement('p', example.description));
  const stage = document.createElement('div');
  stage.className = 'chart-stage';
  const chart = document.createElement(`a11y-${example.kind}-chart`) as A11yLineChartElement | A11yBarChartElement;
  applyExample(chart, example);
  stage.append(chart);
  const hint = textElement('p', '', 'review-hint');
  hint.append(textElement('strong', 'Try this: '), document.createTextNode(example.reviewHint));
  const details = document.createElement('details');
  details.className = 'example-settings';
  const summary = textElement('summary', 'Customize this example');
  const body = document.createElement('div');
  body.className = 'settings-body';
  body.append(textElement('p', 'Changes apply immediately to this chart. These authoring controls are separate from the reader controls inside the chart.', 'settings-intro'));
  const controls = document.createElement('div');
  body.append(controls);
  const settings = mountSettings(controls, chart, example.kind);
  const footer = document.createElement('div');
  footer.className = 'settings-footer';
  const reset = textElement('button', 'Reset example', 'reset-button');
  reset.type = 'button';
  const status = textElement('span', 'Original example settings.', 'settings-status');
  status.setAttribute('role', 'status');
  footer.append(reset, status);
  body.append(footer);
  details.append(summary, body);
  const configuration = document.createElement('details');
  configuration.className = 'configuration';
  const code = document.createElement('pre');
  code.tabIndex = 0;
  code.setAttribute('role', 'group');
  code.setAttribute('aria-label', 'Current example configuration');
  configuration.append(textElement('summary', 'View current configuration and data'), code);
  const updateCode = () => {
    code.textContent = JSON.stringify({ config: chart.config, data: chart.data,
      ...(chart instanceof A11yLineChartElement ? { baseline: chart.baseline, valuePreset: chart.config.valuePreset } : { total: chart.total }),
      theme: chart.theme }, null, 2);
  };
  controls.addEventListener('demo-settings-change', () => { updateCode(); status.textContent = 'Custom settings applied.'; });
  chart.addEventListener(`a11y-${example.kind}-chart-settings-change`, () => { settings.refresh(); updateCode(); });
  reset.addEventListener('click', () => { applyExample(chart, example); settings.refresh(); updateCode(); status.textContent = 'Original example restored.'; });
  updateCode();
  article.append(header, stage, hint, details, configuration);
  return article;
}

const examples = document.querySelector<HTMLElement>('#examples')!;
for (const kind of ['line', 'bar'] as const) {
  const section = document.createElement('section');
  section.className = 'chart-section';
  section.id = `${kind}-examples`;
  section.setAttribute('aria-labelledby', `${kind}-heading`);
  const heading = textElement('h2', kind === 'line' ? 'Line charts' : 'Bar charts');
  heading.id = `${kind}-heading`;
  const headingRow = document.createElement('div');
  headingRow.className = 'section-heading';
  headingRow.append(heading, textElement('span', '5 ways to present your data'));
  section.append(headingRow, textElement('p', kind === 'line'
    ? 'Compare actual results with targets across reporting periods. Explore baselines, target ranges, missing values, and different meanings of success.'
    : 'Compare category values, show each category’s share of a population, and add target outcomes or detail cards when they help the reader.', 'section-intro'));
  chartGalleryExamples.filter(example => example.kind === kind).forEach((example, index) => section.append(createExample(example, index)));
  examples.append(section);
}

import { mountGroupedExamples } from './grouped.js';
mountGroupedExamples(examples);
mountThemeComparisons(examples);

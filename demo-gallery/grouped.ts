import { A11yBarChartGroupElement } from '../packages/bar-chart/src/a11y-bar-chart-group-element.js';
import type { A11yBarChartConfig } from '../packages/bar-chart/src/model.js';
import type { BarViewSection } from '../packages/bar-chart/src/grouped-model.js';
import { ageSection, raceSection, availabilitySection, targetSection } from './grouped-examples.js';

const text = <K extends keyof HTMLElementTagNameMap>(tag: K, content: string, className = ''): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag); element.textContent = content; element.className = className; return element;
};
function example(id: string, title: string, description: string, sections: BarViewSection[], maximum: number, overrides: A11yBarChartConfig = {}): HTMLElement {
  const article = text('article', '', 'example'); article.id = id;
  const header = text('header', '', 'example-header');
  header.append(text('p', 'Grouped bar chart', 'example-number'), text('h3', title), text('p', description));
  const stage = text('div', '', 'chart-stage');
  const group = document.createElement('a11y-bar-chart-group') as A11yBarChartGroupElement;
  group.config = { headingLevel: 4, scaleMode: 'largest', scaleMaximum: maximum, showSummary: false, showDetails: true, ...overrides };
  group.theme = { color: '#244694' };
  group.groupMessages = { selectorLabel: `${title}: population selection` };
  group.sections = sections;
  stage.append(group);
  const hint = text('p', 'Try this: change a population with the arrow keys, open Explain and Data, and download the CSV. The shared scale stays fixed while each percentage uses the selected total.', 'review-hint');
  const details = text('details', '', 'example-settings'); details.append(text('summary', 'Customize this example'));
  const controls = text('div', '', 'settings-body');
  const grid = text('div', '', 'settings-grid');
  function select(labelText: string, choices: [string, string][], changed: (value: string) => void): HTMLSelectElement {
    const label = text('label', labelText, 'gallery-setting'); const input = document.createElement('select');
    for (const [value, caption] of choices) { const option = text('option', caption); option.value = value; input.append(option); }
    input.addEventListener('change', () => { changed(input.value); updateCode(); }); label.append(input); grid.append(label); return input;
  }
  const scale = select('Bar scale', [['shared', 'Shared count scale'], ['largest', 'Rescale for each selection'], ['population', 'Share of selected population']], value => {
    group.config = { ...group.config, scaleMode: value === 'population' ? 'population-share' : 'largest', scaleMaximum: value === 'shared' ? maximum : undefined };
  });
  const dataView = select('Complete data view', [['dialog', 'Dialog'], ['inline', 'Inline']], value => { group.config = { ...group.config, dataView: value as 'dialog' | 'inline' }; });
  const filter = select('External report filter', [['off', 'Off'], ['on', 'On — remains active when selecting All']], value => {
    group.sections = sections.map(section => ({ ...section, views: section.views.map(view => ({ ...view, filtered: value === 'on' || view.filtered })) }));
  });
  controls.append(grid);
  const reset = text('button', 'Reset example', 'reset-button'); reset.type = 'button';
  reset.addEventListener('click', () => {
    group.sections = sections; group.selectedSectionId = sections[0]!.id; group.selectedViewId = sections[0]!.allViewId;
    group.config = { headingLevel: 4, scaleMode: 'largest', scaleMaximum: maximum, showSummary: false, showDetails: true, dataView: 'dialog', explanationExpanded: false, glossaryExpanded: false, ...overrides };
    scale.value = 'shared'; dataView.value = 'dialog'; filter.value = 'off'; updateCode();
  });
  controls.append(reset); details.append(controls);
  const configuration = text('details', '', 'configuration'); const code = text('pre', ''); code.tabIndex = 0;
  code.setAttribute('role', 'group'); code.setAttribute('aria-label', 'Selected population configuration and data');
  configuration.append(text('summary', 'View selected configuration and data'), code);
  function updateCode() {
    const selected = group.sections.find(section => section.id === group.selectedSectionId)?.views.find(view => view.id === group.selectedViewId);
    code.textContent = JSON.stringify({ sectionId: group.selectedSectionId, viewId: group.selectedViewId, config: group.config, view: selected }, null, 2);
  }
  group.addEventListener('a11y-bar-chart-group-selection-change', updateCode);
  group.addEventListener('a11y-bar-chart-data-change', updateCode);
  updateCode();
  article.append(header, stage, hint, details, configuration); return article;
}
export function mountGroupedExamples(root: HTMLElement): void {
  const section = text('section', '', 'chart-section'); section.id = 'grouped-examples'; section.setAttribute('aria-labelledby', 'grouped-heading');
  const heading = text('h2', 'Grouped populations'); heading.id = 'grouped-heading';
  const headingRow = text('div', '', 'section-heading'); headingRow.append(heading, text('span', '4 interactive compositions'));
  section.append(headingRow, text('p', 'Select a population without leaving the chart. Review the screenshot-based age and race/ethnicity states, then explore regional targets, multiple sections, and data availability.', 'section-intro'));
  section.append(example('grouped-age', 'Children by age range', 'The All Ages view preserves the supplied screenshot values. Individual age selections are illustrative and are identified in Data.', [ageSection()], 365));
  section.append(example('grouped-race', 'Children by race/ethnicity', 'All Race/Ethnicities and Black or African American reproduce the supplied visible values. Other selections are illustrative.', [raceSection()], 322));
  section.append(example('grouped-sections', 'Multiple sections and availability states', 'Switch sections, collapse their options, and compare suppressed, missing, and empty results. The chart keeps its reading preferences.', [ageSection(), raceSection(), availabilitySection()], 365));
  section.append(example('grouped-targets', 'Regional services and targets', 'Compare minimum goals and inclusive target ranges. North includes an above-range result; South meets every goal, including exact boundaries. Color, texture, and text communicate outcomes.', [targetSection()], 180, { targetStyle: 'color-and-texture', positiveDirection: 'above' }));
  root.append(section);
}

import { A11yBarChartElement } from '../packages/bar-chart/src/a11y-bar-chart-element.js';
import { A11yBarChartGroupElement } from '../packages/bar-chart/src/a11y-bar-chart-group-element.js';
import type { BarViewSection } from '../packages/bar-chart/src/grouped-model.js';

const text = <K extends keyof HTMLElementTagNameMap>(tag: K, value: string, className = ''): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.textContent = value;
  element.className = className;
  return element;
};

const sexData = [
  { id: 'male', label: 'Male', value: 14, definition: 'Children reported as male during the reporting period.' },
  { id: 'female', label: 'Female', value: 13, definition: 'Children reported as female during the reporting period.' }
];
const ageData = [
  { id: 'under-3', label: 'Under age 3', value: 175 },
  { id: 'age-3', label: 'Age 3', value: 140 },
  { id: 'age-4', label: 'Age 4', value: 125 },
  { id: 'age-5', label: 'Age 5', value: 70 }
];

function ageSection(): BarViewSection {
  const allAges = {
    id: 'all-ages', label: 'All Ages', chartTitle: 'Children by age',
    context: 'Illustrative values shown to compare chart themes.',
    dataNote: 'This grouped theme fixture totals 510.', data: ageData,
    total: 510, suppressed: false, filtered: false
  };
  const youngerChildren = {
    id: 'birth-through-two', label: 'Birth through age 2', chartTitle: 'Children birth through age 2',
    context: 'Illustrative values shown to exercise grouped selection and theme inheritance.',
    dataNote: 'This view totals 210.',
    data: [
      { id: 'infants', label: 'Birth through age 1', value: 110 },
      { id: 'age-2', label: 'Age 2', value: 100 }
    ],
    total: 210, suppressed: false, filtered: false
  };
  return { id: 'age', label: 'Age', allViewId: allAges.id, views: [allAges, youngerChildren] };
}

function standalone(title: string, reportPresentation = false): A11yBarChartElement {
  const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
  if (reportPresentation) chart.classList.add('a11y-bar-chart--endpoint-values');
  chart.chartTitle = title;
  chart.context = 'There are 27 children, male or female, who received early intervention services from 1/1/2024 to 12/31/2024.';
  chart.dataNote = 'Reported values: Male 14; Female 13; total 27.';
  chart.data = structuredClone(sexData);
  chart.total = 27;
  chart.config = {
    headingLevel: 4, showActions: true, showSummary: false, showContext: true,
    showExplanation: true, explanationExpanded: false, showGlossary: true,
    showDetails: false, dataView: 'dialog', tableVisibility: 'visible', showTotal: true
  };
  chart.messages = {
    explain: 'Explain', hideExplanation: 'Explain',
    glossary: 'Glossary', hideGlossary: 'Glossary', showData: 'Data'
  };
  chart.explanation = 'During this reporting period, 14 children were male and 13 children were female. Together, the categories account for all 27 children.';
  return chart;
}

function grouped(title: string): A11yBarChartGroupElement {
  const chart = document.createElement('a11y-bar-chart-group') as A11yBarChartGroupElement;
  chart.config = { headingLevel: 4, showActions: true, showSummary: false, showContext: false, dataView: 'dialog', tableVisibility: 'visible' };
  chart.groupMessages = { selectorLabel: `${title}: age selection` };
  chart.sections = [ageSection()];
  return chart;
}

function card(theme: 'default' | 'adapt-theme-fixture theme-adapt' | 'theme-contrast', kind: 'standalone' | 'grouped'): HTMLElement {
  const adapted = theme.includes('theme-adapt');
  const cls = ['theme-demo-card', adapted ? 'adapt-theme-fixture' : '', ...theme.split(' ')].filter(Boolean).join(' ');
  const article = text('article', '', cls);
  article.append(text('h3', theme === 'default' ? 'Component defaults' : adapted ? 'Adapt token adapter' : 'Alternate theme'));
  article.append(text('p', theme === 'default'
    ? 'Component-provided visual defaults.'
    : adapted
      ? 'Scoped --usa-data-rep-* fixture values bridge into --a11y-charts-* properties.'
      : 'A separate local palette, typeface, spacing, and geometry set.', 'theme-demo-caption'));
  const themeLabel = theme === 'default' ? 'Component defaults' : adapted ? 'Adapt token adapter' : 'Alternate theme';
  article.append(kind === 'standalone' ? standalone('Child Count by Sex') : grouped(`Children by age — ${themeLabel}`));
  return article;
}

export function mountThemeComparisons(root: HTMLElement): void {
  const section = text('section', '', 'chart-section theme-comparison');
  section.id = 'theme-comparison';
  section.setAttribute('aria-labelledby', 'theme-comparison-heading');
  const heading = text('h2', 'Scoped theme comparison');
  heading.id = 'theme-comparison-heading';
  const headingRow = text('div', '', 'section-heading');
  headingRow.append(heading, text('span', 'same data · three themes'));
  section.append(headingRow, text('p', 'Compare component defaults, a project adapter using Adapt’s --usa-data-rep-* token names, and a substantially different local theme. Each theme is scoped to its own card, so neighboring charts keep their own values.', 'section-intro'));
  const reportExample = text('article', '', 'theme-demo-card theme-adapt adapt-theme-fixture adapt-report-fullwidth');
  reportExample.id = 'adapt-report-preview';
  reportExample.append(text('h3', 'Full-width report example'));
  reportExample.append(text('p', 'Source values: Male 14, Female 13, total 27. The plain-language explanation is authored from these reported values; it does not copy the source template’s erroneous “undefined” output.', 'theme-demo-caption'));
  reportExample.append(standalone('By Sex (Suppressed)', true));
  section.append(reportExample);
  const standaloneRow = text('div', '', 'theme-demo-grid');
  standaloneRow.setAttribute('aria-label', 'Standalone chart themes');
  standaloneRow.append(card('default', 'standalone'), card('adapt-theme-fixture theme-adapt', 'standalone'), card('theme-contrast', 'standalone'));
  const groupRow = text('div', '', 'theme-demo-grid theme-demo-group-row');
  groupRow.setAttribute('aria-label', 'Grouped chart themes');
  groupRow.append(card('default', 'grouped'), card('adapt-theme-fixture theme-adapt', 'grouped'), card('theme-contrast', 'grouped'));
  section.append(text('h3', 'Standalone: By Sex (Suppressed) (27 total)'), standaloneRow);
  section.append(text('h3', 'Grouped: illustrative age distribution (510 total)'), groupRow);
  section.append(text('p', 'Standalone values are from the observed By Sex report view. Grouped age values are a consistent illustrative fixture (175 + 140 + 125 + 70 = 510); they do not reproduce the source screenshot’s inconsistent percentages and counts.', 'theme-demo-note'));
  root.append(section);
}

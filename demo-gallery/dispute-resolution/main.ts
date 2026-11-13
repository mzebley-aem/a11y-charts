import '../../packages/bar-chart/src/define.js';
import '../../packages/bar-chart/src/styles.css';
import '../../packages/segmented-bar-chart/src/define.js';
import '../../packages/segmented-bar-chart/src/styles.css';
import '../adapt-report-theme.css';
import './report.css';
import type { A11yBarChartElement } from '../../packages/bar-chart/src/a11y-bar-chart-element.js';
import { sections, type Panel } from './data.js';
import type { A11ySegmentedBarChartElement } from '../../packages/segmented-bar-chart/src/element.js';
import { singleValueContent } from './single-value-content.js';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const count = (value: number) => value.toLocaleString('en-US');
const menu = $<HTMLButtonElement>('#site-menu');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('site-menu-open');
}
menu.onclick = () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  document.body.classList.toggle('site-menu-open', expanded);
};
$('#app-navigation').addEventListener('click', event => {
  if ((event.target as Element).closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menu.focus();
  }
});
let selected = 'overview';
let percentages = true;
let patterned = false;
function readURL() {
  const params = new URLSearchParams(location.search);
  selected = sections.some(s => s.id === params.get('section')) ? params.get('section')! : 'overview';
  percentages = params.get('values') !== 'counts';
  patterned = params.get('pattern') === 'diagonal';
}
function updateURL(push = false) {
  const url = new URL(location.href);
  url.searchParams.set('section', selected);
  url.searchParams.set('values', percentages ? 'both' : 'counts');
  url.searchParams.set('pattern', patterned ? 'diagonal' : 'none');
  url.hash = '';
  if (url.href !== location.href) history[push ? 'pushState' : 'replaceState'](null, '', url);
  $('#share-status').textContent = '';
  $('#share-fallback').hidden = true;
}
function navigate(id: string) {
  selected = id;
  updateURL(true);
  render();
  $('#view-title').focus();
  $('#view-status').textContent = `${$('#view-title').textContent} shown.`;
}
function viewLink(id: string, text: string) {
  const link = document.createElement('a');
  const params = new URLSearchParams({ section: id, values: percentages ? 'both' : 'counts', pattern: patterned ? 'diagonal' : 'none' });
  link.href = `?${params}`;
  link.textContent = text;
  link.dataset.section = id;
  if (id === selected) link.setAttribute('aria-current', 'page');
  link.onclick = event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(id);
  };
  return link;
}
function applyDisplaySettings() {
  document.querySelectorAll<A11ySegmentedBarChartElement>('a11y-segmented-bar-chart').forEach(chart => {
    chart.config = { ...chart.config, showPercentages: percentages };
    chart.theme = { ...chart.theme, segments: Object.fromEntries(chart.data.map((item, index) => [item.id, { color: index === 0 ? '#1f4093' : '#c6cace', pattern: patterned ? 'diagonal' : 'none' }])) };
  });
  document.querySelectorAll<A11yBarChartElement>('a11y-bar-chart').forEach(chart => {
    chart.config = { ...chart.config, showPercentages: percentages };
    chart.theme = { ...chart.theme, patternType: patterned ? 'diagonal' : 'none', patternColor: '#ffffff' };
  });
}
function addSingleValueBreakdown(panel: Panel) {
  const copy = singleValueContent[panel.id];
  const value = panel.rows[0][1];
  const remainder = panel.base - value;
  const share = `${(value / panel.base * 100).toFixed(1)}%`;
  const sentenceText = copy.sentence.replaceAll('{value}', count(value)).replaceAll('{share}', share).replaceAll('{base}', count(panel.base));
  const isComparison = panel.id === 'dueprocess-meetings' || panel.id === 'expedited-meetings';
  const remainderText = `The remaining count is calculated as ${count(panel.base)} minus ${count(value)}, which equals ${count(remainder)}. ${copy.remainderNote}`;
  const article = document.createElement('section'); article.id = panel.id;
  article.className = 'chart-panel single-value-breakdown';
  const eyebrow = document.createElement('p'); eyebrow.className = 'single-value-eyebrow';
  eyebrow.textContent = copy.eyebrow;
  const chart = document.createElement('a11y-segmented-bar-chart') as A11ySegmentedBarChartElement;
  chart.className = 'theme-adapt';
  chart.chartTitle = copy.title ?? panel.title;
  chart.subtitle = copy.question ?? panel.question;
  chart.total = panel.base;
  chart.valueLabel = 'Count';
  chart.totalLabel = copy.baseCaption ?? panel.baseLabel;
  chart.context = `Reporting period: 2022–23. Base: ${count(panel.base)} ${panel.baseLabel}.`;
  chart.explanation = `<p>${sentenceText}</p>${isComparison ? '' : `<p>${remainderText}</p>`}`;
  chart.config = { mode: isComparison ? 'comparison' : 'breakdown', presentation: 'full', headingLevel: 3, percentageDecimals: 1, announceChanges: false, highlightedId: `${panel.id}-0`, showDetails: true, showSummary: false, showTotal: true, showContext: false, dataView: 'dialog' };
  chart.messages = { total: panel.baseLabel, showData: 'Data', explain: 'Explain', glossary: 'Glossary', hideGlossary: 'Hide glossary' };
  chart.data = [
    { id: `${panel.id}-0`, label: copy.label ?? panel.rows[0][0], value, definition: copy.definition },
    ...(isComparison ? [] : [{ id: `${panel.id}-other`, label: copy.remainderLabel, value: remainder, definition: remainderText }]),
  ];
  const sentence = document.createElement('p'); sentence.className = 'single-value-sentence';
  sentence.textContent = sentenceText;
  article.append(eyebrow, chart, sentence);
  if (copy.note) {
    const note = document.createElement('p'); note.className = 'chart-note'; note.textContent = copy.note;
    article.append(note);
  }
  $('#view-body').append(article);
}
function addChart(panel: Panel, index: number) {
  if (panel.rows.length === 1 && singleValueContent[panel.id]) { addSingleValueBreakdown(panel); return; }
  const article = document.createElement('section');
  article.className = 'chart-panel';
  article.id = panel.id;
  const question = document.createElement('p');
  question.className = 'chart-question';
  question.textContent = `${index + 1}. ${panel.question}`;
  const base = document.createElement('p');
  base.className = 'denominator';
  base.textContent = `Percentage base: ${count(panel.base)} ${panel.baseLabel}.`;
  const note = document.createElement('p');
  note.className = 'chart-note'; note.textContent = panel.note;
  const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
  chart.className = 'theme-adapt a11y-bar-chart--endpoint-values';
  chart.chartTitle = panel.title;
  chart.total = panel.base;
  chart.context = `Reporting period: 2022–23. Base: ${count(panel.base)} ${panel.baseLabel}.`;
  chart.explanation = `<p>${panel.note}</p><p>Each percentage divides the row count by ${count(panel.base)} ${panel.baseLabel}, then multiplies by 100. Percentages are rounded to two decimal places.</p>`;
  chart.messages = { total: `Percentage base: ${panel.baseLabel}`, showData: 'Data', explain: 'Explain', exportCsv: 'Download CSV', detailsHelp: 'Hover or focus a bar for details. Activate to keep details open; press Escape to close.' };
  chart.config = { headingLevel: 3, scaleMode: 'population-share', inferTotal: false, showSummary: false, showTotal: false, showContext: false, showDetails: false, dataView: 'dialog', showGlossary: false, announceChanges: false };
  chart.data = panel.rows.map(([label, value], i) => ({ id: `${panel.id}-${i}`, label, value }));
  article.append(question, base, chart, note);
  $('#view-body').append(article);
}
function render() {
  const section = sections.find(s => s.id === selected);
  document.title = `${section?.title ?? 'Overview'} · Dispute resolution · 2022–23`;
  $('#section-nav').replaceChildren(viewLink('overview', 'Overview'), ...sections.map(s => viewLink(s.id, s.title)));
  $('#view-title').textContent = section?.title ?? 'Overview';
  $('#view-kicker').textContent = section ? 'Explore reported activity' : 'Understand the report';
  $('#view-description').textContent = section?.description ?? 'IDEA provides procedures for resolving disagreements about special education. Choose a report section to explore its counts and outcomes. Counts describe reported activities, not unique children or families. The four totals may overlap and should not be added together.';
  $('#view-body').replaceChildren();
  if (!section) {
    const cards = document.createElement('div'); cards.className = 'overview-grid';
    const statusLabels: Record<string, [string, string, string]> = {
      written: ['reports issued', 'withdrawn/dismissed', 'pending'],
      mediation: ['mediations held', 'withdrawn/not held', 'pending'],
      dueprocess: ['hearings adjudicated', 'withdrawn/dismissed', 'pending'],
      expedited: ['hearings adjudicated', 'withdrawn/dismissed', 'pending'],
    };
    sections.forEach(s => {
      const card = document.createElement('article'); card.className = 'overview-card';
      const link = viewLink(s.id, s.title); link.className = 'overview-card-link';
      const heading = document.createElement('h3'); heading.append(link);
      const arrow = document.createElement('span'); arrow.className = 'overview-arrow'; arrow.textContent = '→'; arrow.setAttribute('aria-hidden', 'true');
      const chart = document.createElement('a11y-segmented-bar-chart') as A11ySegmentedBarChartElement;
      chart.className = 'theme-adapt';
      chart.total = s.total;
      chart.totalLabel = s.unit;
      chart.config = { mode: 'breakdown', presentation: 'compact', showSummary: false, showDetails: false, showActions: false, showPercentages: false };
      // Each first panel is a complete status partition. Keep completed,
      // withdrawn, and pending in the same order across the overview.
      chart.data = [0, 2, 1].map((rowIndex, index) => ({
        id: `${s.id}-status-${index}`,
        value: s.panels[0].rows[rowIndex][1],
        label: statusLabels[s.id][index],
      }));
      chart.theme = { segments: Object.fromEntries(chart.data.map((item, index) => [item.id, { color: ['#1f4093', '#73b3e7', '#c6cace'][index], pattern: 'none' }])) };
      card.append(heading, arrow, chart); cards.append(card);
    });
    $('#view-body').append(cards);
  } else {
    const summary = document.createElement('div'); summary.className = 'section-summary';
    const summaryHeading = document.createElement('h3'); summaryHeading.textContent = 'Quick Summary';
    const total = document.createElement('p'); total.className = 'summary-total'; total.textContent = `${count(section.total)} ${section.unit}`;
    const takeaway = document.createElement('p'); takeaway.textContent = section.takeaway;
    summary.append(summaryHeading, total, takeaway); $('#view-body').append(summary);
    const settings = document.createElement('details'); settings.className = 'display-settings';
    settings.innerHTML = `<summary>Chart display settings</summary><fieldset><legend>Applies to every chart in this section</legend><label for="values">Values <select id="values"><option value="both">Counts and percentages</option><option value="counts">Counts only</option></select></label><label class="checkbox-label"><input id="pattern" type="checkbox"> Add a fill pattern</label></fieldset>`;
    $('#view-body').append(settings);
    $<HTMLSelectElement>('#values').value = percentages ? 'both' : 'counts';
    $<HTMLInputElement>('#pattern').checked = patterned;
    settings.addEventListener('change', () => {
      percentages = $<HTMLSelectElement>('#values').value === 'both';
      patterned = $<HTMLInputElement>('#pattern').checked;
      applyDisplaySettings(); updateURL();
      $('#view-status').textContent = `Chart display updated: ${percentages ? 'counts and percentages' : 'counts only'}, ${patterned ? 'patterned' : 'solid'} bars.`;
    });
    section.panels.forEach(addChart);
    const next = sections[sections.indexOf(section) + 1];
    const end = document.createElement('nav'); end.className = 'section-end'; end.setAttribute('aria-label', 'Continue reading');
    end.append(viewLink('overview', 'Back to overview'));
    if (next) end.append(viewLink(next.id, `Next: ${next.title} →`));
    $('#view-body').append(end);
    applyDisplaySettings();
  }
}
window.addEventListener('popstate', () => { readURL(); render(); });
$('#share').onclick = async () => {
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    $('#share-status').textContent = 'Link copied to this report view.';
  } catch {
    $('#share-status').textContent = 'Automatic copying is unavailable. Copy the link from the field below.';
    $('#share-fallback').hidden = false;
    const input = $<HTMLInputElement>('#share-fallback input'); input.value = url; input.focus(); input.select();
  }
};
$('#print').onclick = () => window.print();
readURL(); render(); updateURL();

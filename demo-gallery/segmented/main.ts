import { defineA11ySegmentedBarChart, type A11ySegmentedBarChartElement } from '../../packages/segmented-bar-chart/src/index.js';
import '../../packages/segmented-bar-chart/src/styles.css';
import { catalogs, labels } from './locales.js';
import './style.css';

defineA11ySegmentedBarChart();
const categories = [
  { id: 'resolved', label: 'Resolved', value: 64, definition: 'Requests with a recorded resolution.' },
  { id: 'pending', label: 'Pending', value: 24, definition: 'Requests still being reviewed.' },
  { id: 'withdrawn', label: 'Withdrawn', value: 12, definition: 'Requests withdrawn before resolution.' },
];
const chart = (slot: string, properties: Record<string, unknown>) => {
  const element = document.createElement('a11y-segmented-bar-chart') as A11ySegmentedBarChartElement;
  Object.assign(element, properties); document.getElementById(slot)!.append(element); return element;
};
const breakdown = chart('breakdown', { chartTitle: 'Request status', data: categories, total: 100, totalLabel: 'requests', config: { mode: 'breakdown', presentation: 'full', showDetails: true } });
chart('comparison', { chartTitle: 'Meeting activity', data: [{ id: 'meetings', label: 'Meetings held', value: 32, definition: 'Meetings recorded during the period.' }], total: 100, totalLabel: 'requests', config: { mode: 'comparison', presentation: 'full', highlightedId: 'meetings', showDetails: true } });
chart('linked', { chartTitle: 'Request status summary', data: categories, total: 100, totalLabel: 'requests', href: '#details', config: { mode: 'breakdown', presentation: 'compact', showSummary: false, showDetails: false, showActions: false, showExplanation: false, showGlossary: false, showExport: false } });
chart('interactive', { chartTitle: 'Request status details', data: categories, total: 100, totalLabel: 'requests', href: '#details', config: { mode: 'breakdown', presentation: 'compact', showSummary: false, showDetails: true } });
chart('availability', { chartTitle: 'Incomplete data', suppressed: true, data: [{ id: 'reported', label: 'Reported', value: 40 }, { id: 'missing', label: 'Missing', value: null }, { id: 'hidden', label: 'Small group', value: 0 }], total: 100, config: { mode: 'breakdown', presentation: 'compact', showDetails: true, showSummary: false } });
chart('above', { chartTitle: 'Above the reference', data: [{ id: 'value', label: 'Recorded activity', value: 120 }], total: 100, config: { mode: 'comparison', presentation: 'compact', highlightedId: 'value', showSummary: false } });
const groupRows = [
  { id: 'delta', label: 'Delta', value: 12 }, { id: 'alpha', label: 'Alpha', value: 30 },
  { id: 'epsilon', label: 'Epsilon', value: 8 }, { id: 'beta', label: 'Beta', value: 25 },
  { id: 'gamma', label: 'Gamma', value: 20 }, { id: 'source-other', label: 'Other', value: 5 },
];
const grouped = chart('grouping', { chartTitle: 'Requests by category', data: groupRows, total: 100, totalLabel: 'requests', config: { mode: 'breakdown', presentation: 'full', showDetails: true } });
const groupDataset = document.querySelector<HTMLSelectElement>('#group-dataset')!;
const groupMode = document.querySelector<HTMLSelectElement>('#group-mode')!;
const groupOrder = document.querySelector<HTMLSelectElement>('#group-order')!;
const groupPicks = document.querySelector<HTMLFieldSetElement>('#group-picks')!;
const pickOptions = document.querySelector<HTMLDivElement>('#group-pick-options')!;
const groupHighlight = document.querySelector<HTMLInputElement>('#group-highlight')!;
let updated = false;
let chosen: string[] = [];
function updateGrouping() {
  const rows = groupDataset.value === 'few' ? groupRows.slice(0, 3).map((row, index) => ({ ...row, value: [50, 30, 20][index] })) : groupRows.map(row => ({ ...row }));
  if (updated && rows.length > 3) { rows[0].value = 27; rows[1].value = 15; }
  const data = groupDataset.value === 'incomplete' ? rows.map((row, index) => index === 4 ? { ...row, value: null } : index === 5 ? { ...row, value: 0 } : row) : rows;
  grouped.suppressed = groupDataset.value === 'incomplete';
  groupPicks.hidden = groupMode.value !== 'explicit';
  groupOrder.disabled = groupMode.value === 'explicit';
  grouped.data = data;
  grouped.config = { mode: 'breakdown', presentation: 'full', showDetails: true, locale: locale.value, segmentOrder: groupOrder.value as 'value' | 'source' | 'label', ...(groupMode.value === 'explicit' ? { separateCategoryIds: chosen } : {}), ...(groupHighlight.checked ? { highlightedId: 'source-other' } : {}) };
}
for (const row of groupRows) {
  const label = document.createElement('label'); const input = document.createElement('input');
  input.type = 'checkbox'; input.value = row.id; const text = document.createElement('span'); text.textContent = row.label; label.append(input, text); pickOptions.append(label);
  input.addEventListener('change', () => {
    chosen = input.checked ? [...chosen, input.value] : chosen.filter(id => id !== input.value);
    for (const option of pickOptions.querySelectorAll<HTMLInputElement>('input')) {
      option.disabled = chosen.length === 3 && !option.checked;
      option.nextElementSibling!.textContent = `${option.value === 'source-other' ? 'Other' : groupRows.find(item => item.id === option.value)!.label}${option.checked ? ` (${chosen.indexOf(option.value) + 1})` : ''}`;
    }
    updateGrouping();
  });
}
[groupDataset, groupMode, groupOrder, groupHighlight].forEach(control => control.addEventListener('change', updateGrouping));
document.querySelector('#group-update')!.addEventListener('click', () => { updated = !updated; updateGrouping(); });
const locale = document.querySelector<HTMLSelectElement>('#locale')!;
const details = document.querySelector<HTMLInputElement>('#details-toggle')!;
const values = document.querySelector<HTMLSelectElement>('#values')!;
const theme = document.querySelector<HTMLSelectElement>('#theme')!;
function update() {
  const language = locale.value as keyof typeof catalogs; const content = labels[language];
  breakdown.lang = language; breakdown.messages = catalogs[language]; breakdown.chartTitle = content.title; breakdown.totalLabel = content.total;
  breakdown.data = categories.map((item, i) => ({ ...item, label: [content.resolved, content.pending, content.withdrawn][i], definition: content.definitions[i] }));
  breakdown.theme = theme.value === 'alternate' ? { segments: { resolved: { color: '#6f2570', pattern: 'dots' }, pending: { color: '#005a5b', pattern: 'diagonal' }, withdrawn: { color: '#704800', pattern: 'horizontal' } } } : {};
  breakdown.config = { ...breakdown.config, locale: language, showDetails: details.checked, showCounts: values.value !== 'shares', showPercentages: values.value !== 'counts' };
  grouped.lang = language; grouped.messages = catalogs[language]; updateGrouping();
}
[locale, details, values, theme].forEach(control => control.addEventListener('change', update));
updateGrouping();

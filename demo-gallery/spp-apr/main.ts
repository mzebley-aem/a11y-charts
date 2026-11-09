import '../../packages/line-chart/src/define.js';
import '../../packages/bar-chart/src/define.js';
import '../../packages/line-chart/src/styles.css';
import '../../packages/bar-chart/src/styles.css';
import '../adapt-report-theme.css';
import './report.css';
import type { A11yLineChartElement } from '../../packages/line-chart/src/a11y-line-chart-element.js';
import type { A11yBarChartElement } from '../../packages/bar-chart/src/a11y-bar-chart-element.js';
import { indicators, type Measure } from './data.js';
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const percent = (n: number) => `${n.toFixed(2)}%`;
const count = (n: number) => n.toLocaleString('en-US');
const met = (m: Measure) =>
  m.direction === 'above' ? m.actual >= m.target : m.actual <= m.target;
const direction = (m: Measure) =>
  m.direction === 'above' ? 'Higher is better' : 'Lower is better';
const outcomeLabel = (m: Measure) =>
  m.id === '6B'
    ? 'Target needs confirmation'
    : met(m)
      ? '✓ Target met'
      : 'Target not met';
const outcomeClass = (m: Measure) =>
  m.id === '6B' ? 'review-needed' : met(m) ? 'met' : 'unmet';
const state = new URLSearchParams(location.search);
let indicator =
  indicators.find((i) => i.id === state.get('indicator')) ?? indicators[0];
let measure =
  indicator.measures.find((m) => m.id === state.get('measure')) ??
  indicator.measures[0];
let view = state.get('view') === 'comparison' ? 'comparison' : 'trend';
let zoom = state.get('zoom') !== 'false';
let labels = state.get('labels') === 'true';
let actual = state.get('actual') !== 'false';
let target = state.get('target') !== 'false';
let pattern = state.get('pattern') === 'diagonal' ? 'diagonal' : 'none';
let notes: Record<string, string> = {};
try {
  notes = JSON.parse(localStorage.getItem('spp-apr-review-v1') ?? '{}');
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) notes = {};
} catch {
  /* Storage may be unavailable. */
}
const savedNotes = { ...notes };
let renderedSearch = location.search;
function updateURL(mode: 'push' | 'replace' = 'replace') {
  const url = new URL(location.href);
  Object.entries({
    indicator: indicator.id,
    measure: measure.id,
    view,
    zoom: String(zoom),
    labels: String(labels),
    pattern,
    actual: String(actual),
    target: String(target),
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  if (url.href !== location.href)
    history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url);
  renderedSearch = location.search;
  $('#share-status').textContent = '';
  const measureStatus = document.querySelector('#measure-share-status');
  if (measureStatus) measureStatus.textContent = '';
  $('#share-fallback').hidden = true;
}
function saveDraft() {
  notes[indicator.id] = $<HTMLTextAreaElement>('#review-notes').value;
}
function announceMeasure() {
  $('#report-status').textContent =
    `Measure ${measure.id}: ${measure.title}. ${percent(measure.actual)} actual; ${measure.id === '6B' ? 'target needs confirmation' : met(measure) ? 'target met' : 'target not met'}. ${view === 'trend' ? 'Trend over time' : '2023 comparison'} shown.`;
}
function updateSeriesStatus() {
  const notice = document.querySelector<HTMLElement>('#series-status');
  if (notice) {
    notice.hidden = actual || target;
    notice.textContent =
      actual || target
        ? ''
        : 'Both series are hidden. Use Chart display settings to show the actual or target series.';
  }
}
function renderMeasure() {
  const settingsOpen =
    document.querySelector<HTMLDetailsElement>('.display-settings')?.open ??
    false;

  $('#measure-nav').replaceChildren();
  indicator.measures.forEach((m) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `Measure ${m.id}`;
    button.setAttribute('aria-pressed', String(m.id === measure.id));
    button.onclick = () => {
      measure = m;
      renderMeasure();
      updateURL('push');
      announceMeasure();
      $<HTMLButtonElement>(
        `#measure-nav button[data-measure="${m.id}"]`,
      ).focus();
    };
    button.setAttribute('aria-controls', 'measure-content');
    button.dataset.measure = m.id;
    $('#measure-nav').append(button);
  });
  const change = measure.actual - measure.previous;
  const difference = measure.actual - measure.target;
  const baseline = measure.baseline
    ? `The FFY 2023 result is ${Math.abs(measure.actual - measure.baseline.value).toFixed(2)} percentage points ${measure.actual >= measure.baseline.value ? 'above' : 'below'} the ${measure.baseline.year} baseline of ${percent(measure.baseline.value)}.`
    : 'A baseline value is not available in the supplied example.';
  $('#measure-content').innerHTML = `
    <div class="measure-title"><h3>${measure.title}</h3><span class="direction">${direction(measure)}</span></div>
    <div class="result-summary"><span class="outcome ${outcomeClass(measure)}">${outcomeLabel(measure)}</span><p><strong>${percent(measure.actual)}</strong> actual · <strong>${percent(measure.target)}</strong> ${measure.id === '6B' ? 'detailed target (under review)' : 'target'}</p><p>${Math.abs(difference).toFixed(2)} percentage points ${difference >= 0 ? 'above' : 'below'} target. The rate ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(2)} percentage points from ${percent(measure.previous)} in FFY 2022.</p><p>${baseline}</p></div>
    ${measure.id === '6B' ? '<p class="data-note">Source discrepancy: the detailed comparison uses an 18.29% target; the PDF summary prints 28.12%. Confirm the target before publication.</p>' : ''}
    <div class="view-nav" role="group" aria-label="Chart view"><button type="button" data-view="trend" aria-controls="chart-stage" aria-pressed="${view === 'trend'}">Trend over time</button><button type="button" data-view="comparison" aria-controls="chart-stage" aria-pressed="${view === 'comparison'}">2023 comparison</button></div>
    <div class="measure-review-actions"><button type="button" id="measure-share">Copy link to this measure</button><a href="#feedback">Add review notes for this indicator</a></div><p id="measure-share-status" role="status"></p>
    <p class="view-description">${view === 'trend' ? (measure.history ? 'Reported results and state targets, FFY 2018–2023.' : 'Earlier history is unavailable. Showing the two reported results; the 2022 target is unavailable.') : 'Compare the previous year, current target, and current result on the same percentage scale.'}</p>
    <p id="series-status" class="data-note" role="status" hidden></p>
    <div id="chart-stage"></div>
    <details class="display-settings" ${settingsOpen ? 'open' : ''}><summary>Chart display settings</summary><div class="settings-grid">
      ${view === 'trend' ? `<label><input type="checkbox" id="zoom" ${zoom ? 'checked' : ''}> Zoom Y-axis to data</label><label><input type="checkbox" id="labels" ${labels ? 'checked' : ''}> Show values on trend</label><label><input type="checkbox" id="actual" ${actual ? 'checked' : ''}> Show actual series</label><label><input type="checkbox" id="target" ${target ? 'checked' : ''}> Show target series</label>` : `<label for="pattern">Bar pattern<select id="pattern"><option value="none">Solid</option><option value="diagonal" ${pattern === 'diagonal' ? 'selected' : ''}>Diagonal lines</option></select></label>`}
    </div></details>
    <details class="reading-guide"><summary>How to read this measure</summary><p>${direction(measure)}. A result ${measure.direction === 'above' ? 'at or above' : 'at or below'} the target meets the target. Percentages describe ${indicator.population.replace(/^[A-Z]/, (letter) => letter.toLowerCase())}. ${count(measure.count)} of ${count(indicator.total)} are included in this measure.</p><p>A percentage point is the difference between two percentages. A baseline is the reference year used to describe longer-term change.</p></details>`;
  $('#feedback-context').textContent =
    `Notes apply to Indicator ${indicator.id}: ${indicator.title}. Current measure: ${measure.id}.`;
  const stage = $('#chart-stage');
  if (view === 'trend') {
    const chart = document.createElement(
      'a11y-line-chart',
    ) as A11yLineChartElement;
    chart.chartTitle = `Measure ${measure.id}: actual vs. target`;
    chart.config = {
      headingLevel: 4,
      valuePreset: 'percent',
      decimalPlaces: 2,
      axisDecimalPlaces: 1,
      positiveDirection: measure.direction,
      showSummary: false,
      showContext: false,
      showActions: true,
      showControls: false,
      showExplanation: true,
      showGlossary: false,
      dataView: 'dialog',
      tableVisibility: 'screen-reader',
      initialZoomY: zoom,
      showActualValues: labels,
      showTargetValues: labels,
      fillActual: false,
      showActualLine: actual,
      showTargetLine: target,
      fillTarget: false,
      yAxisBaseMin: 0,
      yAxisBaseMax: 100,
      xAxisTitle: 'Federal fiscal year',
      yAxisTitle: 'Percent',
      autoPerPointMinWidth: false,
      dynamicMinWidth: false,
      minWidth: 560,
    };
    chart.data = measure.history ?? [
      { x: '2022', actual: measure.previous, target: null },
      { x: '2023', actual: measure.actual, target: measure.target },
    ];
    // Keep baseline comparisons in the authored summary for every measure,
    // including 6A whose baseline is later than the first plotted year.
    chart.theme = {
      actualColor: '#1f4093',
      targetColor: '#667b1f',
      baselineColor: '#8c3871',
      // A simple line presentation avoids auxiliary fill/outline series giving
      // ECharts an unrelated automatic legend swatch in this report.
      actualLineOutlineWidth: 0,
      targetLineOutlineWidth: 0,
      axisLabelFontSize: 14,
      legendFontSize: 14,
    };
    chart.addEventListener('a11y-line-chart-config-change', () => {
      zoom = chart.config.initialZoomY ?? zoom;
      actual = chart.config.showActualLine ?? actual;
      target = chart.config.showTargetLine ?? target;
      $<HTMLInputElement>('#zoom').checked = zoom;
      $<HTMLInputElement>('#actual').checked = actual;
      $<HTMLInputElement>('#target').checked = target;
      updateSeriesStatus();
      updateURL();
    });
    stage.append(chart);
  } else {
    const chart = document.createElement(
      'a11y-bar-chart',
    ) as A11yBarChartElement;
    chart.chartTitle = `Measure ${measure.id}: rate comparison`;
    chart.config = {
      headingLevel: 4,
      scaleMode: 'largest',
      scaleMaximum: 100,
      inferTotal: false,
      showTotal: false,
      showPercentages: false,
      showCounts: true,
      countDecimals: 2,
      showSummary: false,
      showActions: true,
      showExplanation: true,
      showGlossary: false,
      showDetails: false,
      showExport: false,
      dataView: 'dialog',
      tableVisibility: 'screen-reader',
    };
    chart.data = [
      { id: 'previous', label: 'FFY 2022 actual', value: measure.previous },
      { id: 'target', label: 'FFY 2023 target', value: measure.target },
      { id: 'actual', label: 'FFY 2023 actual', value: measure.actual },
    ];
    chart.messages = {
      countHeader: 'Rate',
      categoryHeader: 'Reporting period',
      scaleShared: 'Bars use a percentage scale from 0% to {maximum}%',
    };
    chart.explanation = `<p>${percent(measure.actual)} in FFY 2023, compared with a target of ${percent(measure.target)}. ${direction(measure)}. ${measure.id === '6B' ? 'Using the detailed target, this result would not meet the target. The source summary gives a different target; confirmation is needed.' : `The target was ${met(measure) ? 'met' : 'not met'}.`} The change from FFY 2022 was ${Math.abs(change).toFixed(2)} percentage points ${change >= 0 ? 'higher' : 'lower'}.</p>`;
    chart.formatValue = ({ value }) => percent(value);
    chart.theme = {
      color: '#1f4093',
      patternType: pattern as 'none' | 'diagonal',
    };
    stage.append(chart);
  }
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(
    (button) =>
      (button.onclick = () => {
        view = button.dataset.view!;
        renderMeasure();
        updateURL('push');
        announceMeasure();
        $<HTMLButtonElement>(`[data-view="${view}"]`).focus();
      }),
  );
  const updateSettings = () => {
    if (view === 'trend') {
      zoom = $<HTMLInputElement>('#zoom').checked;
      labels = $<HTMLInputElement>('#labels').checked;
      actual = $<HTMLInputElement>('#actual').checked;
      target = $<HTMLInputElement>('#target').checked;
      const chart = $<A11yLineChartElement>('#chart-stage a11y-line-chart');
      chart.config = {
        ...chart.config,
        initialZoomY: zoom,
        showActualValues: labels,
        showTargetValues: labels,
        showActualLine: actual,
        showTargetLine: target,
      };
    } else {
      pattern = $<HTMLSelectElement>('#pattern').value;
      const chart = $<A11yBarChartElement>('#chart-stage a11y-bar-chart');
      chart.theme = {
        ...chart.theme,
        patternType: pattern as 'none' | 'diagonal',
      };
    }
    updateURL();
    updateSeriesStatus();
  };
  updateSeriesStatus();
  $('#measure-share').onclick = () => copyViewLink($('#measure-share-status'));
  ['zoom', 'labels', 'actual', 'target', 'pattern'].forEach((id) =>
    document
      .querySelector(`#${id}`)
      ?.addEventListener('change', updateSettings),
  );
}
function render() {
  document.title = `Indicator ${indicator.id}: ${indicator.title} · SPP/APR mockup`;
  $('#indicator-nav').replaceChildren();
  indicators.forEach((i) => {
    const link = document.createElement('a');
    link.href = `?indicator=${i.id}`;
    link.innerHTML = `<span>${i.id.padStart(2, '0')}</span>${i.title}`;
    if (i.id === indicator.id) link.setAttribute('aria-current', 'page');
    link.onclick = (event) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      event.preventDefault();
      if (indicator.id === i.id) return;
      saveDraft();
      indicator = i;
      measure = i.measures[0];
      render();
      updateURL('push');
      $('#indicator-title').focus();
    };
    $('#indicator-nav').append(link);
  });
  $('#indicator-number').textContent = `Indicator ${indicator.id}`;
  $('#indicator-title').textContent = indicator.title;
  $('#indicator-description').textContent = indicator.description;
  $('#measurement-text').textContent = indicator.measurement;
  $('#overview').innerHTML = indicator.measures
    .map(
      (m) =>
        `<div class="summary-card"><span class="eyebrow">${indicator.measures.length === 1 ? 'FFY 2023 result' : `Measure ${m.id}`}</span><strong>${percent(m.actual)}</strong><p>${m.title}</p><span class="outcome ${outcomeClass(m)}">${outcomeLabel(m)}</span><small>${m.id === '6B' ? 'Detailed target (under review)' : 'Target'} ${percent(m.target)} · ${direction(m)}</small></div>`,
    )
    .join('');
  renderMeasure();
  $('#population-heading').textContent =
    indicator.id === '2' ? 'Exit reasons' : indicator.title;
  $('#population-description').textContent =
    `${count(indicator.total)} ${indicator.population.replace(/^[A-Z]/, (letter) => letter.toLowerCase())} were reported in FFY 2023.`;
  const population = $<A11yBarChartElement>('#population-chart');
  population.chartTitle = 'Reported population by category';
  population.total = indicator.total;
  population.config = {
    headingLevel: 3,
    scaleMode: 'population-share',
    inferTotal: false,
    showTotal: true,
    showCounts: true,
    showPercentages: true,
    percentageDecimals: 2,
    showSummary: false,
    showActions: true,
    showExplanation: true,
    showGlossary: true,
    showDetails: true,
    tableVisibility: 'screen-reader',
    dataView: 'dialog',
  };
  population.data = indicator.categories.map(([label, value], i) => ({
    id: `category-${i}`,
    label,
    value,
    definition: `${label}, as categorized in the supplied report example.`,
  }));
  const listed = indicator.categories.reduce(
    (sum, [, value]) => sum + value,
    0,
  );
  $('#population-note').textContent =
    listed < indicator.total
      ? `The supplied categories cover ${count(listed)} of ${count(indicator.total)} children. ${count(indicator.total - listed)} children are not categorized in the example. Percentages use the full reported population and will not sum to 100%.`
      : 'Percentages use the full reported population. Values may differ slightly due to rounding.';
  $('#source-list').replaceChildren(
    ...indicator.notes.map((note) => {
      const li = document.createElement('li');
      li.textContent = note;
      return li;
    }),
  );
  $<HTMLTextAreaElement>('#review-notes').value =
    typeof notes[indicator.id] === 'string' ? notes[indicator.id] : '';
  $('#feedback-status').textContent =
    (notes[indicator.id] ?? '') !== (savedNotes[indicator.id] ?? '')
      ? 'Unsaved changes. Save these notes in this browser or download a copy before leaving.'
      : '';
}
async function copyViewLink(status: HTMLElement) {
  updateURL();
  try {
    await navigator.clipboard.writeText(location.href);
    status.textContent =
      'Link copied. It includes the indicator, measure, chart view, and display settings. Review notes are not included.';
  } catch {
    status.textContent = 'Copy the link below to share this view.';
    $('#share-fallback').hidden = false;
    const input = $<HTMLInputElement>('#share-fallback input');
    input.value = location.href;
    input.select();
  }
}
$('#share').onclick = () => copyViewLink($('#share-status'));
$<HTMLTextAreaElement>('#review-notes').addEventListener('input', () => {
  saveDraft();
  const message =
    'Unsaved changes. Save these notes in this browser or download a copy before leaving.';
  if ($('#feedback-status').textContent !== message)
    $('#feedback-status').textContent = message;
});
$('#print').onclick = () => window.print();
$('#feedback-form').onsubmit = (event) => {
  event.preventDefault();
  saveDraft();
  try {
    localStorage.setItem('spp-apr-review-v1', JSON.stringify(notes));
    Object.assign(savedNotes, notes);
    $('#feedback-status').textContent =
      'Notes saved in this browser. Download them to share.';
  } catch {
    $('#feedback-status').textContent =
      'Browser storage is unavailable. Download your notes to keep a copy.';
  }
};
$('#download-notes').onclick = () => {
  saveDraft();
  const text = [
    'SPP/APR mockup review · Version 1',
    `View: ${location.href}`,
    ...indicators.map(
      (i) => `\nIndicator ${i.id}: ${i.title}\n${notes[i.id] || '(No notes)'}`,
    ),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spp-apr-review-notes.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#feedback-status').textContent = 'Review notes downloaded.';
};
window.addEventListener('popstate', () => {
  // Fragment links are native navigation: do not reload or steal their focus.
  if (location.search === renderedSearch) return;
  saveDraft();
  const params = new URLSearchParams(location.search);
  indicator =
    indicators.find((i) => i.id === params.get('indicator')) ?? indicators[0];
  measure =
    indicator.measures.find((m) => m.id === params.get('measure')) ??
    indicator.measures[0];
  view = params.get('view') === 'comparison' ? 'comparison' : 'trend';
  zoom = params.get('zoom') !== 'false';
  labels = params.get('labels') === 'true';
  actual = params.get('actual') !== 'false';
  target = params.get('target') !== 'false';
  pattern = params.get('pattern') === 'diagonal' ? 'diagonal' : 'none';
  renderedSearch = location.search;
  render();
  $('#indicator-title').focus();
});
document
  .querySelectorAll<HTMLAnchorElement>('a[href="#source-notes"]')
  .forEach((link) =>
    link.addEventListener('click', () => {
      $<HTMLDetailsElement>('#source-notes').open = true;
    }),
  );
render();

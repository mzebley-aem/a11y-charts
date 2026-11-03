import type { A11yLineChartConfig } from '../packages/line-chart/src/model.js';
import { A11yLineChartElement } from '../packages/line-chart/src/a11y-line-chart-element.js';
import { resolveConfig as resolveLineConfig } from '../packages/line-chart/src/config.js';
import type { A11yBarChartConfig } from '../packages/bar-chart/src/model.js';
import { A11yBarChartElement } from '../packages/bar-chart/src/a11y-bar-chart-element.js';
import { resolveConfig as resolveBarConfig } from '../packages/bar-chart/src/config.js';

type ChartKind = 'line' | 'bar';
type Option = readonly [value: string, label: string];
let nextPanelId = 0;

function addGroup(parent: HTMLElement, title: string): HTMLFieldSetElement {
  const group = document.createElement('fieldset');
  group.className = 'gallery-setting-group';
  group.append(Object.assign(document.createElement('legend'), { textContent: title }));
  parent.append(group);
  return group;
}

function addHelp(label: HTMLElement, control: HTMLElement, text: string, id: string): void {
  const help = document.createElement('small');
  help.className = 'gallery-setting-help';
  help.id = id;
  help.textContent = text;
  control.setAttribute('aria-describedby', id);
  label.append(help);
}

function addCheckbox(
  group: HTMLElement,
  id: string,
  labelText: string,
  hint: string,
  checked: boolean,
  change: (value: boolean, input: HTMLInputElement) => void
): HTMLInputElement {
  const label = document.createElement('label');
  label.className = 'gallery-setting';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.checked = checked;
  input.addEventListener('change', () => change(input.checked, input));
  const controlLabel = document.createElement('span');
  controlLabel.className = 'gallery-setting-control';
  controlLabel.append(input, document.createTextNode(labelText));
  label.append(controlLabel);
  addHelp(label, input, hint, `${id}-help`);
  group.append(label);
  return input;
}

function addSelect(
  group: HTMLElement,
  id: string,
  labelText: string,
  hint: string,
  options: readonly Option[],
  selected: string,
  change: (value: string, select: HTMLSelectElement) => void
): HTMLSelectElement {
  const label = document.createElement('label');
  label.className = 'gallery-setting';
  label.append(document.createTextNode(`${labelText} `));
  const select = document.createElement('select');
  select.id = id;
  for (const [value, text] of options) {
    select.append(Object.assign(document.createElement('option'), { value, textContent: text }));
  }
  select.value = selected;
  select.addEventListener('change', () => change(select.value, select));
  label.append(select);
  addHelp(label, select, hint, `${id}-help`);
  group.append(label);
  return select;
}

function numericOptions(values: readonly number[]): Option[] {
  return values.map((value) => [String(value), String(value)] as const);
}

/** Mounts accessible live settings for a chart demo. Call refresh after resetting the example chart. */
export function mountSettings(
  container: HTMLElement,
  chart: A11yLineChartElement | A11yBarChartElement,
  kind: ChartKind
): { refresh(): void; destroy(): void } {
  const lineChart = kind === 'line' && chart instanceof A11yLineChartElement ? chart : undefined;
  const barChart = kind === 'bar' && chart instanceof A11yBarChartElement ? chart : undefined;
  if (!lineChart && !barChart) throw new TypeError(`The ${kind} settings panel needs a matching chart element.`);

  const panelId = `gallery-settings-${++nextPanelId}`;
  const panel = document.createElement('div');
  panel.className = 'settings-grid';
  panel.dataset.settingsPanel = '';
  const common = addGroup(panel, 'Chart display');
  const controls = new Map<string, HTMLInputElement | HTMLSelectElement>();
  const applyLine = <K extends keyof A11yLineChartConfig>(key: K, value: A11yLineChartConfig[K]) => {
    if (!lineChart) return;
    lineChart.config = { ...lineChart.config, [key]: value };
    emitChange();
  };
  const applyBar = <K extends keyof A11yBarChartConfig>(key: K, value: A11yBarChartConfig[K]) => {
    if (!barChart) return;
    barChart.config = { ...barChart.config, [key]: value };
    emitChange();
  };
  const onSharedSelect = (key: 'dataView' | 'tableVisibility') => (value: string) => {
    if (lineChart) applyLine(key, value as A11yLineChartConfig[typeof key]);
    else applyBar(key, value as A11yBarChartConfig[typeof key]);
  };
  const onSharedCheck = (key: 'showSummary' | 'showExplanation' | 'showGlossary' | 'showExport') => (value: boolean) => {
    if (lineChart) applyLine(key, value);
    else applyBar(key, value);
  };
  const select = (group: HTMLElement, key: string, label: string, help: string, options: readonly Option[], value: string, change: (value: string) => void) => {
    const control = addSelect(group, `${panelId}-${key}`, label, help, options, value, (next) => change(next));
    controls.set(key, control);
  };
  const checkbox = (group: HTMLElement, key: string, label: string, help: string, value: boolean, change: (value: boolean) => void) => {
    const control = addCheckbox(group, `${panelId}-${key}`, label, help, value, (next) => change(next));
    controls.set(key, control);
  };

  select(common, 'dataView', 'Data view', 'Choose whether complete data opens in a modal dialog or an inline disclosure.', [
    ['dialog', 'Dialog'], ['inline', 'Inline']
  ], String(resolvedConfig().dataView), onSharedSelect('dataView'));
  select(common, 'tableVisibility', 'Data table', 'Choose whether the accessible data table is visible, screen-reader only, or omitted.', [
    ['visible', 'Visible'], ['screen-reader', 'Screen-reader only'], ['hidden', 'Hidden']
  ], String(resolvedConfig().tableVisibility), onSharedSelect('tableVisibility'));
  checkbox(common, 'showSummary', 'Show summary', 'Show the chart’s concise text summary.', resolvedConfig().showSummary === true, onSharedCheck('showSummary'));
  checkbox(common, 'showExplanation', 'Show explanation', 'Show the expandable explanation control and content.', resolvedConfig().showExplanation === true, onSharedCheck('showExplanation'));
  checkbox(common, 'showGlossary', 'Show glossary', 'Show category definitions when the example includes them.', resolvedConfig().showGlossary === true, onSharedCheck('showGlossary'));
  checkbox(common, 'showExport', 'Show CSV export', 'Show the CSV export action when chart data is available.', resolvedConfig().showExport === true, onSharedCheck('showExport'));

  if (lineChart) {
    const group = addGroup(panel, 'Line chart');
    checkbox(group, 'showControls', 'Show reader display controls', 'Expose the chart’s built-in Values panel so readers can change lines, fills, patterns, and labels.', resolvedConfig().showControls === true, (value) => applyLine('showControls', value));
    select(group, 'positiveDirection', 'Positive direction', 'Choose which direction counts as a positive result when comparing a value with a numeric target.', [
      ['above', 'Above target'], ['below', 'Below target']
    ], String(resolvedConfig().positiveDirection), (value) => applyLine('positiveDirection', value as NonNullable<A11yLineChartConfig['positiveDirection']>));
    select(group, 'decimalPlaces', 'Value decimal places', 'Set the number of decimal places used for chart values and comparisons.', numericOptions(Array.from({ length: 21 }, (_, index) => index)), String(resolvedConfig().decimalPlaces), (value) => applyLine('decimalPlaces', Number(value)));
    checkbox(group, 'showActualLine', 'Show actual line', 'Show the actual series line.', resolvedConfig().showActualLine === true, (value) => applyLine('showActualLine', value));
    checkbox(group, 'showTargetLine', 'Show target line', 'Show the target series line.', resolvedConfig().showTargetLine === true, (value) => applyLine('showTargetLine', value));
    checkbox(group, 'fillTarget', 'Show target area', 'Show the filled area under the target series when the chart style supports it.', resolvedConfig().fillTarget === true, (value) => applyLine('fillTarget', value));
  } else if (barChart) {
    const group = addGroup(panel, 'Bar chart');
    select(group, 'scaleMode', 'Bar scale', 'Scale bars to the largest reported value or to the reported population total.', [
      ['largest', 'Largest value'], ['population-share', 'Population share']
    ], String(resolvedConfig().scaleMode), (value) => applyBar('scaleMode', value as NonNullable<A11yBarChartConfig['scaleMode']>));
    select(group, 'positiveDirection', 'Positive direction', 'Choose whether a numeric value above or below its target is positive.', [
      ['above', 'Above target'], ['below', 'Below target']
    ], String(resolvedConfig().positiveDirection), (value) => applyBar('positiveDirection', value as NonNullable<A11yBarChartConfig['positiveDirection']>));
    select(group, 'targetStyle', 'Target encoding', 'Choose how target outcomes are distinguished on bars.', [
      ['none', 'No outcome encoding'], ['color', 'Color'], ['texture', 'Texture'], ['color-and-texture', 'Color and texture']
    ], String(resolvedConfig().targetStyle), (value) => applyBar('targetStyle', value as NonNullable<A11yBarChartConfig['targetStyle']>));
    checkbox(group, 'showCounts', 'Show counts', 'Show numeric category values.', resolvedConfig().showCounts === true, (value) => applyBar('showCounts', value));
    checkbox(group, 'showPercentages', 'Show percentages', 'Show each category’s percentage of the total.', resolvedConfig().showPercentages === true, (value) => applyBar('showPercentages', value));
    checkbox(group, 'showTotal', 'Show total', 'Show the reported total beneath the bars.', resolvedConfig().showTotal === true, (value) => applyBar('showTotal', value));
    checkbox(group, 'showDetails', 'Show detail cards', 'Enable category detail cards on hover, focus, and activation.', resolvedConfig().showDetails === true, (value) => applyBar('showDetails', value));
  }

  function resolvedConfig(): Record<string, unknown> {
    return (lineChart ? resolveLineConfig(lineChart.config) : resolveBarConfig(barChart!.config)) as unknown as Record<string, unknown>;
  }

  function currentConfig(): A11yLineChartConfig | A11yBarChartConfig {
    return lineChart ? lineChart.config : barChart!.config;
  }
  function emitChange(): void {
    container.dispatchEvent(new CustomEvent('demo-settings-change', {
      bubbles: true,
      detail: { kind, config: { ...currentConfig() } }
    }));
  }

  container.append(panel);
  const refresh = (): void => {
    const config = resolvedConfig();
    for (const [key, control] of controls) {
      if (control instanceof HTMLInputElement) control.checked = config[key] === true;
      else if (config[key] !== undefined) control.value = String(config[key]);
    }
  };
  refresh();
  return {
    refresh,
    destroy: () => panel.remove()
  };
}

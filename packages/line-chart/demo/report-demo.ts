import '../src/define.ts';
import '../src/styles.css';
import type { A11yLineChartElement } from '../src/index.ts';
import './report-demo.css';

const chart = document.querySelector<A11yLineChartElement>('a11y-line-chart');

function labelForControl(root: Element, control: string): HTMLLabelElement | undefined {
  return root.querySelector<HTMLInputElement>(`input[data-control="${control}"]`)?.closest('label') ?? undefined;
}

function selectLabelForControl(root: Element, control: string): HTMLLabelElement | undefined {
  return root.querySelector<HTMLSelectElement>(`select[data-control="${control}"]`)?.closest('label') ?? undefined;
}

function relabelControl(label: HTMLLabelElement, text: string): void {
  for (const node of [...label.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) node.remove();
  }
  label.append(document.createTextNode(text));
}

function createControlGroup(
  heading: string,
  controls: Array<{ label: HTMLLabelElement; text: string }>,
  modifier = ''
): HTMLDivElement {
  const group = document.createElement('div');
  group.className = `report-chart-control-group${modifier ? ` ${modifier}` : ''}`;

  const title = document.createElement('span');
  title.className = 'report-chart-control-group__title';
  title.textContent = heading;

  const choices = document.createElement('div');
  choices.className = 'report-chart-control-group__choices';
  for (const control of controls) {
    relabelControl(control.label, control.text);
    choices.append(control.label);
  }

  group.append(title, choices);
  return group;
}

function createPatternGroup(
  actualPattern: HTMLLabelElement,
  targetPattern: HTMLLabelElement
): HTMLDivElement {
  const group = document.createElement('div');
  group.className = 'report-chart-control-group report-chart-control-group--patterns';

  const title = document.createElement('span');
  title.className = 'report-chart-control-group__title';
  title.textContent = 'Fill Patterns';

  const choices = document.createElement('div');
  choices.className = 'report-chart-control-group__choices report-chart-pattern-choices';
  for (const [label, text] of [[actualPattern, 'Actual pattern'], [targetPattern, 'Target pattern']] as const) {
    const select = label.querySelector('select');
    if (!select) continue;
    const solid = select.querySelector<HTMLOptionElement>('option[value="none"]');
    if (solid) solid.textContent = 'Solid';
    const labelText = document.createElement('span');
    labelText.textContent = text;
    label.className = 'report-chart-pattern-control';
    label.replaceChildren(labelText, select);
    choices.append(label);
  }

  group.append(title, choices);
  return group;
}

function syncReportChartControls(fieldset: HTMLFieldSetElement): void {
  for (const [fillControl, patternControl] of [['fillActual', 'actualPattern'], ['fillTarget', 'targetPattern']] as const) {
    const fill = fieldset.querySelector<HTMLInputElement>(`input[data-control="${fillControl}"]`);
    const pattern = fieldset.querySelector<HTMLSelectElement>(`select[data-control="${patternControl}"]`);
    if (!fill || !pattern) continue;
    pattern.disabled = !fill.checked;
    pattern.closest('label')?.classList.toggle('is-disabled', pattern.disabled);
  }
}

function applyReportChartControls(): void {
  if (!chart) return;
  const fieldset = chart.querySelector<HTMLFieldSetElement>('.a11y-line-chart__controls fieldset');
  if (!fieldset) return;
  if (fieldset.querySelector('.report-chart-control-group')) {
    syncReportChartControls(fieldset);
    return;
  }

  const zoomYAxis = labelForControl(fieldset, 'initialZoomY');
  const showActualLine = labelForControl(fieldset, 'showActualLine');
  const showTargetLine = labelForControl(fieldset, 'showTargetLine');
  const showActualValues = labelForControl(fieldset, 'showActualValues');
  const showTargetValues = labelForControl(fieldset, 'showTargetValues');
  const fillActual = labelForControl(fieldset, 'fillActual');
  const fillTarget = labelForControl(fieldset, 'fillTarget');
  const actualPattern = selectLabelForControl(fieldset, 'actualPattern');
  const targetPattern = selectLabelForControl(fieldset, 'targetPattern');
  if (!zoomYAxis || !showActualLine || !showTargetLine || !showActualValues || !showTargetValues || !fillActual || !fillTarget || !actualPattern || !targetPattern) return;

  const legend = fieldset.querySelector('legend') ?? document.createElement('legend');
  legend.textContent = 'Chart display settings';
  legend.className = 'visually-hidden';

  const scale = createControlGroup('Scale', [
    { label: zoomYAxis, text: 'Zoom Y-axis to data' }
  ], 'report-chart-control-group--scale');
  zoomYAxis.classList.add('report-chart-switch');
  zoomYAxis.querySelector('input')?.classList.add('report-chart-switch__input');

  const series = createControlGroup('Series', [
    { label: showActualLine, text: 'Show actual series' },
    { label: showTargetLine, text: 'Show target series' }
  ]);
  const values = createControlGroup('Values', [
    { label: showActualValues, text: 'Display actual values' },
    { label: showTargetValues, text: 'Display target values' }
  ]);
  const fills = createControlGroup('Fill Area', [
    { label: fillActual, text: 'Display actual fill' },
    { label: fillTarget, text: 'Display target fill' }
  ]);
  const patterns = createPatternGroup(actualPattern, targetPattern);

  fieldset.replaceChildren(legend, scale, series, values, fills, patterns);
  syncReportChartControls(fieldset);
}

if (chart) {
  chart.addEventListener('a11y-line-chart-display-change', () => {
    queueMicrotask(applyReportChartControls);
  });

  chart.config = {
    announceChanges: true,
    autoDetectGaps: true,
    axisDecimalPlaces: 2,
    contextNote: 'Targets for FFY 2024 and FFY 2025 are planned values; actual results have not yet been reported.',
    decimalPlaces: 2,
    describeMissingAs: '-',
    headingLevel: 3,
    initialZoomY: true,
    stepperVisibility: 'auto',
    tableVisibility: 'screen-reader',
    wrapAround: true
  };

  chart.baseline = {
    x: 2018,
    value: 0.85,
    explanation: 'Hawaii selected FFY 2018 as the baseline year for Indicator 5.'
  };

  chart.theme = {
    actualColor: '#0f62fe',
    actualFill: '#0f62fe',
    actualFillOpacity: 0.48,
    axisLabelFontSize: 16,
    baselineColor: '#ff7ac5',
    baselineLabelColor: '#64264b',
    baselineLineType: 'solid',
    labelFontSize: 18,
    legendFontSize: 16,
    lineWidth: 3,
    targetColor: '#f1c21b',
    targetFill: '#f1c21b',
    targetFillOpacity: 0.48,
    targetLineOutlineColor: '#1b1b1b',
    targetLineOutlineWidth: 5,
    xAxisTitleFontSize: 16,
    yAxisTitleFontSize: 16
  };

  chart.data = [
    { x: 2018, actual: 0.85, target: 1.03 },
    { x: 2019, actual: 1.00, target: 0.97 },
    { x: 2020, actual: 0.03, target: 0.97 },
    { x: 2021, actual: 0.93, target: 0.97 },
    { x: 2022, actual: 1.03, target: 0.98 },
    { x: 2023, actual: 0.83, target: 0.99 },
    { x: 2024, target: 1.00 },
    { x: 2025, target: 1.10 }
  ];

  queueMicrotask(applyReportChartControls);
}

import { beforeEach, describe, expect, it } from 'vitest';
import { A11yBarChartElement, buildBarCsv, buildBarModel, defineA11yBarChart } from '../src/index.js';
import type { A11yBarChartDatum, A11yBarChartDataChangeDetail } from '../src/index.js';

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const data: A11yBarChartDatum[] = [
  { id: 'zero', label: 'Zero group', value: 0 },
  { id: 'shown', label: 'Shown group', value: 10 },
  { id: 'missing', label: 'Missing group', value: null }
];

async function makeChart(attributes: Partial<A11yBarChartElement> = {}, dataView: 'dialog' | 'inline' = 'inline'): Promise<A11yBarChartElement> {
  defineA11yBarChart();
  const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
  chart.config = { dataView };
  chart.chartTitle = 'Visits';
  Object.assign(chart, attributes);
  chart.data = data;
  document.body.append(chart);
  await flush();
  return chart;
}

// The inline table is the first visible table; the hidden background copy is not interactive.
const rowCells = (root: ParentNode) => [...root.querySelectorAll('.a11y-bar-chart__table tbody tr')]
  .map((tr) => [...tr.querySelectorAll('th, td')].map((cell) => cell.textContent));

beforeEach(() => document.body.replaceChildren());

describe('single chart-level suppression flag', () => {
  it('treats a zero as suppressed only when the flag is on, and never suppresses null or targets', () => {
    const off = buildBarModel([{ id: 'a', label: 'A', value: 0, target: 0 }, { id: 'b', label: 'B', value: null }]);
    expect(off.rows.map(({ status, valueText }) => [status, valueText])).toEqual([['reported', '0'], ['missing', 'Not reported']]);
    expect(off.rows[0]).toMatchObject({ value: 0, targetText: '0', targetRelation: 'equal', percentage: null });

    const on = buildBarModel([{ id: 'a', label: 'A', value: 0, target: 0 }, { id: 'b', label: 'B', value: null }], { suppressed: true, total: 5 });
    expect(on.rows.map(({ status, valueText }) => [status, valueText])).toEqual([['suppressed', 'Suppressed'], ['missing', 'Not reported']]);
    expect(on.rows[0]).toMatchObject({ value: null, percentageText: 'Suppressed', targetText: '0', target: 0 });
  });

  it('reads a suppressed zero as Suppressed in value, percentage, narrative and the row', () => {
    const model = buildBarModel(data, { suppressed: true, total: 20 });
    expect(model.rows[0]).toMatchObject({ status: 'suppressed', value: null, valueText: 'Suppressed', percentage: null, percentageText: 'Suppressed', barRatio: 0 });
    expect(model.rows[0]!.narrative).toBe('Zero group: value suppressed.');
    expect(model.rows[1]).toMatchObject({ status: 'reported', value: 10, percentage: 0.5 });
  });

  it('shows a non-zero provided total under the flag and computes percentages from it', () => {
    const model = buildBarModel(data, { suppressed: true, total: 20 });
    expect(model.total).toBe(20);
    expect(model.totalText).toBe('20');
    expect(model.rows[1]!.percentageText).toBe('50.00%');
  });

  it('reads Suppressed for a provided zero total under the flag and never divides by it', () => {
    const model = buildBarModel(data, { suppressed: true, total: 0 });
    expect(model.total).toBeNull();
    expect(model.totalText).toBe('Suppressed');
    expect(model.rows[1]).toMatchObject({ status: 'reported', percentage: null, percentageText: 'Unavailable' });
    expect(model.warnings.join(' ')).not.toContain('exceeds the supplied total');
  });

  it('shows Suppressed as the total with no provided total when a zero is suppressed', () => {
    const model = buildBarModel(data, { suppressed: true });
    expect(model.total).toBeNull();
    expect(model.totalText).toBe('Suppressed');
  });

  it('infers the total under the flag when no zero row is suppressed and inference is on', () => {
    const model = buildBarModel([{ id: 'a', label: 'A', value: 4 }, { id: 'b', label: 'B', value: 6 }], { suppressed: true });
    expect(model.total).toBe(10);
    expect(model.totalText).toBe('10');
    expect(model.indicators).toContain('Suppressed');
  });

  it('keeps the Suppressed indicator whenever the flag is on, even with no zeros', () => {
    expect(buildBarModel([{ id: 'a', label: 'A', value: 4 }], { suppressed: true }).indicators).toEqual(['Suppressed']);
    expect(buildBarModel([{ id: 'a', label: 'A', value: 4 }]).indicators).toEqual([]);
  });

  it('never leaks the raw zero into the CSV export while the flag is on', () => {
    const model = buildBarModel(data, { suppressed: true, total: 20 });
    const csv = buildBarCsv(model, { suppressed: true });
    expect(csv).toContain('Zero group,Suppressed,Suppressed');
    expect(csv).toContain('Some values are suppressed to protect privacy.');
    expect(csv.split('\r\n').filter((line) => line.startsWith('Zero group'))).toEqual(['Zero group,Suppressed,Suppressed']);
  });

  it('keeps raw zeros and no suppression note in the CSV when the flag is off', () => {
    const model = buildBarModel(data, { total: 20 });
    const csv = buildBarCsv(model);
    expect(csv).toContain('Zero group,0,0.00%');
    expect(csv).not.toContain('Some values are suppressed');
  });

  it('renders the zero row without a bar and shows the note above the table only under the flag', async () => {
    const off = await makeChart({ suppressed: false, total: 20 } as Partial<A11yBarChartElement>);
    expect(rowCells(off)[0]).toEqual(['Zero group', '0', '0.00%']);
    expect(off.querySelector('.a11y-bar-chart__suppression-note')).toBeNull();
    expect(off.querySelector('.a11y-bar-chart__indicator')).toBeNull();

    const on = await makeChart({ suppressed: true, total: 20 } as Partial<A11yBarChartElement>);
    expect(rowCells(on)[0]).toEqual(['Zero group', 'Suppressed', 'Suppressed']);
    const note = on.querySelector('.a11y-bar-chart__suppression-note');
    expect(note?.textContent).toBe('Some values are suppressed to protect privacy.');
    expect(note?.nextElementSibling?.classList.contains('a11y-bar-chart__table-wrap')).toBe(true);
    expect(on.querySelector('.a11y-bar-chart__indicator')?.textContent).toBe('Suppressed');
    expect(on.querySelector('.a11y-bar-chart__bar')).toBeTruthy();
    expect(on.querySelectorAll('.a11y-bar-chart__table')[0]!.textContent).not.toMatch(/Zero group\s*0/);
  });

  it('puts the note above the table in the dialog view too', async () => {
    const chart = await makeChart({ suppressed: true, total: 20 } as Partial<A11yBarChartElement>, 'dialog');
    const dialog = chart.querySelector('dialog')!;
    const note = dialog.querySelector('.a11y-bar-chart__suppression-note');
    expect(note).toBeTruthy();
    expect(note!.nextElementSibling?.classList.contains('a11y-bar-chart__table-wrap')).toBe(true);
    expect(rowCells(dialog)[0]).toEqual(['Zero group', 'Suppressed', 'Suppressed']);
    expect(dialog.textContent).not.toMatch(/Zero group\s*0/);
  });

  it('redacts the raw zero from the data getter and change event only while the flag is on', async () => {
    const chart = await makeChart({ suppressed: true, total: 20 } as Partial<A11yBarChartElement>);
    expect(chart.data[0]).toMatchObject({ id: 'zero', value: null });
    expect(chart.data[1]).toMatchObject({ id: 'shown', value: 10 });
    const events: A11yBarChartDataChangeDetail[] = [];
    chart.addEventListener('a11y-bar-chart-data-change', (event) => events.push((event as CustomEvent<A11yBarChartDataChangeDetail>).detail));
    chart.data = [{ id: 'zero', label: 'Zero group', value: 0 }, { id: 'shown', label: 'Shown group', value: 3 }];
    await flush();
    expect(events).toHaveLength(1);
    const serialized = JSON.stringify(events[0]);
    expect(serialized).not.toMatch(/"value":0[,}]/);
    expect(events[0]!.data[0]).toMatchObject({ value: null });
    expect(events[0]!.model!.rows[0]).toMatchObject({ status: 'suppressed', value: null, valueText: 'Suppressed' });
  });

  it('keeps the raw zero in the data getter when the flag is off', async () => {
    const chart = await makeChart({ suppressed: false } as Partial<A11yBarChartElement>);
    expect(chart.data[0]).toMatchObject({ id: 'zero', value: 0 });
  });

  it('keeps null as Not reported under the flag and never as a suppressed zero', async () => {
    const chart = await makeChart({ suppressed: true, total: 20 } as Partial<A11yBarChartElement>);
    expect(rowCells(chart)[2]).toEqual(['Missing group', 'Not reported', 'Unavailable']);
    expect(chart.querySelector('.a11y-bar-chart__status')?.textContent).toBe('Suppressed');
  });

  it('shows the note in the CSV metadata only when the flag is on', async () => {
    const chart = await makeChart({ suppressed: true, total: 20 } as Partial<A11yBarChartElement>);
    const model = buildBarModel(data, { suppressed: true, total: 20 });
    expect(buildBarCsv(model, { suppressed: true })).toMatch(/^.*Data note.*Some values are suppressed/);
    expect(chart.querySelector('.a11y-bar-chart__suppression-note')).toBeTruthy();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  A11ySegmentedBarChartElement,
  buildSegmentedBarCsv,
  buildSegmentedBarModel,
  defineA11ySegmentedBarChart,
  type A11ySegmentedBarChartDatum,
} from '../src/index.js';

defineA11ySegmentedBarChart();
afterEach(() => document.body.replaceChildren());
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
const row = (value: number | null, id = 'a', label = id.toUpperCase()): A11ySegmentedBarChartDatum => ({ id, label, value });

describe('single suppression flag: model rules', () => {
  it('rule 2: only a zero is suppressed, and only when the flag is on; null is always missing', () => {
    const flagOn = buildSegmentedBarModel([row(0), row(null, 'b')], { suppressed: true });
    expect(flagOn.rows.map(r => r.status)).toEqual(['suppressed', 'missing']);
    expect(flagOn.rows[1]!.valueText).toBe('Not reported');
    const flagOff = buildSegmentedBarModel([row(0), row(null, 'b')], { suppressed: false });
    expect(flagOff.rows.map(r => r.status)).toEqual(['reported', 'missing']);
    expect(flagOff.rows[1]!.valueText).toBe('Not reported');
  });

  it('rule 3 (flag on): a zero stays listed with no value, Suppressed text, and no raw 0 reaches formatValue', () => {
    const formatValue = vi.fn(({ value }: { value: number }) => `V${value}`);
    const model = buildSegmentedBarModel([row(0), row(50, 'b')], { suppressed: true, total: 100, formatValue });
    expect(model.rows[0]).toMatchObject({ id: 'a', value: null, status: 'suppressed', valueText: 'Suppressed', percentage: null, percentageText: 'Suppressed' });
    expect(model.rows[1]).toMatchObject({ status: 'reported', value: 50, percentage: 0.5 });
    expect(formatValue.mock.calls.some(([context]) => context.value === 0)).toBe(false);
    expect(model.summary).toContain('A: Suppressed');
  });

  it('rule 3 (flag on): the CSV and table text never contain the raw zero', () => {
    const model = buildSegmentedBarModel([row(0), row(50, 'b')], { suppressed: true, total: 100 });
    const csv = buildSegmentedBarCsv(model);
    expect(csv).toContain('A,Suppressed,Suppressed');
    expect(csv).not.toMatch(/\bA,0\b/);
  });

  it('rule 3 (flag off): a zero is a real zero with reported status and is never hidden', () => {
    const model = buildSegmentedBarModel([row(0), row(100, 'b')], { total: 100 });
    expect(model.rows[0]).toMatchObject({ value: 0, status: 'reported', valueText: '0', percentage: 0, percentageText: '0.00%' });
    expect(model.rows).toHaveLength(2);
    expect(buildSegmentedBarCsv(model)).toContain('A,0,0.00%');
  });

  it('rule 5: a host-provided non-zero total is shown under the flag and percentages come from it', () => {
    const model = buildSegmentedBarModel([row(0), row(25, 'b')], { suppressed: true, total: 100 });
    expect(model.total).toBe(100);
    expect(model.totalText).toBe('100');
    expect(model.rows[1]!.percentageText).toBe('25.00%');
    expect(model.rows[0]!.percentageText).toBe('Suppressed');
    expect(model.warning).toContain('missing or suppressed');
    expect(model.rows.every(r => r.ratio === 0)).toBe(true);
  });

  it('rule 5: a host-provided zero total reads Suppressed and is not exposed as a number', () => {
    const model = buildSegmentedBarModel([row(0), row(0, 'b')], { suppressed: true, total: 0 });
    expect(model.total).toBeNull();
    expect(model.totalText).toBe('Suppressed');
    expect(model.warning).not.toContain('total is zero');
    expect(JSON.stringify(model)).not.toMatch(/"total":0\b/);
    expect(model.rows.map(r => r.percentageText)).toEqual(['Suppressed', 'Suppressed']);
    expect(buildSegmentedBarCsv(model)).toContain('Total,Suppressed,');
  });

  it('rule 5: no provided total with a suppressed row infers nothing and keeps incomplete messaging', () => {
    const model = buildSegmentedBarModel([row(0), row(40, 'b')], { suppressed: true });
    expect(model.total).toBeNull();
    expect(model.totalText).toBe('Unavailable');
    expect(model.warning).toContain('missing or suppressed');
    expect(model.rows[1]!.percentageText).toBe('Unavailable');
  });

  it('rule 5: flag on with no zero rows infers the total normally', () => {
    const model = buildSegmentedBarModel([row(3), row(7, 'b')], { suppressed: true });
    expect(model.total).toBe(10);
    expect(model.totalText).toBe('10');
    expect(model.rows[0]!.percentageText).toBe('30.00%');
    expect(model.warning).toBeNull();
  });
});

describe('single suppression flag: element rules', () => {
  function chart(extra: Partial<A11ySegmentedBarChartElement> = {}) {
    const el = new A11ySegmentedBarChartElement();
    el.chartTitle = 'Requests';
    el.data = [row(0, 'a', 'Protected'), row(60, 'b', 'Open'), row(40, 'c', 'Closed')];
    el.total = 100;
    Object.assign(el, extra);
    return el;
  }

  it('rule 3 (flag on): legend, table and summary read Suppressed and the zero is absent from the table', async () => {
    const el = chart({ suppressed: true, config: { dataView: 'inline', showDetails: true } } as Partial<A11ySegmentedBarChartElement>);
    document.body.append(el); await settle();
    const legend = el.querySelector('.a11y-segmented-bar-chart__legend')!.textContent;
    expect(legend).toContain('Protected: Suppressed');
    const cells = Array.from(el.querySelectorAll('table tbody td')).map(td => td.textContent);
    expect(cells).toContain('Suppressed');
    expect(cells).not.toContain('0');
    expect(el.querySelector('.a11y-segmented-bar-chart__summary')?.textContent).toContain('Protected: Suppressed');
  });

  it('rule 3 (flag off): a zero renders as 0 in the legend and table', async () => {
    const el = chart({ config: { dataView: 'inline' } } as Partial<A11ySegmentedBarChartElement>);
    document.body.append(el); await settle();
    expect(el.querySelector('.a11y-segmented-bar-chart__legend')!.textContent).toContain('Protected: 0');
    const cells = Array.from(el.querySelectorAll('table tbody td')).map(td => td.textContent);
    expect(cells).toContain('0');
    expect(cells).not.toContain('Suppressed');
  });

  it('rule 3 (flag on): the data-change event carries null value and suppressed status with no raw zero', async () => {
    const el = chart({ suppressed: true, config: { dataView: 'inline' } } as Partial<A11ySegmentedBarChartElement>);
    document.body.append(el); await settle();
    const changed = vi.fn();
    el.addEventListener('a11y-segmented-bar-chart-data-change', changed);
    el.data = [row(0, 'a', 'Protected'), row(61, 'b', 'Open'), row(39, 'c', 'Closed')]; await settle();
    expect(changed).toHaveBeenCalledTimes(1);
    const detail = (changed.mock.calls[0]![0] as CustomEvent).detail as { data: A11ySegmentedBarChartDatum[]; model: { rows: Array<{ id: string; value: number | null; status: string }> } };
    expect(detail.data[0]!.value).toBeNull();
    expect(detail.model.rows.find(r => r.id === 'a')).toMatchObject({ value: null, status: 'suppressed' });
    expect(JSON.stringify(detail)).not.toMatch(/"value":0\b/);
  });

  it('rule 6: the suppression note appears above the table in the inline view only when the flag is on', async () => {
    const on = chart({ suppressed: true, config: { dataView: 'inline' } } as Partial<A11ySegmentedBarChartElement>);
    document.body.append(on); await settle();
    const note = on.querySelector('.a11y-segmented-bar-chart__suppression-note');
    expect(note?.tagName).toBe('P');
    expect(note?.textContent).toBe('Some values are suppressed to protect privacy.');
    expect(note?.nextElementSibling?.tagName).toBe('TABLE');
    on.remove();
    const off = chart({ config: { dataView: 'inline' } } as Partial<A11ySegmentedBarChartElement>);
    document.body.append(off); await settle();
    expect(off.querySelector('.a11y-segmented-bar-chart__suppression-note')).toBeNull();
  });

  it('rule 6: the suppression note is rendered in the dialog data view and is overridable through messages', async () => {
    const el = chart({ suppressed: true, messages: { suppressionNote: 'Values hidden for privacy.' } } as Partial<A11ySegmentedBarChartElement>);
    document.body.append(el); await settle();
    const dialogNote = el.querySelector('dialog .a11y-segmented-bar-chart__suppression-note');
    expect(dialogNote?.textContent).toBe('Values hidden for privacy.');
    expect(dialogNote?.nextElementSibling?.tagName).toBe('TABLE');
  });

  it('shows the Suppressed indicator next to the title whenever the flag is on, even with no zeros', async () => {
    const el = chart({ suppressed: true });
    el.data = [row(30, 'a', 'Open'), row(70, 'b', 'Closed')];
    document.body.append(el); await settle();
    const indicator = Array.from(el.querySelectorAll('p')).find(p => p.textContent === 'Suppressed');
    expect(indicator).toBeDefined();
    expect(el.querySelector('.a11y-segmented-bar-chart__suppression-note')).not.toBeNull();
  });

  it('rule 2 (element): a null value stays Not reported with the flag on', async () => {
    const el = chart({ suppressed: true, config: { dataView: 'inline' } } as Partial<A11ySegmentedBarChartElement>);
    el.data = [row(null, 'a', 'Missing'), row(100, 'b', 'Open')];
    document.body.append(el); await settle();
    expect(el.querySelector('.a11y-segmented-bar-chart__legend')!.textContent).toContain('Missing: Not reported');
    expect(el.data[0]!.value).toBeNull();
  });
});

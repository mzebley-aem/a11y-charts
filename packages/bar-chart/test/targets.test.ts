import { beforeEach, describe, expect, it, vi } from 'vitest';
import { A11yBarChartElement, buildBarCsv, buildBarModel, defineA11yBarChart, validateBarData } from '../src/index.js';
import type { A11yBarChartDataChangeDetail, A11yBarChartDatum } from '../src/index.js';
import { BAR_DEMO_MESSAGES } from '../demo/locales.js';

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const datum = (value: number | null, target?: A11yBarChartDatum['target']): A11yBarChartDatum => ({ id: 'a', label: 'Alpha', value, ...(target !== undefined ? { target } : {}) });

function makeChart(data: A11yBarChartDatum[]): A11yBarChartElement {
  defineA11yBarChart();
  const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
  chart.data = data;
  document.body.append(chart);
  return chart;
}

beforeEach(() => { document.body.replaceChildren(); });

describe('bar target contract', () => {
  it('validates numbers and inclusive intervals, including zero and coincident bounds', () => {
    for (const target of [undefined, null, 0, 10, { min: 0, max: 0 }, { min: 4, max: 9 }]) {
      expect(validateBarData([datum(5, target)]).valid).toBe(true);
    }
    for (const target of [-1, NaN, Infinity, '5', [], {}, { min: 9, max: 4 }, { min: -1, max: 9 }, { min: 2, max: Infinity }, { min: 2, max: null }]) {
      expect(validateBarData([{ ...datum(5), target }])).toMatchObject({ valid: false, code: 'validationInvalidTarget', params: { id: 'a' } });
    }
    expect(validateBarData([{ ...datum(5), targetSuppressed: 'true' }])).toMatchObject({ valid: false, code: 'validationInvalidTarget' });
  });

  it('includes target bounds in largest scaling without adding them to the population', () => {
    const input = [datum(5, { min: 8, max: 10 }), { id: 'b', label: 'Beta', value: 3 }];
    const snapshot = structuredClone(input);
    const model = buildBarModel(input);
    expect(model.total).toBe(8);
    expect(model.rows[0]).toMatchObject({ barRatio: 0.5, percentage: 5 / 8, targetStartRatio: 0.8, targetEndRatio: 1, targetText: '8 to 10' });
    expect(model.rows[1]!.barRatio).toBe(0.3);
    expect(input).toEqual(snapshot);
    (model.rows[0]!.target as { min: number }).min = 99;
    expect(input).toEqual(snapshot);
  });

  it.each([
    [4, { min: 5, max: 10 }, 'below'], [5, { min: 5, max: 10 }, 'within'],
    [10, { min: 5, max: 10 }, 'within'], [11, { min: 5, max: 10 }, 'above'],
    [5, 5, 'equal'], [4, 5, 'below'], [6, 5, 'above'], [null, 5, 'incomplete']
  ] as const)('compares %s with %j as %s', (value, target, relation) => {
    const model = buildBarModel([datum(value, target)]);
    expect(model.rows[0]!.targetRelation).toBe(relation);
    expect(model.explanation.join(' ')).toContain(model.rows[0]!.targetNarrative);
    expect(model.summary).toContain(model.rows[0]!.targetNarrative);
    expect(model.rows[0]!.targetNarrative).not.toMatch(/met|success|fail/i);
  });

  it('positions zero at the origin and warns about clipped or unavailable population scales', () => {
    expect(buildBarModel([datum(0, 0)]).rows[0]).toMatchObject({ targetStartRatio: 0, targetEndRatio: 0, targetRelation: 'equal' });
    const clipped = buildBarModel([datum(5, { min: 8, max: 12 })], { total: 10, config: { scaleMode: 'population-share' } });
    expect(clipped.rows[0]).toMatchObject({ barRatio: 0.5, targetStartRatio: 0.8, targetEndRatio: 1, targetText: '8 to 12' });
    expect(clipped.warnings.join(' ')).toContain('target for Alpha exceeds');
    const missing = buildBarModel([datum(null, 5)], { config: { scaleMode: 'population-share' } });
    expect(missing.rows[0]).toMatchObject({ targetStartRatio: null, targetEndRatio: null, targetText: '5' });
    expect(missing.warnings.join(' ')).toContain('without a positive total');
    const extreme = buildBarModel([datum(1, Number.MAX_VALUE)], { total: Number.MIN_VALUE, config: { scaleMode: 'population-share' } });
    expect(extreme.rows[0]!.targetEndRatio).toBe(1);
  });

  it('protects targets separately from zero-count suppression in every semantic output', () => {
    const validated = validateBarData([{ ...datum(0, { min: 9876, max: 9999 }), targetSuppressed: true }]);
    expect(validated.valid).toBe(true);
    if (!validated.valid) return;
    expect(validated.data[0]!.target).toBeNull();
    const formatter = vi.fn(({ value }) => String(value));
    const model = buildBarModel(validated.data, { suppressed: true, formatValue: formatter });
    expect(model.rows[0]).toMatchObject({ target: null, targetSuppressed: true, targetText: 'Suppressed', targetRelation: 'incomplete', targetStartRatio: null });
    expect(JSON.stringify(model) + buildBarCsv(model)).not.toMatch(/9876|9999/);
    expect(formatter).not.toHaveBeenCalled();
    const visibleZero = buildBarModel([datum(0, 0)], { total: 1, suppressed: true });
    expect(visibleZero.rows[0]).toMatchObject({ status: 'suppressed', targetText: '0', targetRelation: 'incomplete' });
  });

  it('formats both bounds using the target context and localizes templates and CSV', () => {
    const model = buildBarModel([datum(5, { min: 4.5, max: 8.5 }), { id: 'b', label: 'Beta', value: 2 }], {
      config: { locale: 'fr-FR', countDecimals: 1 }, messages: BAR_DEMO_MESSAGES['fr-FR'],
      formatValue: ({ value, series }) => series === 'target' ? `${value} unités` : ''
    });
    expect(model.rows[0]!.targetText).toBe('4.5 unités à 8.5 unités');
    expect(model.rows[0]!.targetNarrative).toContain('plage cible');
    const csv = buildBarCsv(model, { messages: BAR_DEMO_MESSAGES['fr-FR'], locale: 'fr-FR' });
    expect(csv.split('\r\n')[0]).toContain(',Cible');
    expect(csv).toContain('4.5 unités à 8.5 unités');
    expect(csv).toContain('Non définie');
    expect(buildBarCsv(buildBarModel([datum(5)]))).not.toContain('Target');
  });
});

describe('rendered targets and live updates', () => {
  it('renders decorative range bands and visible comparison text with a complete target column', async () => {
    const chart = makeChart([datum(5, { min: 4, max: 8 })]);
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__target')?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(chart.querySelector('.a11y-bar-chart__target-text')?.textContent).toBe('Alpha is within the target range (4 to 8).');
    expect(chart.querySelector('thead')?.textContent).toContain('Target');
    expect(chart.querySelector('tbody')?.textContent).toContain('4 to 8');
    chart.config = { showCounts: false, showPercentages: false };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__target-text')?.textContent).toContain('4 to 8');
  });

  it('deep-copies input, getters, and event payloads and preserves modal focus when only the target changes', async () => {
    const input = [datum(5, { min: 4, max: 8 })];
    const chart = makeChart(input);
    await flush();
    (input[0]!.target as { min: number }).min = 999;
    (chart.data[0]!.target as { min: number }).min = 888;
    expect(chart.data[0]!.target).toEqual({ min: 4, max: 8 });
    const dialog = chart.querySelector('dialog')!;
    vi.spyOn(dialog, 'showModal').mockImplementation(() => dialog.setAttribute('open', ''));
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    const close = chart.querySelector<HTMLButtonElement>('.a11y-bar-chart__dialog-close')!;
    close.focus();
    const changed = vi.fn((event: Event) => {
      const detail = (event as CustomEvent<A11yBarChartDataChangeDetail>).detail;
      (detail.data[0]!.target as { min: number }).min = 777;
      (detail.model!.rows[0]!.target as { min: number }).min = 666;
    });
    chart.addEventListener('a11y-bar-chart-data-change', changed);
    chart.data = [datum(5, { min: 6, max: 10 })];
    await flush();
    expect(changed).toHaveBeenCalledOnce();
    expect(chart.data[0]!.target).toEqual({ min: 6, max: 10 });
    expect(dialog.open).toBe(true);
    expect(chart.querySelector('dialog')).toBe(dialog);
    expect(document.activeElement).toBe(close);
    expect(dialog.textContent).toContain('6 to 10');
    expect(chart.querySelector('.a11y-bar-chart__target-text')?.textContent).toContain('below');
    expect(chart.querySelector('[aria-live]')?.textContent).toContain('Chart data updated');
    chart.removeEventListener('a11y-bar-chart-data-change', changed);
    chart.data = [datum(5)];
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__target')).toBeNull();
    expect(dialog.querySelector('thead')?.textContent).not.toContain('Target');
  });

  it('localizes target validation and removes stale markers on invalid input', async () => {
    const chart = makeChart([datum(5, 7)]);
    chart.messages = { validationInvalidTarget: 'Corriger la cible de {id}.' };
    await flush();
    chart.data = [datum(5, { min: 8, max: 3 })];
    await flush();
    expect(chart.querySelector('[role="alert"]')?.textContent).toBe('Corriger la cible de a.');
    expect(chart.querySelector('.a11y-bar-chart__target')).toBeNull();
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { A11yBarChartElement, buildBarModel, defineA11yBarChart, resolveConfig, themeToCssVariables } from '../src/index.js';
import type { A11yBarChartConfig, A11yBarChartDatum, A11yBarChartTargetStyle } from '../src/index.js';

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const sample: A11yBarChartDatum[] = [
  { id: 'met', label: 'Met', value: 3, target: { min: 2, max: 4 } },
  { id: 'miss', label: 'Missed', value: 5, target: { min: 2, max: 4 } },
  { id: 'plain', label: 'No target', value: 2 },
  { id: 'missing', label: 'Missing', value: null, target: 2 },
  { id: 'zero-target', label: 'Zero with target', value: 0, target: 2 },
  { id: 'suppressed', label: 'Suppressed', value: 0, target: { min: 0, max: 2 } }
];

async function makeChart(config: A11yBarChartConfig = {}) {
  defineA11yBarChart();
  const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
  chart.config = config;
  chart.data = sample;
  chart.suppressed = true;
  chart.total = 20;
  document.body.append(chart);
  await flush();
  return chart;
}

beforeEach(() => document.body.replaceChildren());

describe('target outcome encoding', () => {
  it.each([
    ['above', 1, 'not-met'], ['above', 2, 'met'], ['above', 3, 'met'],
    ['below', 1, 'met'], ['below', 2, 'met'], ['below', 3, 'not-met']
  ] as const)('uses numeric direction %s for value %s: %s', (positiveDirection, value, expected) => {
    const row = buildBarModel([{ id: 'a', label: 'Alpha', value, target: 2 }], { config: { positiveDirection } }).rows[0]!;
    expect(row.targetOutcome).toBe(expected);
    expect(row.targetOutcomeLabel).toBe(expected === 'met' ? 'Target met' : 'Target not met');
    expect(row.narrative).toContain(`${row.targetOutcomeLabel}.`);
  });

  it.each(['above', 'below'] as const)('retains inclusive range logic regardless of numeric direction %s', (positiveDirection) => {
    const rows = buildBarModel([1.99, 2, 3, 4, 4.01].map((value, index) => ({ id: String(index), label: String(index), value, target: { min: 2, max: 4 } })), { config: { positiveDirection } }).rows;
    expect(rows.map(row => row.targetOutcome)).toEqual(['not-met', 'met', 'met', 'met', 'not-met']);
  });

  it.each(['none', 'color', 'texture', 'color-and-texture'] as const)('applies %s only to comparable target bars', async (targetStyle: A11yBarChartTargetStyle) => {
    const chart = await makeChart({ targetStyle, showDetails: true });
    const bars = [...chart.querySelectorAll<HTMLElement>('.a11y-bar-chart__bar')];
    const color = targetStyle === 'color' || targetStyle === 'color-and-texture';
    const texture = targetStyle === 'texture' || targetStyle === 'color-and-texture';
    for (const [index, state] of ['positive', 'negative'].entries()) {
      expect(bars[index]!.classList.contains(`a11y-bar-chart__bar--${state}-color`)).toBe(color);
      expect(bars[index]!.classList.contains(`a11y-bar-chart__bar--${state}-texture`)).toBe(texture);
    }
    for (const bar of bars.slice(2)) expect(bar.className).toBe('a11y-bar-chart__bar');
    const cards = chart.querySelectorAll('.a11y-bar-chart__details');
    expect(cards[0]!.querySelector('.a11y-bar-chart__details-outcome')?.textContent).toBe('Target met');
    expect(cards[1]!.querySelector('.a11y-bar-chart__details-outcome')?.textContent).toBe('Target not met');
    for (const card of [...cards].slice(2)) expect(card.querySelector('.a11y-bar-chart__details-outcome')).toBeNull();
  });

  it('keeps explicit outcome text when cards and numeric annotations are off', async () => {
    const chart = await makeChart({ targetStyle: 'color', showDetails: false, showCounts: false, showPercentages: false });
    const labels = chart.querySelectorAll('.a11y-bar-chart__outcome-label');
    expect([...labels].map(label => label.textContent)).toEqual(['Target met', 'Target not met']);
    expect(labels[0]!.closest('[aria-hidden="true"]')).toBeNull();
    expect(chart.querySelector('.a11y-bar-chart__details-trigger')).toBeNull();
  });

  it('updates colors, textures, numeric card outcomes, and stable focus together', async () => {
    const chart = await makeChart({ targetStyle: 'color-and-texture', showDetails: true });
    chart.data = [{ id: 'met', label: 'Numeric', value: 3, target: 2 }];
    await flush();
    chart.querySelector<HTMLButtonElement>('.a11y-bar-chart__details-trigger')!.focus();
    chart.config = { ...chart.config, positiveDirection: 'below' };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__bar--negative-texture')).toBeTruthy();
    expect(chart.querySelector('.a11y-bar-chart__details-outcome')?.textContent).toBe('Target not met');
    const activeTrigger = document.activeElement as HTMLButtonElement;
    const accessibleName = activeTrigger.getAttribute('aria-labelledby')?.split(/\s+/)
      .map(id => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(accessibleName).toContain('Target not met');
    chart.config = { ...chart.config, targetStyle: 'none' };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__bar')?.className).toBe('a11y-bar-chart__bar');
    expect(document.activeElement).toBe(chart.querySelector('.a11y-bar-chart__details-trigger'));
  });

  it('keeps base and outcome themes independent and removes replaced overrides', async () => {
    const theme = Object.freeze({ color: '#123456', positiveColor: '#005500', negativeColor: '#990000', patternType: 'horizontal', positivePatternType: 'dots', negativePatternType: 'diagonal', positivePatternColor: '#fff', negativePatternColor: '#ffe566' } as const);
    const variables = themeToCssVariables(theme);
    expect(variables['--a11y-bar-chart-color']).toBe('#123456');
    expect(variables['--a11y-bar-chart-positive-color']).toBe('#005500');
    expect(variables['--a11y-bar-chart-negative-color']).toBe('#990000');
    expect(variables['--a11y-bar-chart-positive-pattern-image']).toContain('radial-gradient');
    expect(variables['--a11y-bar-chart-negative-pattern-image']).toContain('135deg');
    expect(variables['--a11y-bar-chart-pattern-image']).toContain('0deg');
    const chart = await makeChart({ targetStyle: 'color-and-texture' });
    chart.theme = theme;
    await flush();
    const root = chart.querySelector<HTMLElement>('.a11y-bar-chart__root')!;
    expect(root.style.getPropertyValue('--a11y-bar-chart-positive-pattern-color')).toBe('#fff');
    chart.theme = {};
    await flush();
    expect(root.style.getPropertyValue('--a11y-bar-chart-positive-pattern-color')).toBe('');
    expect(root.style.getPropertyValue('--a11y-bar-chart-negative-color')).toBe('');
  });

  it('falls back safely for invalid runtime options and unnamed patterns', () => {
    expect(resolveConfig({ targetStyle: 'invalid' as never, positiveDirection: 'sideways' as never })).toMatchObject({ targetStyle: 'none', positiveDirection: 'above' });
    expect(themeToCssVariables({ positivePatternType: 'url(unsafe)' as never })).toEqual({ '--a11y-bar-chart-positive-pattern-image': 'none', '--a11y-bar-chart-positive-pattern-size': 'auto' });
    expect(themeToCssVariables({ negativePatternType: 'none' })).toEqual({ '--a11y-bar-chart-negative-pattern-image': 'none', '--a11y-bar-chart-negative-pattern-size': 'auto' });
  });
});

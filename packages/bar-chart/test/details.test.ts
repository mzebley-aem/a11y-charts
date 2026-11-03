import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { A11yBarChartElement, defineA11yBarChart } from '../src/index.js';
import { BAR_DEMO_MESSAGES } from '../demo/locales.js';

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const trigger = (chart: A11yBarChartElement, index = 0) => chart.querySelectorAll<HTMLButtonElement>('.a11y-bar-chart__details-trigger')[index]!;
const card = (chart: A11yBarChartElement, index = 0) => chart.querySelectorAll<HTMLElement>('.a11y-bar-chart__details')[index]!;
const readingName = (button: HTMLButtonElement) => button.getAttribute('aria-labelledby')?.split(/\s+/)
  .map((id) => document.getElementById(id)?.textContent ?? '').join(' ') ?? '';
const enter = (element: HTMLElement, pointerType = 'mouse') => element.dispatchEvent(new PointerEvent('pointerenter', { pointerType }));
const leave = (element: HTMLElement) => element.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));

async function makeChart() {
  defineA11yBarChart();
  const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
  chart.config = { showDetails: true };
  chart.total = 10;
  chart.data = [
    { id: 'alpha', label: 'Alpha', value: 3, target: { min: 2, max: 4 } },
    { id: 'beta', label: 'Beta', value: 1 }
  ];
  document.body.append(chart);
  await flush();
  return chart;
}

describe('experimental category cards', () => {
  beforeEach(() => { vi.useFakeTimers(); document.body.replaceChildren(); });
  afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });

  it.each([
    [1.99, 2, 4, 'not-met'],
    [2, 2, 4, 'met'],
    [3, 2, 4, 'met'],
    [4, 2, 4, 'met'],
    [4.01, 2, 4, 'not-met'],
    [0, 0, 0, 'met'],
    [1, 0, 0, 'not-met']
  ] as const)('shows the line-chart range outcome for %s in [%s, %s]: %s', async (value, min, max, outcome) => {
    const chart = await makeChart();
    // Default count formatting rounds 1.99 to 2 and 4.01 to 4; compare raw values.
    chart.data = [{ id: 'alpha', label: 'Alpha', value, target: { min, max } }];
    await flush();
    trigger(chart).focus();
    const text = outcome === 'met' ? 'Target met' : 'Target not met';
    const badge = card(chart).querySelector('.a11y-bar-chart__details-outcome')!;
    expect(badge.textContent).toBe(text);
    expect(badge.classList.contains(`a11y-bar-chart__details-outcome--${outcome}`)).toBe(true);
    expect(badge.getAttribute('aria-hidden')).not.toBe('true');
    expect(readingName(trigger(chart))).toContain(text);
  });

  it('does not assign pass/fail to missing, suppressed, or absent targets', async () => {
    const chart = await makeChart();
    chart.suppressed = true;
    chart.data = [
      { id: 'missing', label: 'Missing', value: null, target: { min: 2, max: 4 } },
      { id: 'masked', label: 'Masked', value: 0, target: { min: 0, max: 4 } },
      { id: 'protected', label: 'Protected', value: 3, target: { min: 2, max: 4 }, targetSuppressed: true },
      { id: 'absent', label: 'Absent', value: 3 }
    ];
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__details-outcome')).toBeNull();
    expect(card(chart).textContent).toContain('comparison unavailable');
  });

  it.each(['fr-FR', 'es-ES'] as const)('localizes outcomes on cards and bar buttons for %s', async (locale) => {
    const chart = await makeChart();
    chart.locale = locale;
    chart.messages = BAR_DEMO_MESSAGES[locale];
    await flush();
    const met = BAR_DEMO_MESSAGES[locale].outcomeMet;
    expect(card(chart).querySelector('.a11y-bar-chart__details-outcome')?.textContent).toBe(met);
    expect(readingName(trigger(chart))).toContain(met);
    chart.data = [{ id: 'alpha', label: 'Alpha', value: 5, target: { min: 2, max: 4 } }];
    await flush();
    const missed = BAR_DEMO_MESSAGES[locale].outcomeNotMet;
    expect(card(chart).querySelector('.a11y-bar-chart__details-outcome')?.textContent).toBe(missed);
    expect(readingName(trigger(chart))).toContain(missed);
  });

  it('is opt-in and leaves the static bars intact when disabled', async () => {
    const chart = await makeChart();
    chart.config = {};
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__details-trigger')).toBeNull();
    expect(chart.querySelectorAll('.a11y-bar-chart__row')).toHaveLength(2);
    expect(chart.querySelector('.a11y-bar-chart__count')?.textContent).toBe('3');
  });

  it('previews on hover, permits entering the card, and has no timeout while reading', async () => {
    const chart = await makeChart();
    const row = chart.querySelector<HTMLElement>('.a11y-bar-chart__row')!;
    enter(row);
    expect(card(chart).hidden).toBe(false);
    expect(card(chart).textContent).toContain('30.00%');
    expect(card(chart).textContent).toContain('within the target range');
    leave(row);
    vi.advanceTimersByTime(100);
    enter(row); // The card is a descendant of the row, including its hover bridge.
    vi.advanceTimersByTime(10000);
    expect(card(chart).hidden).toBe(false);
    leave(row);
    vi.advanceTimersByTime(200);
    expect(card(chart).hidden).toBe(true);
    enter(row);
    expect(card(chart).hidden).toBe(false);
  });

  it('dismisses a mouse preview with Escape without moving focus or reopening on the same hover', async () => {
    const chart = await makeChart();
    const row = chart.querySelector<HTMLElement>('.a11y-bar-chart__row')!;
    enter(row);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(card(chart).hidden).toBe(true);
    expect(document.activeElement).not.toBe(trigger(chart));
    enter(row);
    expect(card(chart).hidden).toBe(true);
    leave(row);
    enter(row);
    expect(card(chart).hidden).toBe(false);
  });

  it('keeps cards out of the Tab sequence and preserves bar focus when dismissed', async () => {
    const chart = await makeChart();
    const button = trigger(chart);
    button.focus();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(readingName(button)).toContain('Alpha Percentage of total: 30.00% Count: 3');
    expect(document.getElementById(button.getAttribute('aria-controls')!)).toBe(card(chart));
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(card(chart).hidden).toBe(true);
    expect(document.activeElement).toBe(button);
    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(card(chart).querySelector('button, a, input, select, textarea, [tabindex]')).toBeNull();
    button.click();
    expect(card(chart).hidden).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('includes a safe definition in the focused category reading and visible card', async () => {
    const chart = await makeChart();
    chart.data = [{
      id: 'alpha', label: 'Alpha', value: 3, target: { min: 2, max: 4 },
      definition: 'A <strong>plain-language</strong> measure with <a href="javascript:alert(1)">unsafe markup</a>.'
    }];
    await flush();
    const button = trigger(chart);
    button.focus();
    const name = readingName(button);
    expect(name).toContain('Alpha Percentage of total: 30.00% Count: 3');
    expect(name).toContain('within the target range');
    expect(name).toContain('Definition for Alpha: A plain-language measure with unsafe markup.');
    expect(name).not.toContain('<strong>');
    expect(name).not.toContain('javascript:');
    expect(card(chart).querySelector('.a11y-bar-chart__details-definition')?.textContent)
      .toBe('Definition for Alpha: A plain-language measure with unsafe markup.');
    expect(card(chart).querySelector('.a11y-bar-chart__details-definition a')).toBeNull();
  });

  it('moves through category buttons with arrows and Home/End while leaving Tab untrapped', async () => {
    const chart = await makeChart();
    const first = trigger(chart, 0);
    const second = trigger(chart, 1);
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(second);
    expect(card(chart, 1).hidden).toBe(false);
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(second);
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(card(chart, 1).hidden).toBe(true);
    expect(document.activeElement).toBe(second);
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(first);
  });


  it('pins on activation, ignores touch hover, and closes on outside pointer interaction', async () => {
    const chart = await makeChart();
    const row = chart.querySelector<HTMLElement>('.a11y-bar-chart__row')!;
    enter(row, 'touch');
    expect(card(chart).hidden).toBe(true);
    trigger(chart).click();
    leave(row);
    vi.advanceTimersByTime(10000);
    expect(card(chart).hidden).toBe(false);
    expect(card(chart).textContent).toContain('Kept open');
    trigger(chart).click();
    expect(card(chart).hidden).toBe(true);
    trigger(chart).click();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(card(chart).hidden).toBe(true);
  });

  it('follows keyboard focus across categories and does not let hover displace it', async () => {
    const chart = await makeChart();
    trigger(chart).focus();
    enter(chart.querySelectorAll<HTMLElement>('.a11y-bar-chart__row')[1]!);
    expect(card(chart).hidden).toBe(false);
    expect(card(chart, 1).hidden).toBe(true);
    trigger(chart).click();
    trigger(chart, 1).focus();
    expect(card(chart).hidden).toBe(true);
    expect(card(chart, 1).hidden).toBe(false);
  });

  it('uses safe semantic text for missing and suppressed values and protected targets', async () => {
    const chart = await makeChart();
    chart.suppressed = true;
    chart.data = [
      { id: 'masked', label: '<img src=x>', value: 0, target: 99, targetSuppressed: true },
      { id: 'missing', label: 'Missing', value: null }
    ];
    await flush();
    expect(card(chart).textContent).toContain('Suppressed');
    expect(card(chart).textContent).not.toContain('99');
    expect(card(chart).querySelector('img')).toBeNull();
    expect(card(chart, 1).textContent).toContain('Not reported');
  });

  it('refreshes focused cards from the new model and cleans up on removal', async () => {
    const chart = await makeChart();
    trigger(chart).focus();
    chart.data = [{ id: 'alpha', label: 'Updated', value: 8 }];
    await flush();
    expect(document.activeElement).toBe(trigger(chart));
    expect(card(chart).hidden).toBe(false);
    expect(card(chart).textContent).toContain('80.00%');
    chart.remove();
    expect(card(chart).hidden).toBe(true);
    document.body.append(chart);
    await flush();
    trigger(chart).click();
    expect(card(chart).hidden).toBe(false);
  });
});

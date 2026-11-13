import { afterEach, describe, expect, it, vi } from 'vitest';
import { A11ySegmentedBarChartElement, defineA11ySegmentedBarChart } from '../src/index.js';

defineA11ySegmentedBarChart();
afterEach(() => document.body.replaceChildren());
const settled = async () => { await Promise.resolve(); };

function chartWithData() {
  const chart = new A11ySegmentedBarChartElement();
  chart.chartTitle = 'Outcomes';
  chart.data = [{ id: 'a', label: 'First', value: 1234, definition: 'First definition' }, { id: 'b', label: 'Second', value: 766 }];
  chart.total = 2000;
  document.body.append(chart);
  return chart;
}

describe('segmented chart accessibility contract', () => {
  it('uses the locale attribute for both visible and tabular values', async () => {
    const chart = chartWithData();
    chart.setAttribute('locale', 'de-DE');
    chart.config = { dataView: 'inline' };
    await settled();
    expect(chart.querySelector('.a11y-segmented-bar-chart__legend')!.textContent).toContain('1.234');
    expect(chart.querySelector('table')!.textContent).toContain('1.234');
  });

  it('names the data dialog and returns focus to its opener', async () => {
    const chart = chartWithData();
    chart.config = { dataView: 'dialog' };
    await settled();
    const root = chart;
    const dialog = root.querySelector('dialog')!;
    const opener = root.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!;
    expect(dialog.getAttribute('aria-label')).not.toBe('showData');
    expect(dialog.getAttribute('aria-label')).toBeTruthy();
    opener.focus();
    opener.click();
    expect(dialog.open).toBe(true);
    dialog.querySelector('button')!.click();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('connects detail controls to cards and supports keyboard dismissal', async () => {
    const chart = chartWithData();
    chart.config = { showDetails: true, showActions: false };
    await settled();
    const root = chart;
    const button = root.querySelector<HTMLButtonElement>('.a11y-segmented-bar-chart__legend button')!;
    const card = root.querySelector<HTMLElement>(`#${button.getAttribute('aria-controls')}`)!;
    button.focus();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(card.hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(card.hidden).toBe(true);
  });

  it('keeps the data dialog open and focus inside it when chart data changes', async () => {
    const chart = chartWithData();
    chart.config = { dataView: 'dialog' };
    await settled();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    chart.data = [{ id: 'a', label: 'First', value: 1234 }, { id: 'b', label: 'Second', value: 766 }];
    await settled();
    const dialog = chart.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
  it('offers a data dialog with a screen-reader table and removes data access and exports when dataView is none', async () => {
    const chart = chartWithData();
    chart.config = { dataView: 'dialog' };
    await settled();
    expect(chart.querySelector('[data-focus-key="data"]')).not.toBeNull();
    expect(chart.querySelector('dialog table')).not.toBeNull();
    chart.config = { dataView: 'none' };
    await settled();
    expect(chart.querySelector('[data-focus-key="data"]')).toBeNull();
    expect([...chart.querySelectorAll('.a11y-segmented-bar-chart__data-tools button')].some(button => /download/i.test(button.textContent ?? ''))).toBe(false);
  });

  it('hides chart actions while keeping inline data exports available', async () => {
    const chart = chartWithData();
    chart.explanation = 'Explanation';
    chart.config = { showActions: false, dataView: 'inline' };
    await settled();
    expect(chart.querySelector('table')).not.toBeNull();
    expect(chart.querySelector('[data-focus-key="explanation"]')).toBeNull();
    expect(chart.querySelector('[data-focus-key="glossary"]')).toBeNull();
    expect([...chart.querySelectorAll('.a11y-segmented-bar-chart__data-tools button')].some(button => /download/i.test(button.textContent ?? ''))).toBe(true);
  });

  it('keeps user disclosure state on unrelated updates and honors explicit expanded config changes', async () => {
    const chart = chartWithData();
    chart.explanation = 'Explanation';
    chart.config = { explanationExpanded: false, glossaryExpanded: false };
    await settled();
    const changes: unknown[] = [];
    chart.addEventListener('a11y-segmented-bar-chart-disclosure-change', event => changes.push((event as CustomEvent).detail));
    chart.querySelector<HTMLButtonElement>('[data-focus-key="explanation"]')!.click();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="glossary"]')!.click();
    expect(changes).toEqual([{ disclosure: 'explanation', expanded: true }, { disclosure: 'glossary', expanded: true }]);
    chart.totalLabel = 'Items';
    await settled();
    expect(chart.querySelector('[data-focus-key="explanation"]')!.getAttribute('aria-expanded')).toBe('true');
    expect(chart.querySelector('[data-focus-key="glossary"]')!.getAttribute('aria-expanded')).toBe('true');
    chart.config = { ...chart.config, explanationExpanded: true, glossaryExpanded: true };
    await settled();
    chart.config = { ...chart.config, explanationExpanded: false, glossaryExpanded: false };
    await settled();
    expect(chart.querySelector('[data-focus-key="explanation"]')!.getAttribute('aria-expanded')).toBe('false');
    expect(chart.querySelector('[data-focus-key="glossary"]')!.getAttribute('aria-expanded')).toBe('false');
  });

  it('preserves the same open dialog and focused close control across updates', async () => {
    const chart = chartWithData();
    chart.config = { dataView: 'dialog' };
    await settled();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    const dialog = chart.querySelector('dialog')!;
    const close = dialog.querySelector('button')!;
    expect(document.activeElement).toBe(close);
    chart.totalLabel = 'Items';
    await settled();
    expect(chart.querySelector('dialog')).toBe(dialog);
    expect(document.activeElement).toBe(close);
    expect(dialog.open).toBe(true);
  });

});

describe('data and segment interactions', () => {
  it('preserves inline disclosure state, emits changes, and resets when hidden', async () => {
    const chart = chartWithData();
    chart.config = { dataView: 'inline', showActions: false };
    await settled();
    const changes: unknown[] = [];
    chart.addEventListener('a11y-segmented-bar-chart-data-view-change', event => changes.push((event as CustomEvent).detail));
    let details = chart.querySelector<HTMLDetailsElement>('details.a11y-segmented-bar-chart__inline-data')!;
    const summary = details.querySelector<HTMLElement>('summary')!;
    summary.focus();
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    expect(changes).toContainEqual({open:true, dataView:'inline'});
    chart.totalLabel = 'Items';
    await settled();
    details = chart.querySelector<HTMLDetailsElement>('details.a11y-segmented-bar-chart__inline-data')!;
    expect(details.open).toBe(true);
    expect(document.activeElement).toBe(details.querySelector('summary'));
    chart.config = { dataView:'none' };
    await settled();
    chart.config = { dataView:'inline' };
    await settled();
    expect(chart.querySelector<HTMLDetailsElement>('details.a11y-segmented-bar-chart__inline-data')!.open).toBe(false);
  });

  it('previews details on segment hover without adding an interactive segment', async () => {
    const chart = chartWithData(); chart.config = {showDetails:true}; await settled();
    const segment = chart.querySelector<HTMLElement>('.a11y-segmented-bar-chart__segment')!;
    const button = chart.querySelector<HTMLButtonElement>('.a11y-segmented-bar-chart__legend button')!;
    segment.dispatchEvent(new PointerEvent('pointerenter', {pointerType:'mouse'}));
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(segment.hasAttribute('tabindex')).toBe(false);
    segment.dispatchEvent(new PointerEvent('pointerleave', {pointerType:'mouse'}));
    expect(button.getAttribute('aria-expanded')).toBe('true');
    await new Promise(resolve => setTimeout(resolve, 220));
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps a segment preview open when the pointer enters its card', async () => {
    const chart = chartWithData(); chart.config = { showDetails: true }; await settled();
    const segment = chart.querySelector<HTMLElement>('.a11y-segmented-bar-chart__segment')!;
    const item = chart.querySelector<HTMLElement>('.a11y-segmented-bar-chart__legend-item')!;
    const button = item.querySelector<HTMLButtonElement>('button')!;
    vi.useFakeTimers();
    try {
      segment.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
      segment.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
      item.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
      vi.advanceTimersByTime(250);
      expect(button.getAttribute('aria-expanded')).toBe('true');
      item.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
      vi.advanceTimersByTime(250);
      expect(button.getAttribute('aria-expanded')).toBe('false');
    } finally { vi.useRealTimers(); }
  });

  it('restores focused export and updates dialog labels after a rerender', async () => {
    const chart = chartWithData(); await settled();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    const dialog = chart.querySelector('dialog')!;
    dialog.querySelector<HTMLButtonElement>('[data-focus-key="export:csv"]')!.focus();
    chart.chartTitle = 'Updated'; chart.messages = {close:'Dismiss'}; await settled();
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(dialog.querySelector('[data-focus-key="export:csv"]'));
    expect(dialog.getAttribute('aria-label')).toContain('Updated');
    expect(dialog.querySelector('.a11y-segmented-bar-chart__close-dialog')?.textContent).toBe('Dismiss');
  });

  it('reports invalid messages and clears the alert after correction', async () => {
    const chart = chartWithData(); await settled();
    const errors: unknown[] = [];
    chart.addEventListener('a11y-segmented-bar-chart-error', event => errors.push((event as CustomEvent).detail));
    chart.setAttribute('messages', '{bad'); await settled();
    expect(errors).toContainEqual(expect.objectContaining({code:'invalid-messages'}));
    expect(chart.querySelector('[role="alert"]')?.textContent).toContain('messages');
    chart.setAttribute('messages', '{}'); await settled();
    expect(chart.querySelector('[role="alert"]')).toBeNull();
  });
});

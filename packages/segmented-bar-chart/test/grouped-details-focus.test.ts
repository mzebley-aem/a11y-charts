import { afterEach, describe, expect, it } from 'vitest';
import { A11ySegmentedBarChartElement, defineA11ySegmentedBarChart } from '../src/index.js';
defineA11ySegmentedBarChart();
afterEach(() => document.body.replaceChildren());
describe('grouped member links', () => {
  it('returns focus to Other when Escape dismisses a focused member link', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.data = [{ id: 'member', label: 'Member', value: 1, definition: '<a href="#more">More information</a>' }];
    chart.config = { showDetails: true, separateCategoryIds: [] };
    document.body.append(chart); await Promise.resolve();
    const trigger = chart.querySelector<HTMLButtonElement>('[data-focus-key="group:other"]')!;
    trigger.focus(); trigger.click();
    chart.querySelector<HTMLAnchorElement>('.a11y-segmented-bar-chart__group-members a')!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });
  it('keeps compact grouped navigation optional without adding detail controls', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.chartTitle = 'Grouped summary';
    chart.data = Array.from({ length: 6 }, (_, index) => ({ id: `r${index}`, label: `Row ${index}`, value: index + 1 }));
    chart.config = { presentation: 'compact', showDetails: false, showActions: false };
    document.body.append(chart); await Promise.resolve();
    expect(chart.querySelector('.a11y-segmented-bar-chart__title a')).toBeNull();
    expect(chart.querySelectorAll('.a11y-segmented-bar-chart__legend > li')).toHaveLength(4);
    expect(chart.querySelector('.a11y-segmented-bar-chart__legend button')).toBeNull();
    chart.href = '#full-report'; await Promise.resolve();
    expect(chart.querySelector('.a11y-segmented-bar-chart__title .a11y-segmented-bar-chart__card-link')?.getAttribute('href')).toBe('#full-report');
    expect(chart.querySelector('.a11y-segmented-bar-chart__legend')?.textContent).toContain('Other categories');
    expect(chart.querySelector('.a11y-segmented-bar-chart__group-members')).toBeNull();
  });

});

import { afterEach, describe, expect, it } from 'vitest';
import { A11ySegmentedBarChartElement, defineA11ySegmentedBarChart } from '../src/index.js';

defineA11ySegmentedBarChart();
afterEach(() => document.body.replaceChildren());
const settled = async () => { await Promise.resolve(); };
const data = [
  { id: 'other', label: 'Source Other', value: 9 },
  { id: 'b', label: 'B', value: 8 },
  { id: 'c', label: 'C', value: 7 },
  { id: 'd', label: 'D', value: 6, definition: '<a href="https://example.com">D definition</a>' },
  { id: 'e', label: 'E', value: 5 },
];
function chart() {
  const el = new A11ySegmentedBarChartElement();
  el.chartTitle = 'Test'; el.data = data; el.config = { showDetails: true, dataView: 'inline' };
  document.body.append(el); return el;
}
describe('grouped display', () => {
  it('keeps source data in the table and shows all members of the localized group', async () => {
    const el = chart(); el.messages = { otherCategories: 'Restantes' }; await settled();
    expect(el.querySelectorAll('.a11y-segmented-bar-chart__legend-item')).toHaveLength(4);
    expect(el.querySelectorAll('.a11y-segmented-bar-chart__inline-data table tbody tr')).toHaveLength(6);
    const button = el.querySelector<HTMLButtonElement>('[data-focus-key="group:other"]')!;
    expect(button.textContent).toContain('Restantes');
    button.click();
    const group = button.parentElement!;
    expect(group.querySelectorAll('.a11y-segmented-bar-chart__group-members li')).toHaveLength(2);
    expect(group.textContent).toContain('D: 6 (17.14%)');
    expect(group.querySelector('.a11y-segmented-bar-chart__group-members a')?.textContent).toBe('D definition');
    expect(el.querySelector('[data-focus-key="row:other"]')?.textContent).toContain('Source Other');
  });
  it('restores focus when a row becomes grouped and when the group disappears', async () => {
    const el = chart(); await settled();
    el.querySelector<HTMLButtonElement>('[data-focus-key="row:other"]')!.focus();
    el.config = { showDetails: true, separateCategoryIds: ['b', 'c', 'd'] }; await settled();
    expect(document.activeElement?.getAttribute('data-focus-key')).toBe('group:other');
    el.config = { showDetails: true, separateCategoryIds: ['other', 'b', 'c'] }; await settled();
    expect(document.activeElement?.getAttribute('data-focus-key')).toBe('group:other');
    el.data = data.slice(0, 4); el.config = { showDetails: true }; await settled();
    expect(document.activeElement?.getAttribute('data-focus-key')).toBe('row:d');
  });
  it('copies selection arrays and respects hidden metrics while retaining status', async () => {
    const el = chart(); const ids = ['b', 'c', 'd'];
    el.config = { showDetails: true, showCounts: false, showPercentages: false, separateCategoryIds: ids };
    ids[0] = 'e'; const copy = el.config; copy.separateCategoryIds![0] = 'e'; await settled();
    expect(el.config.separateCategoryIds).toEqual(['b', 'c', 'd']);
    const group = el.querySelector<HTMLButtonElement>('[data-focus-key="group:other"]')!;
    group.click(); expect(group.parentElement!.querySelector('.a11y-segmented-bar-chart__group-members')!.textContent).not.toContain('9');
    el.suppressed = true; el.data = data.map(d => d.id === 'e' ? { ...d, value: 0 } : d); await settled();
    expect(el.querySelector('[data-focus-key="group:other"]')?.textContent).toContain('Suppressed');
    el.suppressed = false; el.data = data; await settled();
    el.data = data.map(d => d.id === 'e' ? { ...d, value: null } : d);
    el.config = { showDetails: true, showCounts: false, showPercentages: true, separateCategoryIds: ['b', 'c', 'd'] }; await settled();
    expect(el.querySelector('[data-focus-key="group:other"]')?.textContent).toContain('Incomplete');
    expect(el.querySelector('.a11y-segmented-bar-chart__group-members')?.textContent).toContain('Not reported');
    el.config = { separateCategoryIds: {} as string[] };
    expect(() => el.config).not.toThrow(); await settled();
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
  });
});

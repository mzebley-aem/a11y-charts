import { beforeEach, describe, expect, it, vi } from 'vitest';
import { A11Y_LINE_CHART_TAG_NAME, A11yLineChartElement, defineA11yLineChart } from '../src/index.js';

const settle = async (): Promise<void> => { await Promise.resolve(); };

describe('line chart lifecycle regressions', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('keeps navigator focus and the selected period when data is prepended', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.data = [{ x: '2024', actual: 1, target: 2 }, { x: '2025', actual: 3, target: 4 }];
    document.body.append(chart);
    await settle();
    const navigator = chart.querySelector<HTMLInputElement>('.a11y-line-chart__navigator')!;
    navigator.value = '1';
    navigator.dispatchEvent(new Event('input', { bubbles: true }));
    navigator.focus();
    chart.data = [{ x: '2023', actual: 0, target: 2 }, { x: '2024', actual: 1, target: 2 }, { x: '2025', actual: 3, target: 4 }];
    await settle();
    expect(document.activeElement).toBe(chart.querySelector('.a11y-line-chart__navigator'));
    expect(chart.querySelector<HTMLInputElement>('.a11y-line-chart__navigator')?.value).toBe('2');
  });

  it('preserves the chart viewport element across ordinary updates', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.data = [{ x: '2024', actual: 1, target: 2 }, { x: '2025', actual: 3, target: 4 }];
    document.body.append(chart);
    await settle();
    const viewport = chart.querySelector('.a11y-line-chart__chart');
    chart.subtitle = 'Updated subtitle';
    await settle();
    expect(chart.querySelector('.a11y-line-chart__chart')).toBe(viewport);
  });

  it('restores stepper and display-control focus after an update rebuild', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = { showControls: true, stepperVisibility: 'always' };
    chart.data = [{ x: '2023', actual: 0, target: 2 }, { x: '2024', actual: 1, target: 2 }, { x: '2025', actual: 3, target: 4 }];
    document.body.append(chart);
    await settle();
    for (const key of ['stepper-next', 'control-showActualValues']) {
      chart.querySelector<HTMLElement>(`[data-focus-key="${key}"]`)!.focus();
      chart.data = [{ x: '2024', actual: 5, target: 2 }, { x: '2025', actual: 6, target: 4 }];
      await settle();
      expect(document.activeElement).toBe(chart.querySelector(`[data-focus-key="${key}"]`));
    }
  });

  it('falls back to navigator when the focused stepper action becomes disabled', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = { stepperVisibility: 'always' };
    chart.data = [{ x: '2023', actual: 0, target: 2 }, { x: '2024', actual: 1, target: 2 }, { x: '2025', actual: 3, target: 4 }];
    document.body.append(chart);
    await settle();
    const next = chart.querySelector<HTMLButtonElement>('[data-focus-key="stepper-next"]')!;
    next.click();
    const selectedNext = chart.querySelector<HTMLButtonElement>('[data-focus-key="stepper-next"]')!;
    selectedNext.focus();
    expect(document.activeElement).toBe(selectedNext);
    chart.data = [{ x: '2023', actual: 0, target: 2 }, { x: '2024', actual: 1, target: 2 }];
    await settle();
    expect(chart.querySelector<HTMLButtonElement>('[data-focus-key="stepper-next"]')?.disabled).toBe(true);
    expect([chart.querySelector('.a11y-line-chart__navigator'), chart.querySelector('[data-a11y-line-chart-owned]')]).toContain(document.activeElement);
  });

  it('defensively copies Date and difference data in point events', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const x = new Date('2025-01-01T00:00:00Z');
    chart.data = [{ x, actual: 90, target: 80 }];
    chart.baseline = { x, value: 75 };
    document.body.append(chart);
    await settle();
    let detail: CustomEvent | undefined;
    chart.addEventListener('a11y-line-chart-point-change', (event) => { detail = event as CustomEvent; });
    chart.querySelector<HTMLInputElement>('.a11y-line-chart__navigator')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    const payload = detail!.detail as { x: Date; targetDifference: { signedValue: number }; baselineDifference: { absoluteValue: number } };
    payload.x.setFullYear(1999);
    const originalDifference = payload.targetDifference.signedValue;
    const originalBaselineDifference = payload.baselineDifference.absoluteValue;
    payload.targetDifference.signedValue = 999;
    payload.baselineDifference.absoluteValue = 999;
    expect(chart.data[0]?.x).toEqual(x);
    chart.querySelector<HTMLInputElement>('.a11y-line-chart__navigator')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect((detail!.detail as typeof payload).targetDifference.signedValue).toBe(originalDifference);
    expect((detail!.detail as typeof payload).baselineDifference.absoluteValue).toBe(originalBaselineDifference);
  });

  it('passes Date copies to custom value and period formatters', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const x = new Date('2025-01-01T00:00:00Z');
    chart.formatValue = ({ x: formatterDate, value }) => {
      if (formatterDate instanceof Date) formatterDate.setFullYear(1999);
      return String(value);
    };
    chart.formatXValue = (formatterDate) => {
      if (formatterDate instanceof Date) formatterDate.setFullYear(1998);
      return 'period';
    };
    chart.data = [{ x, actual: 90, target: 80 }];
    document.body.append(chart);
    await settle();
    expect(chart.data[0]?.x).toEqual(x);
  });

  it('retains only a structured validation error for invalid input', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const invalid = { actual: 1, target: 2 } as { x?: number; actual: number; target: number };
    chart.data = [invalid as never];
    document.body.append(chart);
    await settle();
    invalid.x = 2025;
    chart.messages = { validationDataX: 'localized period error {index}' };
    await settle();
    expect(chart.querySelector('[role="alert"]')?.textContent).toContain('localized period error 1');
  });

  it('closes and restores an open dialog as a modal after reconnect', async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (this: HTMLDialogElement) { this.open = true; });
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const viewStates: boolean[] = [];
    chart.addEventListener('a11y-line-chart-data-view-change', (event) => viewStates.push((event as CustomEvent<{ open: boolean }>).detail.open));
    chart.data = [{ x: 2025, actual: 90, target: 80 }];
    document.body.append(chart);
    await settle();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data-action"]')!.click();
    const dialog = chart.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    chart.remove();
    expect(dialog.open).toBe(false);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(viewStates).toEqual([true, false]);
    document.body.append(chart);
    await settle();
    expect(dialog.open).toBe(true);
    expect(viewStates).toEqual([true, false, true]);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(showModal).toHaveBeenCalledTimes(2);
    showModal.mockRestore();
  });

  it('accepts a nullish JavaScript config and renders semantic formatted values in the table', async () => {
    const chart = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    chart.config = null as never;
    chart.data = [{ x: 2025, actual: 12.345, target: 20 }];
    chart.formatValue = ({ value }) => `canonical ${value}`;
    document.body.append(chart);
    await settle();
    expect(chart.querySelector('tbody tr td')?.textContent).toBe('canonical 12.345');
  });
});

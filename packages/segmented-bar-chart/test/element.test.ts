import { afterEach, describe, expect, it } from 'vitest';
import {
  A11ySegmentedBarChartElement,
  defineA11ySegmentedBarChart,
} from '../src/index.js';

defineA11ySegmentedBarChart();
afterEach(() => document.body.replaceChildren());
const settled = async () => {
  await Promise.resolve();
};

describe('segmented bar element', () => {
  it('renders the highlighted value and denominator from the same model as the table', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.chartTitle = 'Outcomes';
    chart.data = [
      { id: 'a', label: 'First', value: 3 },
      { id: 'b', label: 'Second', value: 7 },
    ];
    chart.total = 10;
    chart.config = {
      highlightedId: 'a',
      dataView: 'inline',
      showActions: false,
    };
    document.body.append(chart);
    await settled();
    expect(chart?.querySelector('.a11y-segmented-bar-chart__total')?.textContent).toContain('3');
    expect(chart?.querySelector('.a11y-segmented-bar-chart__total')?.textContent).toContain('10');
    expect(chart?.querySelector('table')?.textContent).toContain('30.00%');
  });

  it('never exposes a suppressed zero in the getter, table, legend, or segment geometry', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.data = [
      { id: 'a', label: 'Protected', value: 0 },
      { id: 'b', label: 'Other', value: 63 },
    ];
    chart.total = 100;
    chart.suppressed = true;
    chart.config = { dataView: 'inline', showDetails: true };
    document.body.append(chart);
    await settled();
    expect(chart.data[0]?.value).toBeNull();
    expect(chart.querySelector('table')?.textContent).toContain('Suppressed');
    expect(chart?.querySelectorAll('.a11y-segmented-bar-chart__segment')).toHaveLength(0);
  });

  it('provides independent inline table and dismissible detail controls', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.data = [
      { id: 'a', label: 'First', value: 3, definition: 'Definition' },
    ];
    chart.config = {
      dataView: 'inline',
      showActions: false,
      showDetails: true,
    };
    document.body.append(chart);
    await settled();
    expect(chart?.querySelector('table')).not.toBeNull();
    const button = chart.querySelector<HTMLButtonElement>('.a11y-segmented-bar-chart__legend button')!;
    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('data view invalidation', () => {
  it('closes stale data and recovers focus when data becomes invalid or data view is none', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.chartTitle = 'Data';
    chart.data = [{ id: 'a', label: 'A', value: 1 }];
    document.body.append(chart);
    await settled();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    expect(chart.querySelector('dialog')?.open).toBe(true);
    chart.config = { dataView: 'none' };
    await settled();
    expect(chart.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(chart.querySelector('.a11y-segmented-bar-chart__title'));
    chart.config = {};
    await settled();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    chart.data = [{ id: '', label: 'Invalid', value: 1 }];
    await settled();
    expect(chart.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(chart.querySelector('[role="alert"]'));
    expect(chart.textContent).not.toContain('Download CSV');
  });
});

describe('detail trigger keyboard movement', () => {
  const press = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  };

  it('moves focus between detail triggers with arrow, Home, and End keys only when focus moves', async () => {
    const chart = new A11ySegmentedBarChartElement();
    chart.data = [
      { id: 'a', label: 'First', value: 1 },
      { id: 'b', label: 'Second', value: 2 },
      { id: 'c', label: 'Third', value: 3 },
    ];
    chart.config = { showDetails: true, dataView: 'inline', showActions: false };
    document.body.append(chart);
    await settled();
    const triggers = [...chart.querySelectorAll<HTMLButtonElement>('.a11y-segmented-bar-chart__legend-item > button')];
    expect(triggers).toHaveLength(3);

    triggers[0]!.focus();
    let event = press(triggers[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(triggers[1]);
    expect(event.defaultPrevented).toBe(true);

    event = press(triggers[1]!, 'ArrowRight');
    expect(document.activeElement).toBe(triggers[2]);
    expect(event.defaultPrevented).toBe(true);

    event = press(triggers[2]!, 'ArrowDown');
    expect(document.activeElement).toBe(triggers[2]);
    expect(event.defaultPrevented).toBe(false);
    event = press(triggers[2]!, 'End');
    expect(document.activeElement).toBe(triggers[2]);
    expect(event.defaultPrevented).toBe(false);

    event = press(triggers[2]!, 'Home');
    expect(document.activeElement).toBe(triggers[0]);
    expect(event.defaultPrevented).toBe(true);

    event = press(triggers[0]!, 'ArrowUp');
    expect(document.activeElement).toBe(triggers[0]);
    expect(event.defaultPrevented).toBe(false);
    event = press(triggers[0]!, 'ArrowLeft');
    expect(document.activeElement).toBe(triggers[0]);
    expect(event.defaultPrevented).toBe(false);

    event = press(triggers[0]!, 'End');
    expect(document.activeElement).toBe(triggers[2]);
    expect(event.defaultPrevented).toBe(true);

    event = press(triggers[2]!, 'ArrowLeft');
    expect(document.activeElement).toBe(triggers[1]);
    expect(event.defaultPrevented).toBe(true);

    event = press(triggers[1]!, 'ArrowDown', { shiftKey: true });
    expect(document.activeElement).toBe(triggers[1]);
    expect(event.defaultPrevented).toBe(false);
    event = press(triggers[1]!, 'ArrowDown', { ctrlKey: true });
    expect(document.activeElement).toBe(triggers[1]);
    expect(event.defaultPrevented).toBe(false);
    event = press(triggers[1]!, 'a');
    expect(document.activeElement).toBe(triggers[1]);
    expect(event.defaultPrevented).toBe(false);
  });
});

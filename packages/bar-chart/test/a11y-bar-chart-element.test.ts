import { beforeEach, describe, expect, it, vi } from 'vitest';
import { A11yBarChartElement, defineA11yBarChart } from '../src/index.js';
import type { A11yBarChartDatum, A11yBarChartValueFormatContext } from '../src/model.js';

const flush = async (): Promise<void> => { await Promise.resolve(); await Promise.resolve(); };

function makeChart(data: A11yBarChartDatum[] = [
  { id: 'a', label: 'Alpha', value: 3, definition: '<p>First <strong>group</strong>.</p>' },
  { id: 'b', label: 'Beta', value: 1 }
]): A11yBarChartElement {
  defineA11yBarChart();
  const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
  chart.data = data;
  document.body.append(chart);
  return chart;
}

describe('a11y-bar-chart custom element', () => {
  beforeEach(() => { document.body.replaceChildren(); });

  it('retains focus on the inline summary when supplied data changes', async () => {
    const chart = makeChart();
    chart.config = { dataView: 'inline' };
    await flush();
    chart.querySelector<HTMLElement>('.a11y-bar-chart__inline-data > summary')!.focus();
    chart.data = [{ id: 'a', label: 'Updated Alpha', value: 8 }];
    await flush();
    expect(document.activeElement).toBe(chart.querySelector('.a11y-bar-chart__inline-data > summary'));
    expect(chart.querySelector('.a11y-bar-chart__row')?.textContent).toContain('Updated Alpha');
  });

  it('renders the supplied semantic values, total, explanation and sanitized definition controls', async () => {
    const chart = makeChart();
    await flush();
    expect(chart.querySelector('h2')?.textContent).toBe('Chart');
    expect(chart.querySelector('.a11y-bar-chart__summary')?.textContent).toContain('Alpha');
    expect(chart.querySelectorAll('.a11y-bar-chart__row')).toHaveLength(2);
    expect(chart.querySelector('.a11y-bar-chart__total')?.textContent).toContain('4');
    const toggle = chart.querySelector<HTMLButtonElement>('[data-focus-key="glossary"]');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    toggle?.click();
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__definition')?.textContent).toContain('First group.');
    expect(chart.querySelectorAll('.a11y-bar-chart__definition')).toHaveLength(1);
    expect(chart.querySelector('.a11y-bar-chart__definition script')).toBeNull();
  });

  it('validates errors, emits bubbling details, and returns defensive data copies', async () => {
    const chart = makeChart();
    await flush();
    const onError = vi.fn();
    document.body.addEventListener('a11y-bar-chart-error', onError);
    chart.data = [{ id: 'duplicate', label: 'One', value: 1 }, { id: 'duplicate', label: 'Two', value: 2 }];
    await flush();
    expect(chart.querySelector('[role="alert"]')?.textContent).toContain('unique');
    expect(onError).toHaveBeenCalledOnce();
    const detail = (onError.mock.calls[0]?.[0] as CustomEvent).detail;
    expect(detail.code).toBe('validationDuplicateId');
    chart.data = [{ id: 'valid', label: 'Valid', value: 2 }];
    await flush();
    const copy = chart.data;
    copy[0]!.label = 'Mutated externally';
    expect(chart.data[0]?.label).toBe('Valid');
  });

  it('updates the same open dialog and focused close control, then restores focus on close', async () => {
    const chart = makeChart();
    await flush();
    const dialog = chart.querySelector<HTMLDialogElement>('dialog')!;
    const show = chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!;
    const showModal = vi.spyOn(dialog, 'showModal').mockImplementation(() => dialog.setAttribute('open', ''));
    vi.spyOn(dialog, 'close').mockImplementation(() => { dialog.removeAttribute('open'); dialog.dispatchEvent(new Event('close')); });
    show.click();
    await flush();
    const close = dialog.querySelector<HTMLButtonElement>('.a11y-bar-chart__dialog-close')!;
    close.focus();
    chart.data = [{ id: 'c', label: 'Gamma', value: 8 }];
    await flush();
    expect(chart.querySelector('dialog')).toBe(dialog);
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('tbody')?.textContent).toContain('Gamma');
    expect(document.activeElement).toBe(close);
    expect(showModal).toHaveBeenCalledOnce();
    close.click();
    await flush();
    expect(document.activeElement).toBe(chart.querySelector('[data-focus-key="data"]'));
  });

  it('shows localized accessible feedback and emits errors when modal data cannot open', async () => {
    const chart = makeChart();
    chart.messages = {
      dialogUnsupported: 'Modal data is unsupported here.',
      dialogUnavailable: 'Modal data could not open.'
    };
    await flush();
    const dialog = chart.querySelector<HTMLDialogElement>('dialog')!;
    const onError = vi.fn();
    const onViewChange = vi.fn();
    chart.addEventListener('a11y-bar-chart-error', onError);
    chart.addEventListener('a11y-bar-chart-data-view-change', onViewChange);

    Object.defineProperty(dialog, 'showModal', { configurable: true, value: undefined });
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    expect(dialog.open).toBe(false);
    expect(chart.querySelector('[data-dialog-failure][role="alert"]')?.textContent).toBe('Modal data is unsupported here.');
    expect((onError.mock.calls[0]?.[0] as CustomEvent).detail).toMatchObject({ code: 'dialogUnsupported', message: 'Modal data is unsupported here.' });
    expect(onViewChange).not.toHaveBeenCalled();

    Object.defineProperty(dialog, 'showModal', { configurable: true, value: () => { throw new Error('modal unavailable'); } });
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    expect(dialog.open).toBe(false);
    expect(chart.querySelector('[data-dialog-failure][role="alert"]')?.textContent).toBe('Modal data could not open.');
    expect((onError.mock.calls[1]?.[0] as CustomEvent).detail).toMatchObject({ code: 'dialogUnavailable', message: 'Modal data could not open.' });
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it('wraps Tab and Shift+Tab between the dialog endpoint controls', async () => {
    const chart = makeChart();
    await flush();
    const dialog = chart.querySelector<HTMLDialogElement>('dialog')!;
    const showModal = vi.spyOn(dialog, 'showModal').mockImplementation(() => dialog.setAttribute('open', ''));
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();

    const close = dialog.querySelector<HTMLButtonElement>('.a11y-bar-chart__dialog-close')!;
    const csv = dialog.querySelector<HTMLButtonElement>('[data-focus-key="export"]')!;
    close.focus();
    const backwards = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    close.dispatchEvent(backwards);
    expect(backwards.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(csv);

    csv.focus();
    const forwards = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    csv.dispatchEvent(forwards);
    expect(forwards.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(close);
  });

  it('supports localized JSON messages and reports malformed JSON without stale content', async () => {
    const chart = makeChart();
    await flush();
    chart.setAttribute('messages', JSON.stringify({ title: 'Rapport', showData: 'Voir les données', total: 'Somme' }));
    await flush();
    expect(chart.querySelector('h2')?.textContent).toBe('Rapport');
    expect(chart.querySelector('.a11y-bar-chart__total')?.textContent).toContain('Somme');
    chart.setAttribute('messages', '{broken');
    await flush();
    expect(chart.querySelector('[role="alert"]')?.textContent).toContain('JSON');
    expect(chart.querySelector('.a11y-bar-chart__row')).toBeNull();

    chart.messages = { invalidMessages: 'Le dictionnaire de messages est invalide.' };
    chart.setAttribute('messages', '[]');
    await flush();
    expect(chart.querySelector('[role="alert"]')?.textContent).toBe('Le dictionnaire de messages est invalide.');
    expect(chart.querySelector('.a11y-bar-chart__row')).toBeNull();
  });

  it('coalesces attributes, supports inline mode and announces one data update without initial chatter', async () => {
    const chart = makeChart();
    const onReady = vi.fn();
    const onChange = vi.fn();
    chart.addEventListener('a11y-bar-chart-ready', onReady);
    chart.addEventListener('a11y-bar-chart-data-change', onChange);
    chart.setAttribute('chart-title', 'Initial title');
    chart.setAttribute('subtitle', 'Context');
    chart.filtered = true;
    chart.config = { dataView: 'inline', scaleMode: 'largest' };
    await flush();
    expect(onReady).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
    expect(chart.querySelector('details summary')?.textContent).toBe('Complete chart data');
    expect(chart.querySelector('.a11y-bar-chart__indicator')?.textContent).toBe('Filtered');
    expect(chart.querySelector('.a11y-bar-chart__indicators')?.getAttribute('role')).toBe('group');
    expect(chart.querySelector('.a11y-bar-chart__indicators')?.getAttribute('aria-label')).toBe('Category');
    chart.data = [{ id: 'c', label: 'Gamma', value: 5 }];
    await flush();
    expect(onChange).toHaveBeenCalledOnce();
    const detail = (onChange.mock.calls[0]?.[0] as CustomEvent).detail;
    detail.data[0].label = 'Mutated event copy';
    detail.model.rows[0].label = 'Mutated model copy';
    expect(chart.data[0]?.label).toBe('Gamma');
    expect(chart.querySelector('.a11y-bar-chart__visually-hidden[aria-live="polite"]')?.textContent).toContain('updated');
  });

  it('keeps instance IDs and authored children isolated and handles disconnect/reconnect', async () => {
    const first = makeChart();
    first.append(document.createElement('em'));
    const second = makeChart();
    await flush();
    expect(first.querySelector('em')).toBeTruthy();
    expect(first.querySelector('dialog')?.id).not.toBe(second.querySelector('dialog')?.id);
    const dialog = first.querySelector<HTMLDialogElement>('dialog')!;
    const showModal = vi.spyOn(dialog, 'showModal').mockImplementation(() => dialog.setAttribute('open', ''));
    vi.spyOn(dialog, 'close').mockImplementation(() => {
      dialog.removeAttribute('open');
      setTimeout(() => dialog.dispatchEvent(new Event('close')), 0);
    });
    const viewChanges: boolean[] = [];
    first.addEventListener('a11y-bar-chart-data-view-change', (event) => {
      viewChanges.push((event as CustomEvent<{ open: boolean }>).detail.open);
    });
    first.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    first.remove();
    document.body.append(first);
    await flush();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flush();
    expect(first.querySelector('dialog')).toBe(dialog);
    expect(dialog.open).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(2);
    expect(viewChanges).toEqual([true, false, true]);
  });

  it('runs only the newest queued render after same-turn disconnect and reconnect', async () => {
    const chart = makeChart();
    const formatter = vi.fn(({ value }: A11yBarChartValueFormatContext) => String(value));
    chart.formatValue = formatter;
    await flush();
    const callsPerRender = formatter.mock.calls.length;
    expect(callsPerRender).toBeGreaterThan(0);

    formatter.mockClear();
    chart.locale = 'fr-FR';
    chart.remove();
    document.body.append(chart);
    await flush();

    expect(formatter).toHaveBeenCalledTimes(callsPerRender);
  });

  it('preserves inline disclosure state through data, locale, message and view-mode updates', async () => {
    const chart = makeChart();
    chart.config = { dataView: 'inline' };
    await flush();
    const disclosure = chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')!;
    disclosure.open = true;
    disclosure.dispatchEvent(new Event('toggle'));

    chart.data = [{ id: 'next', label: 'Next category', value: 7 }];
    await flush();
    expect(chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')?.open).toBe(true);

    chart.locale = 'fr-FR';
    chart.messages = { dataInlineSummary: 'Données complètes' };
    await flush();
    expect(chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')?.open).toBe(true);
    expect(chart.querySelector('details summary')?.textContent).toBe('Données complètes');

    chart.config = { dataView: 'dialog' };
    await flush();
    chart.config = { dataView: 'inline' };
    await flush();
    expect(chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')?.open).toBe(true);
  });

  it('keeps complete data visible when an open dialog switches to inline mode', async () => {
    const chart = makeChart();
    await flush();
    const dialog = chart.querySelector('dialog')!;
    vi.spyOn(dialog, 'showModal').mockImplementation(() => dialog.setAttribute('open', ''));
    vi.spyOn(dialog, 'close').mockImplementation(() => { dialog.removeAttribute('open'); dialog.dispatchEvent(new Event('close')); });
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    expect(dialog.open).toBe(true);
    chart.config = { dataView: 'inline' };
    await flush();
    const details = chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')!;
    expect(dialog.open).toBe(false);
    expect(details.open).toBe(true);
    expect(document.activeElement).toBe(details.querySelector('summary'));
  });

  it('exports CSV headers from the active message dictionary and locale', async () => {
    const chart = makeChart([{ id: 'c', label: 'Catégorie', value: 1 }]);
    chart.config = { dataView: 'inline', locale: 'fr-FR' };
    chart.locale = 'fr-FR';
    chart.messages = {
      csvCategoryHeader: 'Groupe',
      csvCountHeader: 'Effectif',
      csvPercentageHeader: 'Part',
      csvTotalHeader: 'Ensemble'
    };
    await flush();

    const createObjectURL = vi.fn((_blob: Blob) => 'blob:bar-chart-test');
    const originalDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    try {
      chart.querySelector<HTMLButtonElement>('.a11y-bar-chart__inline-data [data-focus-key="export"]')!.click();
      await flush();
      const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
      expect(await blob.text()).toContain('Groupe,Effectif,Part');
      expect(await blob.text()).toContain('Ensemble,1,');
      expect(anchorClick).toHaveBeenCalledOnce();
    } finally {
      anchorClick.mockRestore();
      if (originalDescriptor) Object.defineProperty(URL, 'createObjectURL', originalDescriptor);
      else delete (URL as unknown as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
    }
  });

  it('applies visual-list visibility independently from the complete table and export', async () => {
    const chart = makeChart();
    const onView = vi.fn();
    chart.addEventListener('a11y-bar-chart-data-view-change', onView);
    chart.config = { showCounts: false, showPercentages: false, showTotal: false, showSummary: false, tableVisibility: 'screen-reader' };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__summary')).toBeNull();
    expect(chart.querySelector('.a11y-bar-chart__total')).toBeNull();
    expect(chart.querySelector('.a11y-bar-chart__count')).toBeNull();
    expect(chart.querySelector('.a11y-bar-chart__percentage')).toBeNull();
    expect(chart.querySelectorAll('.a11y-bar-chart__row')).toHaveLength(2);
    const backgroundViewport = chart.querySelector<HTMLElement>('.a11y-bar-chart__background-data .a11y-bar-chart__table-wrap')!;
    expect(backgroundViewport.hasAttribute('tabindex')).toBe(false);
    expect(backgroundViewport.hasAttribute('role')).toBe(false);
    expect(backgroundViewport.hasAttribute('aria-label')).toBe(false);
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    expect(chart.querySelectorAll('dialog tbody tr')).toHaveLength(2);
    const dialogViewport = chart.querySelector<HTMLElement>('dialog .a11y-bar-chart__table-wrap')!;
    expect(dialogViewport.tabIndex).toBe(0);
    expect(dialogViewport.getAttribute('role')).toBe('region');
    expect(dialogViewport.getAttribute('aria-label')).toContain('Complete data');
    expect(chart.querySelector('.a11y-bar-chart__background-data.a11y-bar-chart__visually-hidden')).toBeTruthy();
    expect(chart.querySelector('dialog .a11y-bar-chart__screen-reader-table')).toBeNull();
    expect(chart.querySelector('[data-focus-key="export"]')).toBeTruthy();

    chart.config = { showTable: false, tableVisibility: 'visible' };
    await flush();
    expect(chart.querySelector('[data-focus-key="data"]')).toBeTruthy();
    chart.config = { showTable: true, tableVisibility: 'hidden' };
    await flush();
    expect(chart.querySelector('[data-focus-key="data"]')).toBeNull();
    expect(chart.querySelector('.a11y-bar-chart__inline-data')).toBeNull();
    expect(chart.querySelector('[data-focus-key="export"]')).toBeNull();
    expect(chart.querySelector('dialog')?.open).toBe(false);
    expect(chart.querySelector('dialog tbody')).toBeNull();
    expect(onView.mock.calls[onView.mock.calls.length - 1]?.[0]).toMatchObject({ detail: { open: false, dataView: 'dialog' } });
  });

  it('keeps missing and suppressed status visible when numeric annotations are hidden and background table has no hidden focus stops', async () => {
    const chart = makeChart([
      { id: 'missing', label: 'Missing group', value: null },
      { id: 'suppressed', label: 'Protected group', value: 0 },
      { id: 'known', label: 'Known group', value: 5 }
    ]);
    chart.suppressed = true;
    chart.context = '<p>See <a href="https://example.test">reporting notes</a>.</p>';
    chart.dataNote = '<p>Open <a href="https://example.test/data">data notes</a>.</p>';
    chart.config = { showCounts: false, showPercentages: false, tableVisibility: 'screen-reader' };
    await flush();

    const rows = [...chart.querySelectorAll<HTMLElement>('.a11y-bar-chart__row')];
    expect(rows[0]?.textContent).toContain('Missing');
    expect(rows[1]?.textContent).toContain('Suppressed');
    expect(rows[2]?.querySelector('.a11y-bar-chart__value')).toBeNull();

    const background = chart.querySelector<HTMLElement>('.a11y-bar-chart__background-data')!;
    expect(background.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')).toHaveLength(0);
    expect(background.querySelector('table')).toBeTruthy();
    expect(background.textContent).not.toContain('reporting notes');
    expect(background.textContent).not.toContain('data notes');
  });

  it('keeps inline data and its CSV usable when the chart action strip is hidden', async () => {
    const chart = makeChart();
    chart.config = { dataView: 'inline', showActions: false, tableVisibility: 'visible' };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__actions')).toBeNull();
    expect(chart.querySelector('.a11y-bar-chart__inline-data summary')).toBeTruthy();
    expect(chart.querySelector('.a11y-bar-chart__inline-data tbody tr')).toBeTruthy();
    expect(chart.querySelector('.a11y-bar-chart__inline-data [data-focus-key="export"]')).toBeTruthy();
    chart.config = { dataView: 'inline', showActions: false, showExport: false, tableVisibility: 'visible' };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__inline-data summary')).toBeTruthy();
    expect(chart.querySelector('[data-focus-key="export"]')).toBeNull();
  });

  it('reports an open inline view closed when table visibility hides it and clears its open preference', async () => {
    const chart = makeChart();
    chart.config = { dataView: 'inline' };
    await flush();
    const onView = vi.fn();
    chart.addEventListener('a11y-bar-chart-data-view-change', onView);
    const details = chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')!;
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    await flush();
    expect(onView.mock.calls.map(([event]) => (event as CustomEvent).detail)).toEqual([
      { open: true, dataView: 'inline' }
    ]);

    chart.config = { tableVisibility: 'hidden' };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__inline-data')).toBeNull();
    expect(onView.mock.calls.map(([event]) => (event as CustomEvent).detail)).toEqual([
      { open: true, dataView: 'inline' },
      { open: false, dataView: 'inline' }
    ]);

    chart.config = { dataView: 'inline', tableVisibility: 'visible' };
    await flush();
    expect(chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')?.open).toBe(false);
    expect(onView).toHaveBeenCalledTimes(2);
  });

  it('reports inline close before a subsequent dialog open during data-view mode changes', async () => {
    const chart = makeChart();
    chart.config = { dataView: 'inline' };
    await flush();
    const onView = vi.fn();
    chart.addEventListener('a11y-bar-chart-data-view-change', onView);
    const details = chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')!;
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    await flush();

    chart.config = { dataView: 'dialog' };
    await flush();
    expect(onView.mock.calls.map(([event]) => (event as CustomEvent).detail)).toEqual([
      { open: true, dataView: 'inline' },
      { open: false, dataView: 'inline' }
    ]);
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    expect(onView.mock.calls.map(([event]) => (event as CustomEvent).detail)).toEqual([
      { open: true, dataView: 'inline' },
      { open: false, dataView: 'inline' },
      { open: true, dataView: 'dialog' }
    ]);
  });

  it('includes sanitized context and data notes in both data views and CSV metadata', async () => {
    const chart = makeChart();
    chart.context = '<p>Context <script>bad()</script><strong>details</strong>.</p>';
    chart.dataNote = '<p>Data <a href="javascript:alert(1)">note</a>.</p>';
    await flush();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    const content = chart.querySelector('.a11y-bar-chart__dialog [data-dialog-content]')!;
    expect(content.textContent).toContain('Context details.');
    expect(content.textContent).toContain('Data note.');
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('a')?.getAttribute('href')).toBeNull();
    chart.config = { showContext: false };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__dialog [data-dialog-content]')?.textContent).not.toContain('Context details.');
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:bar-chart-context-test');
    const originalDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    chart.querySelector<HTMLButtonElement>('.a11y-bar-chart__dialog [data-focus-key="export"]')!.click();
    await flush();
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const csv = await blob.text();
    expect(csv).toContain('Context,Context details.');
    expect(csv).toContain('Data note,Data note.');
    expect(csv).not.toContain('<p>');
    if (originalDescriptor) Object.defineProperty(URL, 'createObjectURL', originalDescriptor);
    else delete (URL as unknown as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
  });

  it('emits data-view and disclosure changes only on actual user toggles', async () => {
    const chart = makeChart();
    chart.config = { dataView: 'inline' };
    await flush();
    const onView = vi.fn();
    const onDisclosure = vi.fn();
    chart.addEventListener('a11y-bar-chart-data-view-change', onView);
    chart.addEventListener('a11y-bar-chart-disclosure-change', onDisclosure);
    const details = chart.querySelector<HTMLDetailsElement>('.a11y-bar-chart__inline-data')!;
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    chart.querySelector<HTMLButtonElement>('[data-focus-key="explain"]')!.click();
    await flush();
    chart.data = [{ id: 'c', label: 'Changed', value: 9 }];
    await flush();
    expect(onView).toHaveBeenCalledTimes(1);
    expect(onView.mock.calls[0]?.[0]).toMatchObject({ detail: { open: true, dataView: 'inline' }, bubbles: true });
    expect(onDisclosure).toHaveBeenCalledTimes(1);
    expect(onDisclosure.mock.calls[0]?.[0]).toMatchObject({ detail: { disclosure: 'explanation', expanded: true }, bubbles: true });
    chart.config = { dataView: 'dialog' };
    await flush();
    expect(onView).toHaveBeenCalledTimes(2);
    expect(onView.mock.calls[1]?.[0]).toMatchObject({ detail: { open: false, dataView: 'inline' } });
  });

  it('places the plain-language summary after actions and before chart rows in both disclosure states', async () => {
    const chart = makeChart();
    chart.config = { showActions: true, showExplanation: true };
    await flush();
    const root = chart.querySelector('.a11y-bar-chart__root')!;
    const actions = root.querySelector('.a11y-bar-chart__actions')!;
    const explanation = root.querySelector<HTMLElement>('.a11y-bar-chart__plain-language')!;
    const rows = root.querySelector('.a11y-bar-chart__rows')!;
    const order = Array.from(root.children);
    expect(order.indexOf(actions)).toBeLessThan(order.indexOf(explanation));
    expect(order.indexOf(explanation)).toBeLessThan(order.indexOf(rows));
    expect(explanation.hidden).toBe(true);
    expect(actions.querySelector('.a11y-bar-chart__action-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(actions.querySelector('.a11y-bar-chart__action-icon--table')?.getAttribute('aria-hidden')).toBe('true');

    chart.querySelector<HTMLButtonElement>('[data-focus-key="explain"]')!.click();
    await flush();
    const openRoot = chart.querySelector('.a11y-bar-chart__root')!;
    const openOrder = Array.from(openRoot.children);
    const openActions = openRoot.querySelector('.a11y-bar-chart__actions')!;
    const openExplanation = openRoot.querySelector<HTMLElement>('.a11y-bar-chart__plain-language')!;
    const openRows = openRoot.querySelector('.a11y-bar-chart__rows')!;
    expect(openExplanation.hidden).toBe(false);
    expect(openExplanation.querySelector('.a11y-bar-chart__plain-language-title')?.textContent).toBe('Plain language summary');
    expect(openExplanation.getAttribute('aria-labelledby')).toBe(openExplanation.querySelector('h3')?.id);
    expect(openActions.querySelector('[data-focus-key="explain"] .a11y-bar-chart__action-icon--active')).toBeTruthy();
    expect(openOrder.indexOf(openActions)).toBeLessThan(openOrder.indexOf(openExplanation));
    expect(openOrder.indexOf(openExplanation)).toBeLessThan(openOrder.indexOf(openRows));
  });

  it('does not repeat shared context inside an authored plain-language summary', async () => {
    const chart = makeChart();
    chart.config = { showContext: true, showExplanation: true };
    chart.context = '<p>Reporting period: Q1.</p>';
    chart.explanation = '<p>Use this authored summary.</p>';
    await flush();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="explain"]')!.click();
    await flush();

    const region = chart.querySelector('.a11y-bar-chart__plain-language')!;
    expect(region.querySelector('.a11y-bar-chart__authored-explanation')?.textContent).toContain('Use this authored summary.');
    expect(region.querySelector('.a11y-bar-chart__context')).toBeNull();
    expect(chart.querySelectorAll('.a11y-bar-chart__root > .a11y-bar-chart__context')).toHaveLength(1);
    expect(chart.querySelector('.a11y-bar-chart__root > .a11y-bar-chart__context')?.textContent).toContain('Reporting period: Q1.');
  });

  it('updates disclosure preferences only when config inputs change and applies/removes theme tokens', async () => {
    const chart = makeChart();
    chart.config = { explanationExpanded: true, glossaryExpanded: true };
    chart.theme = { color: '#123456', borderRadius: '1rem', buttonPadding: '1rem' };
    await flush();
    expect(chart.querySelector<HTMLElement>(`#${chart.instanceId}-explanation`)?.hidden).toBe(false);
    expect(chart.querySelector('.a11y-bar-chart__definition')).toBeTruthy();
    expect(chart.querySelector('.a11y-bar-chart__root')?.getAttribute('style')).toContain('--a11y-bar-chart-color: #123456');
    chart.querySelector<HTMLButtonElement>('[data-focus-key="explain"]')!.click();
    await flush();
    chart.config = { ...chart.config, scaleMode: 'population-share' };
    await flush();
    expect(chart.querySelector<HTMLElement>(`#${chart.instanceId}-explanation`)?.hidden).toBe(true);
    chart.theme = {};
    await flush();
    expect(chart.querySelector<HTMLElement>('.a11y-bar-chart__root')?.style.getPropertyValue('--a11y-bar-chart-color')).toBe('');
    expect(chart.querySelector<HTMLDialogElement>('dialog')?.style.getPropertyValue('--a11y-bar-chart-color')).toBe('');
  });

  it('changes textures without changing values or closing the focused data dialog', async () => {
    const chart = makeChart();
    await flush();
    const dataBefore = chart.data;
    const valuesBefore = chart.querySelector('.a11y-bar-chart__rows')?.textContent;
    const onData = vi.fn();
    chart.addEventListener('a11y-bar-chart-data-change', onData);
    const dialog = chart.querySelector<HTMLDialogElement>('dialog')!;
    vi.spyOn(dialog, 'showModal').mockImplementation(() => dialog.setAttribute('open', ''));
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    const close = dialog.querySelector<HTMLButtonElement>('.a11y-bar-chart__dialog-close')!;
    close.focus();
    for (const patternType of ['diagonal', 'dots', 'horizontal', 'none'] as const) {
      chart.theme = { patternType, patternColor: '#ffffff' };
      await flush();
      expect(chart.querySelector('dialog')).toBe(dialog);
      expect(dialog.open).toBe(true);
      expect(document.activeElement).toBe(close);
      expect(chart.data).toEqual(dataBefore);
      expect(chart.querySelector('.a11y-bar-chart__rows')?.textContent).toBe(valuesBefore);
      expect(chart.querySelector('.a11y-bar-chart__track')?.getAttribute('aria-hidden')).toBe('true');
    }
    expect(onData).not.toHaveBeenCalled();
    chart.theme = {};
    await flush();
    expect(chart.querySelector<HTMLElement>('.a11y-bar-chart__root')?.style.getPropertyValue('--a11y-bar-chart-pattern-image')).toBe('');
    expect(dialog.style.getPropertyValue('--a11y-bar-chart-pattern-color')).toBe('');
  });

  it('uses one formatter consistently and never formats missing or suppressed values', async () => {
    const chart = makeChart([
      { id: 'shown', label: 'Shown', value: 4 },
      { id: 'missing', label: 'Missing', value: null },
      { id: 'masked', label: 'Masked', value: 0 }
    ]);
    chart.total = 8;
    chart.suppressed = true;
    const formatter = vi.fn((context: A11yBarChartValueFormatContext) => `${context.series}:${context.value}`);
    chart.formatValue = formatter;
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__row')?.textContent).toContain('count:4');
    expect(chart.querySelector('.a11y-bar-chart__summary')?.textContent).toContain('count:4');
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    expect(chart.querySelector('tbody')?.textContent).toContain('count:4');
    expect(formatter.mock.calls.flatMap(([context]) => context.series === 'count' ? [context.id] : [])).not.toContain('missing');
    expect(formatter.mock.calls.flatMap(([context]) => context.series === 'count' ? [context.id] : [])).not.toContain('masked');
  });

  it('keeps screen-reader background data while showing a visible table in Data and avoids dangling controls', async () => {
    const chart = makeChart();
    chart.config = { tableVisibility: 'screen-reader' };
    await flush();
    const background = chart.querySelector<HTMLTableElement>('.a11y-bar-chart__background-data table')!;
    expect(background.id).toBe(`${chart.instanceId}-data-background`);
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')!.click();
    await flush();
    const dialogTable = chart.querySelector<HTMLTableElement>('dialog table')!;
    expect(dialogTable.id).toBe(`${chart.instanceId}-data-dialog`);
    expect(dialogTable.classList.contains('a11y-bar-chart__screen-reader-table')).toBe(false);

    chart.config = { ...chart.config, showGlossary: false };
    await flush();
    expect(chart.querySelector('.a11y-bar-chart__definition')).toBeNull();
    chart.data = [{ id: 'bad', label: 'Bad', value: Number.NaN }];
    await flush();
    expect(chart.querySelector('[data-focus-key="explain"]')).toBeNull();
    expect(chart.querySelector('[aria-controls$="-explanation"]')).toBeNull();
    expect(chart.querySelector('dialog')?.open).toBe(true);
    expect(chart.querySelector('dialog [role="alert"]')).toBeTruthy();
  });
});

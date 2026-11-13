import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  A11Y_LINE_CHART_TAG_NAME,
  A11yLineChartElement,
  defineA11yLineChart
} from '../src/index.js';
import { ENGLISH_LINE_CHART_MESSAGES } from '../src/messages.js';

async function settle(): Promise<void> {
  await Promise.resolve();
}

describe('A11yLineChartElement foundation', () => {
  beforeEach(() => {
    defineA11yLineChart();
    document.body.replaceChildren();
  });

  it('retains the focused inline download and disclosure action through source updates', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { dataView: 'inline' };
    element.data = [{ x: 'Q1', actual: 1, target: 2 }];
    document.body.append(element);
    await settle();
    element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')!.open = true;
    element.querySelector<HTMLElement>('.a11y-line-chart__inline-data [data-focus-key="csv-export"]')!.focus();
    element.data = [{ x: 'Q1', actual: 3, target: 4 }];
    await settle();
    expect(document.activeElement).toBe(element.querySelector('.a11y-line-chart__inline-data [data-focus-key="csv-export"]'));
    expect(element.querySelector('.a11y-line-chart__inline-data')?.textContent).toContain('3%');
    element.querySelector<HTMLElement>('[data-focus-key="explanation-action"]')!.focus();
    element.data = [{ x: 'Q1', actual: 5, target: 6 }];
    await settle();
    expect(document.activeElement).toBe(element.querySelector('[data-focus-key="explanation-action"]'));
  });

  it('returns modal focus to navigation when the host removes the Data action', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [{ x: 2025, actual: 72, target: 80 }];
    document.body.append(element);
    await settle();
    const dialog = element.querySelector<HTMLDialogElement>('dialog')!;
    dialog.showModal = () => dialog.setAttribute('open', '');
    dialog.close = () => dialog.removeAttribute('open');
    element.querySelector<HTMLButtonElement>('[data-focus-key="data-action"]')!.click();
    expect(dialog.open).toBe(true);
    element.config = { ...element.config, showActions: false };
    await settle();
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
    expect(document.activeElement).toBe(element.querySelector('.a11y-line-chart__navigator'));
  });

  it('keeps glossary relationships unique and copies definitions without accepting blank or repeated identities', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const definitions = [
      { id: 'same', label: 'Original', definition: 'Original definition' },
      { id: 'same', label: 'Duplicate', definition: 'Duplicate definition' },
      { id: '', label: 'Blank identity', definition: 'Blank definition' },
      { id: 'with spaces', label: 'Second', definition: 'Second definition' }
    ];
    element.definitions = definitions;
    element.config = { glossaryExpanded: true };
    element.data = [{ x: 2025, actual: 72, target: 80 }];
    definitions[0]!.label = 'Mutated';
    document.body.append(element);
    await settle();
    expect([...element.querySelectorAll('dt')].map((term) => term.textContent)).toEqual(['Original', 'Second']);
    const ids = [...element.querySelectorAll('[id]')].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => !/\s/.test(id))).toBe(true);
    element.definitions[0]!.definition = 'Mutated returned copy';
    expect(element.definitions[0]?.definition).toBe('Original definition');
  });

  it('keeps authored context independent of the summary and preserves literal legacy context', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { showSummary: false, contextNote: '<strong>Literal legacy text</strong>' };
    element.data = [{ x: 2025, actual: 72, target: 80 }];
    document.body.append(element);
    await settle();
    expect(element.querySelector('.a11y-line-chart__summary')).toBeNull();
    const context = element.querySelector('.a11y-line-chart__summary-context')!;
    expect(context.textContent).toBe('<strong>Literal legacy text</strong>');
    expect(context.querySelector('strong')).toBeNull();
    element.context = '<p>New <strong>rich context</strong></p>';
    await settle();
    expect(element.querySelector('.a11y-line-chart__summary-context strong')?.textContent).toBe('rich context');
    element.config = { ...element.config, showContext: false };
    await settle();
    expect(element.querySelector('.a11y-line-chart__summary-context')).toBeNull();
  });

  it('keeps a background table relationship and a visible explicit inline table for the inline data view', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { showSummary: true };
    element.data = [{ x: 2025, actual: 72, target: 80 }];
    document.body.append(element);
    await settle();
    const summary = element.querySelector('.a11y-line-chart__summary')!;
    expect(summary.getAttribute('role')).toBe('group');
    expect(summary.getAttribute('aria-label')).toBe('Chart summary');
    element.config = { dataView: 'inline' };
    await settle();
    const inlineTable = element.querySelector('.a11y-line-chart__inline-data .a11y-line-chart__table-region')!;
    expect(inlineTable.classList.contains('a11y-line-chart__table-region--visually-hidden')).toBe(false);
    expect(inlineTable.querySelector('table')).toBeTruthy();
    const navigator = element.querySelector('.a11y-line-chart__navigator')!;
    for (const id of navigator.getAttribute('aria-describedby')!.split(/\s+/)) expect(document.getElementById(id)).toBeTruthy();
    const background = element.querySelector('.a11y-line-chart__table-region--visually-hidden')!;
    expect(background.querySelector('button,a[href],input,summary')).toBeNull();
    const disclosure = element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')!;
    disclosure.open = true;
    disclosure.dispatchEvent(new Event('toggle'));
    expect(background.getAttribute('aria-hidden')).toBe('true');
    disclosure.open = false;
    disclosure.dispatchEvent(new Event('toggle'));
    expect(background.hasAttribute('aria-hidden')).toBe(false);
  });

  it('uses formatted bounds consistently in the summary, table, navigator, and events', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { decimalPlaces: 1, dataView: 'inline', autoPerPointMinWidth: true };
    element.formatValue = ({ value }) => value === null ? 'Missing' : `${value.toFixed(1)} units`;
    element.data = [
      { x: 'Q1', actual: 68, target: { min: 70, max: 80 } },
      { x: 'Q2', actual: 75, target: { min: 70, max: 80 } }
    ];
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-point-change', listener);
    document.body.append(element);
    await settle();
    expect(element.querySelector('tbody')?.textContent).toContain('70.0 units to 80.0 units');
    expect(element.textContent).toContain('Target met in Q2 — within range.');
    const navigator = element.querySelector<HTMLInputElement>('input[type="range"]')!;
    navigator.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(navigator.getAttribute('aria-valuetext')).toContain('within target range');
    expect(navigator.getAttribute('aria-valuetext')).toContain('70.0 units to 80.0 units');
    const detail = listener.mock.calls[0]?.[0].detail;
    expect(detail).toMatchObject({ target: { min: 70, max: 80 }, outcome: 'met', targetDifference: { relation: 'within', signedValue: 0 } });
    detail.target.min = 500;
    expect(element.data[1]?.target).toEqual({ min: 70, max: 80 });
  });

  it('protects stored ranges from input and getter mutation', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const target = { min: 70, max: 80 };
    element.data = [{ x: 2025, actual: 75, target }];
    target.min = 100;
    const returned = element.data[0]?.target as { min: number; max: number };
    returned.max = 0;
    expect(element.data[0]?.target).toEqual({ min: 70, max: 80 });
  });

  it('treats a zero as suppressed only under the chart-wide suppressed flag and keeps missing values distinct', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { valuePreset: 'number', dataView: 'inline', showControls: false, showActions: false };
    element.data = [{ x: 'Initial', actual: 1, target: 1 }];
    document.body.append(element); await settle();
    const format = vi.fn(({ value }: { value: number | null }) => value === null ? 'Missing' : `Value ${value}`);
    element.formatValue = format;
    await settle();
    format.mockClear();
    const changes: CustomEvent[] = [];
    element.addEventListener('a11y-line-chart-data-change', (event) => changes.push(event as CustomEvent));
    element.suppressed = true;
    element.data = [
      { x: 'Protected', actual: 0, target: 90 },
      { x: 'Target zero', actual: 50, target: 0 },
      { x: 'Missing', actual: null, target: null }
    ];
    await settle();
    expect(element.data[0]).toEqual({ x: 'Protected', actual: 0, target: 90 });
    expect(element.querySelector('.a11y-line-chart__suppression-indicator')?.textContent).toBe('Suppressed');
    expect(element.querySelector('.a11y-line-chart__suppression-note')?.textContent).toBe('Some values are suppressed to protect privacy.');
    const rows = element.querySelectorAll('tbody tr');
    expect(rows[0]?.textContent).toContain('Suppressed');
    expect(rows[0]?.textContent).not.toContain('Value 0');
    expect(rows[1]?.textContent).toContain('Value 50');
    expect(rows[1]?.textContent).toContain('Value 0');
    expect(rows[2]?.textContent).toContain('Not reported');
    expect(element.textContent).toContain('Suppressed');
    expect(format).not.toHaveBeenCalledWith(expect.objectContaining({ value: 0, series: 'actual' }));
    expect(format).toHaveBeenCalledWith(expect.objectContaining({ value: 0, series: 'target' }));
    expect(changes).toHaveLength(1);
    const detail = changes[0]!.detail as { model: { points: Array<{ actualValue: number | null; actualSuppressed: boolean; targetValue: unknown }> } };
    expect(detail.model.points[0]).toMatchObject({ actualValue: null, actualSuppressed: true, targetValue: 90 });
    expect(detail.model.points[1]).toMatchObject({ actualValue: 50, actualSuppressed: false, targetValue: 0 });
    expect(JSON.stringify(detail.model)).not.toContain('"actualValue":0');
  });

  it('reflects the suppressed attribute and property and reports zeros as real values when the flag is off', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { valuePreset: 'number', dataView: 'inline', showControls: false, showActions: false };
    element.formatValue = vi.fn(({ value }: { value: number | null }) => value === null ? 'Missing' : `Value ${value}`);
    element.data = [{ x: 'Zero', actual: 0, target: 80 }];
    document.body.append(element); await settle();
    expect(element.suppressed).toBe(false);
    expect(element.querySelector('.a11y-line-chart__suppression-indicator')).toBeNull();
    expect(element.querySelector('.a11y-line-chart__suppression-note')).toBeNull();
    expect(element.querySelector('tbody tr')?.textContent).toContain('Value 0');
    expect(element.textContent).not.toContain('Suppressed');

    element.setAttribute('suppressed', '');
    await settle();
    expect(element.suppressed).toBe(true);
    expect(element.querySelector('tbody tr')?.textContent).toContain('Suppressed');
    expect(element.querySelector('.a11y-line-chart__suppression-note')).not.toBeNull();

    element.removeAttribute('suppressed');
    await settle();
    expect(element.suppressed).toBe(false);
    expect(element.querySelector('tbody tr')?.textContent).toContain('Value 0');

    element.suppressed = true;
    await settle();
    expect(element.hasAttribute('suppressed')).toBe(true);
    expect(element.querySelector('tbody tr')?.textContent).toContain('Suppressed');
  });

  it('shows the suppression indicator and note whenever the flag is on, even without zero points', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { valuePreset: 'number', dataView: 'inline', showControls: false, showActions: false };
    element.suppressed = true;
    element.data = [{ x: 'Q1', actual: 4, target: 3 }, { x: 'Q2', actual: null, target: 3 }];
    document.body.append(element); await settle();
    expect(element.querySelector('.a11y-line-chart__suppression-indicator')?.textContent).toBe('Suppressed');
    expect(element.querySelector('.a11y-line-chart__suppression-note')).not.toBeNull();
    expect(element.querySelector('tbody tr')?.textContent).not.toContain('Suppressed');
  });

  it('renders sanitized context, data notes, definitions, and inline export without the action strip', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { dataView: 'inline', showActions: false, showControls: false, showSummary: false };
    element.context = '<p>Context <strong>detail</strong><script>bad()</script></p>';
    element.dataNote = '<p>Source note</p>';
    element.definitions = [{ id: 'result', label: '<img>Result', definition: '<p>A <em>definition</em><iframe>bad</iframe></p>' }];
    element.data = [{ x: 'Q1', actual: 1, target: 2 }];
    document.body.append(element); await settle();
    expect(element.querySelector('.a11y-line-chart__actions')).toBeNull();
    const details = element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')!;
    details.open = true; await settle();
    expect(details.querySelector('.a11y-line-chart__export')?.textContent).toBe('Download CSV');
    expect(details.querySelector('script, iframe, img')).toBeNull();
    expect(details.textContent).toContain('Context detail');
    expect(details.textContent).toContain('Source note');
    expect(element.querySelector('.a11y-line-chart__glossary dt')?.textContent).toBe('<img>Result');
  });

  it('applies disclosure expansion input changes and preserves preferences on unrelated updates', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.definitions = [{ id: 'one', label: 'One', definition: 'Definition' }];
    element.config = { explanationExpanded: true, glossaryExpanded: true, showActions: false };
    element.data = [{ x: 'Q1', actual: 1, target: 2 }]; document.body.append(element); await settle();
    expect(element.querySelector<HTMLDetailsElement>('.a11y-line-chart__explanation')?.open).toBe(true);
    expect(element.querySelector<HTMLDetailsElement>('.a11y-line-chart__glossary')?.open).toBe(true);
    element.querySelector<HTMLDetailsElement>('.a11y-line-chart__explanation')!.open = false;
    element.config = { ...element.config, locale: 'fr-FR' }; await settle();
    expect(element.querySelector<HTMLDetailsElement>('.a11y-line-chart__explanation')?.open).toBe(false);
    const { explanationExpanded: _removed, ...withoutExpansion } = element.config;
    element.config = withoutExpansion; await settle();
    expect(element.querySelector<HTMLDetailsElement>('.a11y-line-chart__explanation')?.open).toBe(false);
  });

  it('uses one action-strip control per explanation and glossary with change events', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.definitions = [{ id: 'one', label: 'Term', definition: 'Meaning' }];
    element.data = [{ x: 'Q1', actual: 1, target: 2 }]; document.body.append(element); await settle();
    const events: CustomEvent[] = [];
    element.addEventListener('a11y-line-chart-disclosure-change', (event) => events.push(event as CustomEvent));
    const explain = element.querySelector<HTMLButtonElement>('[data-focus-key="explanation-action"]')!;
    expect(explain.getAttribute('aria-controls')).toBe(`${element.instanceId}-explanation`);
    expect(element.querySelector('.a11y-line-chart__explanation summary')).toBeNull();
    explain.click();
    expect(explain.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector<HTMLElement>('.a11y-line-chart__explanation')?.hidden).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]?.detail).toEqual({ disclosure: 'explanation', expanded: true });
  });

  it('toggles the Explain button label with its expanded state', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [{ x: 'Q1', actual: 1, target: 2 }]; document.body.append(element); await settle();
    const explain = element.querySelector<HTMLButtonElement>('[data-focus-key="explanation-action"]')!;
    expect(explain.textContent).toBe('Explain');
    explain.click();
    expect(explain.getAttribute('aria-expanded')).toBe('true');
    expect(explain.textContent).toBe('Hide explanation');
    explain.click();
    expect(explain.getAttribute('aria-expanded')).toBe('false');
    expect(explain.textContent).toBe('Explain');
  });

  it('toggles the Glossary button label with its expanded state', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.definitions = [{ id: 'one', label: 'Term', definition: 'Meaning' }];
    element.data = [{ x: 'Q1', actual: 1, target: 2 }]; document.body.append(element); await settle();
    const glossary = element.querySelector<HTMLButtonElement>('[data-focus-key="glossary-action"]')!;
    expect(glossary.textContent).toBe('Glossary');
    glossary.click();
    expect(glossary.getAttribute('aria-expanded')).toBe('true');
    expect(glossary.textContent).toBe('Hide glossary');
    glossary.click();
    expect(glossary.textContent).toBe('Glossary');
  });

  it('reflects the locale attribute through the locale property', () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    expect(element.locale).toBe('en-US');
    element.locale = 'fr-FR';
    expect(element.getAttribute('locale')).toBe('fr-FR');
    expect(element.locale).toBe('fr-FR');
    element.locale = '';
    expect(element.hasAttribute('locale')).toBe(false);
    expect(element.locale).toBe('en-US');
    element.setAttribute('locale', 'de-DE');
    expect(element.locale).toBe('de-DE');
  });

  it('dispatches an invalid-messages error with the localized message', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [{ x: 2024, actual: 72, target: 80 }];
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-error', listener);
    document.body.append(element);
    await settle();
    element.setAttribute('messages', '{bad json');
    await settle();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].detail).toEqual({
      code: 'invalid-messages',
      message: ENGLISH_LINE_CHART_MESSAGES.invalidMessages
    });
    expect(listener.mock.calls[0]?.[0].bubbles).toBe(true);
  });

  it('emits only real data-view transitions and closes the open view when dataView becomes none', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { dataView: 'inline', showActions: false, showControls: false };
    element.data = [{ x: 'Q1', actual: 1, target: 2 }]; document.body.append(element); await settle();
    const events: CustomEvent[] = [];
    element.addEventListener('a11y-line-chart-data-view-change', (event) => events.push(event as CustomEvent));
    const details = element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')!;
    details.open = true; await settle();
    expect(events.map((event) => event.detail)).toEqual([{ open: true, dataView: 'inline' }]);
    element.config = { ...element.config, dataView: 'none' }; await settle();
    expect(events.map((event) => event.detail)).toEqual([{ open: true, dataView: 'inline' }, { open: false, dataView: 'inline' }]);
    expect(element.querySelector('table')).toBeNull();
    element.config = { ...element.config, dataView: 'inline' }; await settle();
    expect(element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')?.open).toBe(false);
    expect(events).toHaveLength(2);
  });

  it('emits an error for reversed range bounds and recovers with valid data', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-error', listener);
    document.body.append(element);
    element.data = [{ x: 2025, actual: 75, target: { min: 80, max: 70 } }];
    await settle();
    expect(listener.mock.calls[0]?.[0].detail.code).toBe('invalid-data');
    expect(element.textContent).toContain('min <= max');
    element.data = [{ x: 2025, actual: 75, target: { min: 70, max: 80 } }];
    await settle();
    expect(element.textContent).toContain('within range');
    expect(element.textContent).not.toContain('min <= max');
  });

  it('registers idempotently as an autonomous custom element', () => {
    expect(() => defineA11yLineChart()).not.toThrow();
    expect(customElements.get(A11Y_LINE_CHART_TAG_NAME)).toBe(
      A11yLineChartElement
    );
  });

  it('renders in Light DOM and preserves authored children', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME);
    const authored = document.createElement('p');
    authored.dataset['consumerContent'] = 'true';
    authored.textContent = 'Authored fallback content';
    element.append(authored);
    document.body.append(element);
    await settle();

    expect(element.shadowRoot).toBeNull();
    expect(element.querySelector('[data-consumer-content]')).toBe(authored);
    expect(element.querySelector('[data-a11y-line-chart-owned]')).not.toBeNull();
  });

  it('provides an explanatory empty state', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME);
    document.body.append(element);
    await settle();

    expect(element.textContent).toContain('No chart data is available');
    expect(element.textContent).toContain('Provide at least one data point');
  });

  it('updates its accessible table when data is replaced', async () => {
    const element = document.createElement(
      A11Y_LINE_CHART_TAG_NAME
    ) as A11yLineChartElement;
    document.body.append(element);
    element.data = [{ x: 2024, actual: 72.5, target: 80 }];
    await settle();

    expect(element.querySelector('tbody')?.textContent).toContain('2024');
    expect(element.querySelector('tbody')?.textContent).toContain('73%');

    element.data = [{ x: 2030, actual: 90, target: null }];
    await settle();

    expect(element.querySelector('tbody')?.textContent).not.toContain('2024');
    expect(element.querySelector('tbody')?.textContent).toContain('2030');
    expect(element.querySelector('tbody')?.textContent).toContain('Not reported');
  });

  it('restores the one-tab-stop keyboard model and announces point changes', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [
      { x: 2024, actual: 72, target: 80 },
      { x: 2025, actual: 85, target: 80 },
      { x: 2026, actual: 80, target: 80 }
    ];
    const pointListener = vi.fn();
    element.addEventListener('a11y-line-chart-point-change', pointListener);
    document.body.append(element);
    await settle();

    const navigator = element.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');
    expect(navigator?.type).toBe('range');
    expect(navigator?.getAttribute('aria-valuetext')).toContain('2024');

    navigator?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(navigator?.value).toBe('1');
    expect(navigator?.getAttribute('aria-valuetext')).toContain('5 percentage points above target');
    expect(element.querySelector('[aria-live="polite"]')?.textContent).toContain('2025');
    expect(pointListener).toHaveBeenCalled();

    navigator?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(navigator?.value).toBe('2');
  });

  it('supports wraparound and emits framework-neutral control changes', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { wrapAround: true };
    element.data = [{ x: 2024, actual: 72, target: 80 }, { x: 2025, actual: 85, target: 80 }];
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-settings-change', listener);
    document.body.append(element);
    await settle();

    const navigator = element.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');
    navigator?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(navigator?.value).toBe('1');

    const labelToggle = element.querySelector<HTMLInputElement>('[data-control="showActualValues"]');
    labelToggle?.click();
    await settle();
    expect(element.config.showActualValues).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0].detail).toEqual({ setting: 'showActualValues', value: true, source: 'controls' });
  });

  it('exposes end-user Y-axis zoom and fill-pattern controls', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [{ x: 2024, actual: 72, target: 80 }, { x: 2025, actual: 85, target: 82 }];
    document.body.append(element);
    await settle();

    const zoom = element.querySelector<HTMLInputElement>('[data-control="initialZoomY"]');
    const actualPattern = element.querySelector<HTMLSelectElement>('[data-control="actualPattern"]');
    expect(zoom?.checked).toBe(false);
    expect(actualPattern?.value).toBe('none');

    zoom?.click();
    await settle();
    expect(element.config.initialZoomY).toBe(true);

    if (actualPattern) {
      actualPattern.value = 'diagonal';
      actualPattern.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await settle();
    expect(element.config.actualPattern).toBe('diagonal');
  });

  it('provides touch-safe period controls that use the canonical selection path', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { stepperVisibility: 'always' };
    element.data = [
      { x: 2024, actual: 72, target: 80 },
      { x: 2025, actual: 85, target: 80 },
      { x: 2026, actual: 80, target: 80 }
    ];
    const pointListener = vi.fn();
    element.addEventListener('a11y-line-chart-point-change', pointListener);
    document.body.append(element);
    await settle();

    const stepper = element.querySelector<HTMLElement>('.a11y-line-chart__stepper');
    const previous = element.querySelector<HTMLButtonElement>('[data-stepper-direction="previous"]');
    const next = element.querySelector<HTMLButtonElement>('[data-stepper-direction="next"]');
    const status = element.querySelector<HTMLElement>('.a11y-line-chart__stepper-status');
    const navigator = element.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');

    expect(stepper?.hidden).toBe(false);
    expect(stepper?.getAttribute('aria-label')).toBe('Chart period navigation');
    expect(status?.textContent).toBe('2024 · 1 of 3');
    expect(previous?.disabled).toBe(true);
    expect(next?.getAttribute('aria-label')).toBe('Next period, 2025');

    next?.click();
    expect(navigator?.value).toBe('1');
    expect(status?.textContent).toBe('2025 · 2 of 3');
    expect(previous?.getAttribute('aria-label')).toBe('Previous period, 2024');
    expect(next?.getAttribute('aria-label')).toBe('Next period, 2026');
    expect(pointListener).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({ index: 1, x: 2025 })
    }));

    next?.click();
    expect(status?.textContent).toBe('2026 · 3 of 3');
    expect(next?.disabled).toBe(true);
  });

  it('applies wraparound to the visible period controls', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { stepperVisibility: 'always', wrapAround: true };
    element.data = [
      { x: 2024, actual: 72, target: 80 },
      { x: 2025, actual: 85, target: 80 }
    ];
    document.body.append(element);
    await settle();

    const previous = element.querySelector<HTMLButtonElement>('[data-stepper-direction="previous"]');
    const next = element.querySelector<HTMLButtonElement>('[data-stepper-direction="next"]');
    const status = element.querySelector<HTMLElement>('.a11y-line-chart__stepper-status');

    expect(previous?.disabled).toBe(false);
    expect(previous?.getAttribute('aria-label')).toBe('Previous period, 2025');
    previous?.click();
    expect(status?.textContent).toBe('2025 · 2 of 2');
    expect(next?.disabled).toBe(false);
    expect(next?.getAttribute('aria-label')).toBe('Next period, 2024');
    next?.click();
    expect(status?.textContent).toBe('2024 · 1 of 2');
  });

  it('shows the default automatic stepper only when the chart overflows', async () => {
    const frameSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('a11y-line-chart__viewport') ? 320 : 0;
    });
    const scrollWidthSpy = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('a11y-line-chart__viewport') ? 720 : 0;
    });

    try {
      const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
      element.data = [{ x: 2024, actual: 72, target: 80 }];
      document.body.append(element);
      await settle();

      expect(element.querySelector<HTMLElement>('.a11y-line-chart__stepper')?.hidden).toBe(false);
      expect(element.querySelector(`#${element.instanceId}-scroll-help`)?.hasAttribute('hidden')).toBe(false);
    } finally {
      frameSpy.mockRestore();
      clientWidthSpy.mockRestore();
      scrollWidthSpy.mockRestore();
    }
  });

  it('allows consumers to suppress the period stepper', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { stepperVisibility: 'never' };
    element.data = [{ x: 2024, actual: 72, target: 80 }];
    document.body.append(element);
    await settle();

    expect(element.querySelector('.a11y-line-chart__stepper')).toBeNull();
  });

  it('accepts the Angular year contract and direct sizing inputs', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.a11y = { decimalPlaces: 2, dataView: 'none' };
    element.minWidth = 640;
    element.dynamicMinWidth = true;
    element.perPointMinWidth = 80;
    element.data = [{ year: 2024, actual: 72.5, target: 80 }];
    document.body.append(element);
    await settle();

    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('.a11y-line-chart__data-action')).toBeNull();
    expect(element.querySelector('.a11y-line-chart__table-region')).toBeNull();
    expect((element.querySelector('.a11y-line-chart__resizable') as HTMLElement).style.minWidth).toBe('320px');
    expect(element.minWidth).toBe(640);
  });

  it('generates unique instance relationships', async () => {
    const first = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const second = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    first.data = [{ x: 2024, actual: 72.5, target: 80 }];
    second.data = [{ x: 2025, actual: 75, target: 82 }];
    document.body.append(first, second);
    await settle();

    const ids = [...document.querySelectorAll<HTMLElement>('[id]')].map(
      (node) => node.id
    );
    expect(new Set(ids).size).toBe(ids.length);

    for (const element of [first, second]) {
      const root = element.querySelector('.a11y-line-chart__root');
      const labelledBy = root?.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(element.querySelector(`#${labelledBy}`)).not.toBeNull();
    }
  });

  it('renders a recoverable error and emits a framework-neutral event', async () => {
    const element = document.createElement(
      A11Y_LINE_CHART_TAG_NAME
    ) as A11yLineChartElement;
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-error', listener);
    document.body.append(element);

    element.data = [{ x: 2024, actual: Number.NaN, target: 80 }];
    await settle();

    expect(listener).toHaveBeenCalledOnce();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Check the data supplied to the chart'
    );
  });

  it('describes the baseline once on the chart without repeating it in period announcements', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { decimalPlaces: 2, dataView: 'inline' };
    element.baseline = {
      x: 2015,
      value: 38,
      explanation: 'A new reporting policy took effect.'
    };
    element.data = [
      { x: 2015, actual: 40, target: 50 },
      { x: 2020, actual: 83.92, target: 77.02 },
      { x: 2021, actual: null, target: 78.27 }
    ];
    const pointListener = vi.fn();
    element.addEventListener('a11y-line-chart-point-change', pointListener);
    document.body.append(element);
    await settle();

    const summary = element.querySelector('.a11y-line-chart__summary');
    expect(summary?.querySelector('strong')?.textContent).toBe('Target met in 2020.');
    expect(summary?.textContent).toContain('45.92 percentage points above the 2015 baseline of 38.00%');
    expect(summary?.textContent).toContain('A new reporting policy took effect.');
    const chartGroup = element.querySelector('.a11y-line-chart__chart-group');
    const baselineDescriptionId = chartGroup?.getAttribute('aria-describedby');
    expect(baselineDescriptionId).toBe(`${element.instanceId}-baseline-description`);
    expect(element.querySelector(`#${baselineDescriptionId}`)?.textContent).toBe(
      'Baseline: 2015, 38.00%. A new reporting policy took effect.'
    );
    expect(element.querySelector('caption')?.textContent).toContain('Baseline: 2015, 38.00%');
    expect(element.querySelector('thead')?.textContent).toContain('Target outcome');
    expect(element.querySelector('thead')?.textContent).toContain('Change from baseline');

    const navigator = element.querySelector<HTMLInputElement>('.a11y-line-chart__navigator');
    navigator?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(navigator?.getAttribute('aria-valuetext')).not.toContain('baseline');
    const detail = pointListener.mock.calls[0]?.[0].detail;
    expect(detail).toMatchObject({
      outcome: 'met',
      outcomeLabel: 'Target met',
      baselineDifference: { signedValue: 45.92 }
    });
    expect(detail.targetDifference.signedValue).toBeCloseTo(6.9);
  });

  it('reports an invalid baseline without suppressing the chart data', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    const listener = vi.fn();
    element.addEventListener('a11y-line-chart-error', listener);
    element.baseline = { x: 2014, value: 38 };
    element.data = [{ x: 2015, actual: 40, target: 50 }];
    document.body.append(element);
    await settle();

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({ code: 'invalid-baseline' })
    }));
    expect(element.querySelector('[role="status"]')?.textContent).toContain('must match the earliest displayed data period');
    expect(element.querySelector('tbody')?.textContent).toContain('2015');
    expect(element.querySelector('.a11y-line-chart__summary')?.textContent).not.toContain('baseline of');
  });

  it('applies structured consumer labels and formatters consistently', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = {
      actualSeriesLabel: 'Performance',
      baselineSeriesLabel: 'Starting point',
      contextNote: 'Values are reported as service points.',
      decimalPlaces: 1,
      targetSeriesLabel: 'Goal',
      valuePreset: 'number'
    };
    element.formatValue = ({ value }) => value === null ? 'None' : `${value.toFixed(1)} pts`;
    element.formatDifference = ({ value }) => `${value.toFixed(1)} points`;
    element.formatXValue = (value) => `FY ${String(value)}`;
    element.baseline = { x: 1, value: 4 };
    element.data = [
      { x: 1, actual: 5, target: 6 },
      { x: 2, actual: 8, target: 7 }
    ];
    document.body.append(element);
    await settle();

    const summary = element.querySelector('.a11y-line-chart__summary')?.textContent;
    expect(summary).toContain('Target met in FY 2.');
    expect(summary).toContain('Performance was 8.0 pts. Goal was 7.0 pts—1.0 points above goal.');
    expect(summary).toContain('4.0 points above the FY 1 starting point of 4.0 pts');
    expect(summary).toContain('Values are reported as service points.');
    expect(element.querySelector('caption')?.textContent).toContain('Starting point: FY 1, 4.0 pts');
  });

  it('falls back to canonical formatting when a formatter fails', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { decimalPlaces: 1 };
    element.formatValue = () => { throw new Error('consumer formatter failed'); };
    element.formatDifference = () => '';
    element.formatXValue = () => '';
    element.data = [{ x: 2020, actual: 83.9, target: 77 }];
    document.body.append(element);
    await settle();

    expect(element.querySelector('.a11y-line-chart__summary')?.textContent).toContain(
      'Target met in 2020. Actual was 83.9%. Target was 77.0%—6.9 percentage points above target.'
    );
  });

  it('exports complete messages and localizes generated, control, and tooltip semantics at runtime', async () => {
    expect(Object.keys(ENGLISH_LINE_CHART_MESSAGES)).toContain('baselineDescription');
    expect(Object.keys(ENGLISH_LINE_CHART_MESSAGES)).toContain('dataUpdated.other');
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.messages = {
      title: 'Resultados', actualLabel: 'Real', targetLabel: 'Meta', baselineLabel: 'Inicio',
      dataAction: 'Datos', outcomeMet: 'Meta alcanzada', outcomeNotMet: 'Meta pendiente',
      'summaryPeriods.one': 'Se cumplio {met} de {total} periodo.',
      'summaryPeriods.other': 'Se cumplieron {met} de {total} periodos.',
      tooltipActual: '{value} — {series}',
      valuesLegend: 'Medidas'
    };
    element.data = [{ x: '2024', actual: 90, target: 80 }, { x: '2025', actual: 70, target: 80 }];
    document.body.append(element);
    await settle();
    expect(element.querySelector('h2')?.textContent).toBe('Resultados');
    expect(element.querySelector('.a11y-line-chart__summary')?.textContent).toContain('Meta pendiente');
    expect(element.textContent).toContain('Datos');
    expect(element.textContent).toContain('Medidas');
    expect(element.messages.title).toBe('Resultados');
    element.messages = { ...element.messages, title: 'Nuevos resultados' };
    await settle();
    expect(element.querySelector('h2')?.textContent).toBe('Nuevos resultados');
  });

  it('accepts declarative message JSON and explains malformed JSON without leaving stale UI', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [{ x: 2026, actual: 1, target: 1 }];
    element.setAttribute('messages', '{"dataAction":"Données"}');
    document.body.append(element);
    await settle();
    expect(element.textContent).toContain('Données');
    element.setAttribute('messages', '{bad json');
    await settle();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('valid JSON');
    expect(element.querySelector('h2')?.textContent).toBe('Actual vs Target Performance');
  });

  it('keeps malformed translation errors in the current message language', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [{ x: 2024, actual: 72, target: 80 }];
    element.messages = { invalidMessages: 'Les traductions doivent être un objet JSON valide.' };
    document.body.append(element);
    await settle();
    element.setAttribute('messages', '{bad json');
    await settle();
    expect(element.querySelector('[role="alert"]')?.textContent).toBe('Les traductions doivent être un objet JSON valide.');
    expect(element.messages.invalidMessages).toBe('Les traductions doivent être un objet JSON valide.');
    element.messages = { invalidMessages: 'Las traducciones deben ser un objeto JSON válido.' };
    element.setAttribute('messages', '[]');
    await settle();
    expect(element.querySelector('[role="alert"]')?.textContent).toBe('Las traducciones deben ser un objeto JSON válido.');
    element.removeAttribute('messages');
    await settle();
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('localizes percent affixes and refreshes existing validation diagnostics when messages change', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { locale: 'de-DE', decimalPlaces: 2 };
    element.data = [{ x: '2024', actual: 72.5, target: 80 }];
    document.body.append(element);
    await settle();
    expect(element.querySelector('.a11y-line-chart__summary')?.textContent).toContain('72,50');
    expect(element.querySelector('.a11y-line-chart__summary')?.textContent).toContain('%');

    element.data = [{ actual: 1, target: 2 } as never];
    await settle();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('requires a valid x');
    element.messages = { validationDataX: 'Datensatz {index}: Zeitraum fehlt.' };
    await settle();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Datensatz 1: Zeitraum fehlt.');
  });

  it('keeps the same modal and focused close control during live data updates', async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (this: HTMLDialogElement) {
      this.open = true; this.setAttribute('open', '');
    });
    const closeDialog = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (this: HTMLDialogElement) {
      this.open = false; this.removeAttribute('open');
    });
    try {
      const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
      element.config = { dataView: 'dialog' };
      element.data = [{ x: 2024, actual: 72, target: 80 }];
      document.body.append(element);
      await settle();
      const dialog = element.querySelector('dialog')!;
      const live = element.querySelector('[aria-live="polite"]')!;
      const action = element.querySelector<HTMLButtonElement>('.a11y-line-chart__data-action')!;
      action.click();
      const close = dialog.querySelector<HTMLButtonElement>('.a11y-line-chart__dialog-close')!;
      close.focus();
      expect(dialog.open).toBe(true);
      expect(element.querySelector('[aria-live="polite"]')?.textContent).toBe('');
      element.data = [{ x: 2025, actual: 90, target: 80 }];
      await settle();
      expect(element.querySelector('dialog')).toBe(dialog);
      expect(dialog.open).toBe(true);
      expect(dialog.querySelector('.a11y-line-chart__dialog-close')).toBe(close);
      expect(document.activeElement).toBe(close);
      expect(dialog.querySelector('tbody')?.textContent).toContain('2025');
      expect(element.querySelector('[aria-live="polite"]')?.textContent).toContain('Chart data updated');
      expect(element.querySelector('[aria-live="polite"]')).toBe(live);
      element.data = [];
      await settle();
      expect(element.querySelector('dialog')).toBe(dialog);
      expect(dialog.open).toBe(true);
      expect(dialog.querySelector('[role="alert"]')?.textContent).toContain('No chart data');
      expect(element.querySelector('[aria-live="polite"]')).toBe(live);
      element.data = [{} as never];
      await settle();
      expect(dialog.querySelector('[role="alert"]')?.textContent).toContain('requires a valid x');
      expect(element.querySelector('[aria-live="polite"]')).toBe(live);
      element.data = [{ x: 2026, actual: 90, target: 80 }];
      await settle();
      expect(dialog.querySelector('tbody')?.textContent).toContain('2026');
      expect(element.querySelector('[aria-live="polite"]')).toBe(live);
      expect(showModal).toHaveBeenCalledTimes(1);

      const exportButton = dialog.querySelector<HTMLButtonElement>('.a11y-line-chart__export')!;
      exportButton.focus();
      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      exportButton.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(close);
      const reverseTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      close.dispatchEvent(reverseTab);
      expect(reverseTab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(exportButton);

      element.config = { ...element.config, dataView: 'inline' };
      await settle();
      const disclosure = element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')!;
      expect(dialog.open).toBe(false);
      expect(disclosure.open).toBe(true);
      expect(document.activeElement).toBe(disclosure.querySelector('summary'));
    } finally {
      showModal.mockRestore();
      closeDialog.mockRestore();
    }
  });

  it('restores focus to the current data action after Escape closes a live-updated modal', async () => {
    vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (this: HTMLDialogElement) {
      this.open = true;
    });
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.data = [{ x: 2024, actual: 72, target: 80 }];
    document.body.append(element);
    await settle();
    const originalAction = element.querySelector<HTMLButtonElement>('.a11y-line-chart__data-action')!;
    originalAction.click();
    element.data = [{ x: 2025, actual: 90, target: 80 }];
    await settle();
    const currentAction = element.querySelector<HTMLButtonElement>('.a11y-line-chart__data-action')!;
    const dialog = element.querySelector('dialog')!;
    const close = dialog.querySelector<HTMLButtonElement>('.a11y-line-chart__dialog-close')!;
    expect(currentAction).not.toBe(originalAction);
    close.focus();
    // Native Escape dispatches cancel before it removes the modal state.
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await settle();
    expect(document.activeElement).toBe(close);
    dialog.open = false;
    dialog.dispatchEvent(new Event('close'));
    expect(document.activeElement).toBe(currentAction);
  });

  it('renders inline data as a native disclosure and closes a modal on mode change', async () => {
    const element = document.createElement(A11Y_LINE_CHART_TAG_NAME) as A11yLineChartElement;
    element.config = { dataView: 'inline' };
    element.data = [{ x: 2024, actual: 72, target: 80 }];
    document.body.append(element);
    await settle();
    expect(element.querySelector('details.a11y-line-chart__inline-data')).not.toBeNull();
    expect(element.querySelector('details tbody')?.textContent).toContain('2024');
    expect(element.querySelector('.a11y-line-chart__table-region--visually-hidden')).not.toBeNull();
    const details = element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')!;
    details.open = true;
    element.messages = { inlineData: 'Ver la tabla' };
    await settle();
    expect(element.querySelector<HTMLDetailsElement>('.a11y-line-chart__inline-data')?.open).toBe(true);
    element.config = { dataView: 'dialog' };
    await settle();
    expect(element.querySelector('.a11y-line-chart__data-action')?.textContent).toBe('View complete data');
  });
});

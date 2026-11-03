import { afterEach, describe, expect, it } from 'vitest';
import { A11yBarChartElement } from '../src/a11y-bar-chart-element.js';
import { A11yBarChartGroupElement } from '../src/a11y-bar-chart-group-element.js';
import type { BarViewSection } from '../src/grouped-model.js';

if (!customElements.get('a11y-bar-chart')) customElements.define('a11y-bar-chart', A11yBarChartElement);
if (!customElements.get('a11y-bar-chart-group')) customElements.define('a11y-bar-chart-group', A11yBarChartGroupElement);

function view(id: string, label: string, count: number) {
  return { id, label, chartTitle: `${label} results`, data: [{ id: 'home', label: 'Home', value: count, target: { min: 1, max: 3 } }], total: count, filtered: false, suppressed: false };
}
function sections(): BarViewSection[] {
  return [
    { id: 'age', label: 'Age group', allViewId: 'age-all', description: 'Choose an age group.', views: [view('age-all', 'All ages', 10), { ...view('adult', 'Adults', 6), definition: 'People age 18 and older.' }] },
    { id: 'race', label: 'Race and ethnicity', allViewId: 'race-all', views: [view('race-all', 'All groups', 20), view('home', 'Home', 12)] }
  ];
}
function tick(): Promise<void> { return new Promise((resolve) => queueMicrotask(resolve)); }

describe('a11y-bar-chart-group', () => {
  const hosts: A11yBarChartGroupElement[] = [];
  function mount(data = sections()): A11yBarChartGroupElement {
    const host = document.createElement('a11y-bar-chart-group') as A11yBarChartGroupElement;
    hosts.push(host); host.sections = data; document.body.append(host); return host;
  }
  afterEach(() => { for (const host of hosts.splice(0)) host.remove(); });

  it('uses a persistent chart and updates the prepared view when a radio changes', async () => {
    const host = mount();
    const chart = host.querySelector('a11y-bar-chart') as A11yBarChartElement;
    const events: unknown[] = [];
    host.addEventListener('a11y-bar-chart-group-selection-change', (event) => events.push((event as CustomEvent).detail));
    host.querySelector<HTMLInputElement>('input[value="adult"]')!.click();
    await tick();
    expect(host.querySelector('a11y-bar-chart')).toBe(chart);
    expect(chart.data[0]?.value).toBe(6);
    expect(chart.chartTitle).toBe('Adults results');
    expect(events).toEqual([{ sectionId: 'age', viewId: 'adult', origin: 'user' }]);
    expect(host.querySelector('#' + host.querySelector<HTMLInputElement>('input[value="adult"]')!.getAttribute('aria-describedby'))?.textContent).toBe('People age 18 and older.');
  });

  it('activates another section at All, and collapse preserves the selected view', () => {
    const host = mount();
    host.querySelector<HTMLInputElement>('input[value="adult"]')!.click();
    host.querySelector<HTMLButtonElement>('[data-section="race"]')!.click();
    expect(host.selectedSectionId).toBe('race');
    expect(host.selectedViewId).toBe('race-all');
    host.querySelector<HTMLInputElement>('input[value="home"]')!.click();
    host.querySelector<HTMLButtonElement>('[data-section="race"]')!.click();
    expect(host.selectedViewId).toBe('home');
    expect(host.querySelectorAll<HTMLFieldSetElement>('.a11y-bar-chart-group__fieldset')[1]!.hidden).toBe(true);
  });

  it('retains stable selection on localized replacement and chooses deterministic All on removal', () => {
    const host = mount();
    host.selectedViewId = 'adult';
    const focusedRadio = host.querySelector<HTMLInputElement>('input[value="adult"]')!;
    focusedRadio.focus();
    const replacement = sections().map((section) => ({ ...section, label: `FR ${section.label}`, views: section.views.map((item) => ({ ...item, label: `FR ${item.label}` })) }));
    host.sections = replacement;
    expect(host.selectedViewId).toBe('adult');
    expect(host.querySelector<HTMLInputElement>('input[value="adult"]')?.checked).toBe(true);
    expect(document.activeElement).toBe(host.querySelector<HTMLInputElement>('input[value="adult"]'));
    host.sections = sections().map((section) => ({ ...section, views: section.views.filter((item) => item.id !== 'adult') }));
    expect(host.selectedSectionId).toBe('age');
    expect(host.selectedViewId).toBe('age-all');
  });

  it('copies data and reports invalid sections visibly without putting invalid values in the chart', () => {
    const input = sections();
    const source = input[0]!.views[0]!.data[0]!;
    const host = mount(input);
    source.target && typeof source.target === 'object' && (source.target.min = 99);
    expect((host.querySelector('a11y-bar-chart') as A11yBarChartElement).data[0]?.target).toEqual({ min: 1, max: 3 });
    host.sections = [{ ...input[0]!, views: [view('dupe', 'One', 1), view('dupe', 'Two', 2)] }];
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('population views are invalid');
    expect((host.querySelector('a11y-bar-chart') as A11yBarChartElement).data).toEqual([]);
    expect((host.querySelector('a11y-bar-chart') as A11yBarChartElement).hidden).toBe(true);
    host.theme = { color: 'rebeccapurple' };
    expect((host.querySelector('a11y-bar-chart') as A11yBarChartElement).hidden).toBe(true);
  });

  it('renders a localized empty state and resolves disclosure control IDs uniquely per instance', () => {
    const first = mount(); const second = mount();
    first.groupMessages = { empty: 'Aucun résultat', collapseSection: 'Masquer {label}', expandSection: 'Afficher {label}', selectorLabel: 'Choisir une vue' };
    first.sections = [];
    expect(first.textContent).toContain('Aucun résultat');
    const ids = [...first.querySelectorAll('[aria-controls]')].map((button) => button.getAttribute('aria-controls'));
    expect(new Set(ids).size).toBe(ids.length);
    for (const button of [...first.querySelectorAll('[aria-controls]'), ...second.querySelectorAll('[aria-controls]')]) {
      expect(document.getElementById(button.getAttribute('aria-controls')!)).not.toBeNull();
    }
  });

  it('allows repeated view IDs in separate sections, preserves authored All labels, and appends around host content', () => {
    const host = document.createElement('a11y-bar-chart-group') as A11yBarChartGroupElement;
    const authored = document.createElement('p'); authored.textContent = 'Host content'; host.append(authored);
    hosts.push(host); document.body.append(host);
    const data = sections().map((section) => section.id === 'race'
      ? { ...section, views: section.views.map((item) => item.id === 'home' ? { ...item, id: 'adult', label: 'All is a category' } : item) }
      : section);
    host.sections = data;
    expect(host.textContent).toContain('All ages');
    expect(host.textContent).toContain('Host content');
    expect(new Set([...host.querySelectorAll<HTMLInputElement>('input')].map((input) => input.id)).size).toBe(host.querySelectorAll('input').length);
  });

  it('keeps a null prepared total unknown when positive visible rows exist', async () => {
    const host = mount([{ id: 'unknown', label: 'Unknown total', allViewId: 'unknown-all', views: [{ ...view('unknown-all', 'Unknown population', 10), total: null }] }]);
    await tick();
    const chart = host.querySelector('a11y-bar-chart') as A11yBarChartElement;
    expect(chart.config.inferTotal).toBe(false);
    expect(chart.total).toBeNull();
    expect(host.textContent).toContain('Unavailable');
  });

  it('uses a prepared view empty message when the selection has no data', async () => {
    const host = mount([{ id: 'empty', label: 'Empty', allViewId: 'empty-all', views: [{ ...view('empty-all', 'No matches', 0), data: [], total: null, emptyMessage: 'No records match this selection.' }] }]);
    await tick();
    expect(host.querySelector('a11y-bar-chart')?.textContent).toContain('No records match this selection.');
  });

  it('renders rich filter definitions through the shared allowlist', () => {
    const host = mount([{ id: 'topic', label: 'Topic', allViewId: 'topic-all', views: [
      { ...view('topic-all', 'All topics', 4), definition: '<p>Read <strong>the guide</strong>.<script>window.badDefinition = true</script></p>' }
    ] }]);
    const definition = host.querySelector('.a11y-bar-chart-group__definition')!;
    expect(definition.querySelector('strong')?.textContent).toBe('the guide');
    expect(definition.querySelector('script')).toBeNull();
    expect(definition.textContent).toContain('Read the guide.');
  });

  it('keeps focus inside its owner and restores a local control when the focused option is removed', () => {
    const first = mount(); const second = mount();
    const firstRadio = first.querySelector<HTMLInputElement>('input[value="adult"]')!;
    firstRadio.focus();
    second.selectedViewId = 'home';
    expect(document.activeElement).toBe(firstRadio);

    first.selectedViewId = 'adult';
    first.querySelector<HTMLInputElement>('input[value="adult"]')!.focus();
    first.sections = sections().map((section) => ({ ...section, views: section.views.filter((item) => item.id !== 'adult') }));
    expect(document.activeElement).toBe(first.querySelector<HTMLInputElement>('input[value="age-all"]'));
  });

  it('moves owned focus to visible empty and error feedback without stealing outside focus', async () => {
    const host = mount();
    const outside = document.createElement('button'); outside.textContent = 'Outside'; document.body.append(outside);
    hosts.push(host);
    host.querySelector<HTMLInputElement>('input[value="adult"]')!.focus();
    host.sections = [];
    await tick();
    expect(document.activeElement).toBe(host.querySelector('.a11y-bar-chart-group__empty'));

    host.sections = sections();
    outside.focus();
    host.sections = [{ ...sections()[0]!, views: [view('duplicate', 'One', 1), view('duplicate', 'Two', 2)] }];
    expect(document.activeElement).toBe(outside);

    host.sections = sections();
    host.querySelector<HTMLInputElement>('input[value="age-all"]')!.focus();
    host.sections = [{ ...sections()[0]!, views: [view('duplicate', 'One', 1), view('duplicate', 'Two', 2)] }];
    await tick();
    expect(document.activeElement).toBe(host.querySelector('[role="alert"]'));
    outside.remove();
  });
});

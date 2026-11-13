import { describe, it, expect, vi } from 'vitest';
import { prepareBarViewSection, type PrepareBarViewsOptions } from '../src/prepare-views.js';
const fixture = (): PrepareBarViewsOptions => ({
  id: 'ages', label: 'Age', all: { id: 'everyone', label: 'All ages', total: 510 },
  options: [{ id: 'young', label: 'Birth to 1', total: 102 }, { id: 'older', label: '1 to 2' }],
  records: [{ filterId: 'young', id: 'home', label: 'Home', value: 102 },
    { filterId: 'older', id: 'home', label: 'Home', value: 220 },
    { filterId: 'older', id: 'other', label: 'Other', value: null }]
});
describe('population view preparation', () => {
  it('rejects preaggregated All records to avoid counting the population twice', () => {
    const input = fixture();
    input.records = [...input.records, { filterId: input.all.id, id: 'home', label: 'Home', value: 322 }];
    expect(() => prepareBarViewSection(input)).toThrow(/individual option/);
  });
  it('keeps authoritative denominators and source records independent', () => {
    const input = fixture(); const original = structuredClone(input);
    const contexts: unknown[] = [];
    input.describe = context => { contexts.push(context); return { chartTitle: context.option.label, context: String(context.populationShare) }; };
    const result = prepareBarViewSection(input);
    expect(result.views[0]!.data[0]!.value).toBe(322);
    expect(result.views[1]!.total).toBe(102);
    expect(result.views[1]!.context).toBe('0.2');
    expect(result.views[2]!.total).toBeNull();
    expect(JSON.stringify([result, contexts])).not.toContain('789');
    expect(result.views[0]!.data.find(row => row.id === 'other')).toMatchObject({ value: null });
    expect(input.records).toEqual(original.records);
  });
  it('turns an aggregate with any suppressed zero into a protected zero and never sums it into a count', () => {
    const input = fixture();
    input.records = [...input.records,
      { filterId: 'young', id: 'zero', label: 'Zero', value: 0 },
      { filterId: 'older', id: 'zero', label: 'Zero', value: 5 },
      { filterId: 'young', id: 'missing', label: 'Missing', value: null }];
    input.suppressed = true;
    const result = prepareBarViewSection(input);
    expect(result.views[0]!.data.find(row => row.id === 'zero')).toMatchObject({ value: 0 });
    expect(result.views[0]!.data.find(row => row.id === 'home')).toMatchObject({ value: 322 });
    expect(result.views[1]!.data.find(row => row.id === 'zero')).toMatchObject({ value: 0 });
    expect(result.views[1]!.data.find(row => row.id === 'missing')).toMatchObject({ value: null });
    expect(result.views[1]!.suppressed).toBe(true);
    expect(result.views[1]!.total).toBe(102); // authored population total stays authoritative
  });

  it('sums zero counts as ordinary reported values when suppression is off', () => {
    const input = fixture();
    input.records = [...input.records,
      { filterId: 'young', id: 'zero', label: 'Zero', value: 0 },
      { filterId: 'older', id: 'zero', label: 'Zero', value: 5 }];
    const result = prepareBarViewSection(input);
    expect(result.views[0]!.data.find(row => row.id === 'zero')).toMatchObject({ value: 5 });
    expect(result.views[1]!.data.find(row => row.id === 'zero')).toMatchObject({ value: 0 });
    expect(result.views[1]!.suppressed).toBe(false);
  });

  it('keeps a protected aggregate protected when a later populated record is added to it', () => {
    const input = fixture();
    input.records = [{ filterId: 'young', id: 'zero', label: 'Zero', value: 0 },
      { filterId: 'older', id: 'zero', label: 'Zero', value: 5 },
      { filterId: 'older', id: 'zero', label: 'Zero', value: 7 }];
    input.suppressed = true;
    const result = prepareBarViewSection(input);
    expect(result.views[0]!.data.find(row => row.id === 'zero')).toMatchObject({ value: 0 });
  });
  it('allows a real option named all, preserves order, and retains external filtering on reset', () => {
    const input = fixture(); input.filtered = true; input.options = [{ id: 'all', label: 'All' }, ...input.options];
    const result = prepareBarViewSection(input);
    expect(result.views.map(view => view.id)).toEqual(['everyone', 'all', 'young', 'older']);
    expect(result.views[0]!.filtered).toBe(true);
    expect(result.views[1]!.data).toEqual([]);
  });
  it('rejects ambiguous identities, invalid totals, and aggregated targets', () => {
    const input = fixture(); input.options = [{ id: 'everyone', label: 'Ambiguous' }];
    expect(() => prepareBarViewSection(input)).toThrow(/unique/);
    const badTotal = fixture(); badTotal.all.total = -1;
    expect(() => prepareBarViewSection(badTotal)).toThrow();
    const targets = fixture(); targets.records[0]!.target = 3;
    expect(() => prepareBarViewSection(targets)).toThrow(/targets/);
  });
  it('rejects undeclared filter IDs and inconsistent repeated category metadata', () => {
    const unknown = fixture(); unknown.records[0]!.filterId = 'missing-option';
    expect(() => prepareBarViewSection(unknown)).toThrow(/individual option/);
    const inconsistent = fixture(); inconsistent.records[1]!.label = 'Different label';
    expect(() => prepareBarViewSection(inconsistent)).toThrow(/consistent labels/);
  });
  it('gives authored callbacks no raw suppressed zero and lets them mutate only copies', () => {
    const input = fixture();
    input.records = [{ filterId: 'young', id: 'private', label: 'Private', value: 0 }];
    input.suppressed = true;
    const callbackRows: unknown[] = [];
    delete input.all.total;
    delete input.options[0]!.total;
    input.describe = ({ data, total, populationTotal, populationShare }) => {
      callbackRows.push({ data, total, populationTotal, populationShare });
      // Mutations to callback data must not alter the prepared view.
      if (data[0]) (data[0] as { value: number | null }).value = 4321;
      return { chartTitle: 'Safe title' };
    };
    const result = prepareBarViewSection(input);
    expect(JSON.stringify(callbackRows)).not.toMatch(/"value":0[,}]/);
    expect(result.views[1]!.data[0]).toMatchObject({ value: 0 });
    expect(result.views[0]!.total).toBeNull();
    expect(result.views[1]!.total).toBeNull();
    expect(result.views[1]!.chartTitle).toBe('Safe title');
  });
  it('keeps authoritative selected totals and unknown totals separate from category sums', () => {
    const input = fixture();
    delete input.all.total;
    input.options[0]!.total = 500;
    const result = prepareBarViewSection(input);
    expect(result.views[0]!.total).toBeNull(); // a suppressed aggregate cannot be reconstructed by summing disclosed rows
    expect(result.views[1]!.total).toBe(500); // authored selected population is authoritative
    expect(result.views[1]!.data.reduce((sum, row) => sum + (row.value ?? 0), 0)).toBe(102);
  });
  it('sorts aggregated rows by descending value with numeric label tie-breaks', () => {
    const input = fixture();
    input.records = [
      { filterId: 'young', id: 'item-10', label: 'Item 10', value: 2 },
      { filterId: 'young', id: 'item-2', label: 'Item 2', value: 5 },
      { filterId: 'young', id: 'item-1', label: 'Item 1', value: 5 },
      { filterId: 'young', id: 'small', label: 'Small', value: 1 }
    ];
    delete input.options[0]!.total;
    input.sort = 'value-descending';
    input.locale = 'not-a-locale';
    const result = prepareBarViewSection(input);
    expect(result.views[0]!.data.map(row => row.id)).toEqual(['item-1', 'item-2', 'item-10', 'small']);
    expect(result.views[1]!.data.map(row => row.id)).toEqual(['item-1', 'item-2', 'item-10', 'small']);
  });
  it('does not let metadata callback extras overwrite prepared IDs, totals, or rows', () => {
    const input = fixture();
    input.describe = () => ({
      chartTitle: 'Safe title',
      data: [{ id: 'injected', label: 'Injected', value: 999 }],
      total: 999,
      suppressed: false,
      filtered: false
    } as never);
    const result = prepareBarViewSection(input);
    expect(result.views[1]).toMatchObject({ id: 'young', total: 102, suppressed: false, filtered: true });
    expect(result.views[1]!.data.map(row => row.id)).toEqual(['home']);
  });
});

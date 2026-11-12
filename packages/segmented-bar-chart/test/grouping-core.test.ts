import { describe, expect, it, vi } from 'vitest';
import { buildSegmentedBarModel, buildSegmentedBarCsv } from '../src/core.js';

const data = [5, 1, 4, 2, 3].map((value, i) => ({ id: String(i), label: ['E', 'A', 'D', 'B', 'C'][i]!, value }));

describe('display grouping', () => {
  it('selects the largest three and retains complete source rows and exports', () => {
    const model = buildSegmentedBarModel(data);
    expect(model.displaySegments.map(s => s.kind === 'category' ? s.row.id : s.label)).toEqual(['0', '2', '4', 'Other categories']);
    expect(model.displaySegments[3]).toMatchObject({ value: 3, status: 'reported', ratio: .2 });
    expect(model.rows.map(row => row.id)).toEqual(data.map(row => row.id));
    expect(buildSegmentedBarCsv(model)).toContain('A,1');
  });
  it('only sorts automatically when grouping, with stable ties and locale label order', () => {
    expect(buildSegmentedBarModel(data.slice(0, 4), { config: { segmentOrder: 'label' } }).displaySegments.map(s => s.kind === 'category' ? s.row.id : 'other')).toEqual(['0', '1', '2', '3']);
    expect(buildSegmentedBarModel(data, { config: { segmentOrder: 'label' } }).displaySegments.map(s => s.kind === 'category' ? s.row.id : 'other')).toEqual(['1', '3', '4', 'other']);
    expect(buildSegmentedBarModel(data, { config: { segmentOrder: 'source' } }).displaySegments.map(s => s.kind === 'category' ? s.row.id : 'other')).toEqual(['0', '1', '2', 'other']);
    expect(buildSegmentedBarModel(data.map(d => ({ ...d, value: 1 }))).displaySegments.map(s => s.kind === 'category' ? s.row.id : 'other')).toEqual(['0', '1', '2', 'other']);
  });
  it('honors explicit selection without filling, including empty and absent IDs', () => {
    expect(buildSegmentedBarModel(data.slice(0, 3), { config: { separateCategoryIds: ['2', 'absent'] } }).displaySegments.map(s => s.kind === 'category' ? s.row.id : 'other')).toEqual(['2', 'other']);
    expect(buildSegmentedBarModel(data, { config: { separateCategoryIds: [] } }).displaySegments).toHaveLength(1);
    expect(buildSegmentedBarModel(data.slice(0, 2), { config: { separateCategoryIds: ['1', '0'] } }).displaySegments).toHaveLength(2);
    expect(buildSegmentedBarModel(data, { config: { separateCategoryIds: ['1', '1'] } }).errorCode).toBe('validationInvalidGrouping');
    expect(buildSegmentedBarModel(data, { config: { separateCategoryIds: ['0', '1', '2', '3'] } }).errorCode).toBe('validationInvalidGrouping');
  });
  it('keeps the highlight separate and validates explicit selections', () => {
    const model = buildSegmentedBarModel(data, { config: { highlightedId: '1' } });
    expect(model.errorCode).toBe('validationInvalidGroupingHighlight');
    expect(model.error).toContain('A (1)');
    expect(model.displaySegments.every(s => s.kind === 'category' ? s.row.ratio === 0 : s.ratio === 0)).toBe(true);
    expect(buildSegmentedBarModel(data, { config: { highlightedId: '1', separateCategoryIds: [] } }).errorCode).toBe('validationInvalidGroupingHighlight');
    expect(buildSegmentedBarModel(data, { config: { highlightedId: 'absent' } }).errorCode).toBe('validationInvalidHighlight');
  });
  it('never formats or exposes partial aggregates', () => {
    const formatValue = vi.fn(({ value }: { value: number }) => String(value));
    const model = buildSegmentedBarModel([{ id: 'a', label: 'A', value: 12 }, { id: 'b', label: 'B', value: 999, valueSuppressed: true }, { id: 'c', label: 'C', value: null }], { total: 100, config: { separateCategoryIds: [] }, formatValue });
    expect(model.displaySegments[0]).toMatchObject({ status: 'suppressed', value: null, percentage: null, ratio: 0 });
    expect(formatValue.mock.calls.some(([ctx]) => ctx.value === 999)).toBe(false);
    const incomplete = buildSegmentedBarModel([{ id: 'a', label: 'A', value: 12 }, { id: 'b', label: 'B', value: null }], { total: 100, config: { separateCategoryIds: [] } });
    expect(incomplete.displaySegments[0]).toMatchObject({ status: 'incomplete', value: null, percentage: null, ratio: 0 });
  });
  it('ignores grouping in comparison and handles overflow safely', () => {
    expect(buildSegmentedBarModel(data.slice(0, 1), { total: 5, config: { mode: 'comparison', separateCategoryIds: [] } }).displaySegments[0]!.kind).toBe('category');
    const model = buildSegmentedBarModel(data.slice(0, 2).map(d => ({ ...d, value: Number.MAX_VALUE })), { config: { separateCategoryIds: [] } });
    expect(model.displaySegments[0]).toMatchObject({ value: null, percentage: null, ratio: 0 });
    expect(model.warning).toContain('numeric range');
  });
});

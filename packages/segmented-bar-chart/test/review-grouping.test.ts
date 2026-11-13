import { describe, expect, it, vi } from 'vitest';
import { buildSegmentedBarModel, buildSegmentedBarCsv, type A11ySegmentedBarChartDatum } from '../src/core.js';

const fixture = (length: number): A11ySegmentedBarChartDatum[] => Array.from({ length }, (_, index) => ({
  id: `source-${index}`, label: `Category ${String(length - index).padStart(2, '0')}`, value: ((index * 7) % 13)
}));

describe('grouping review invariants', () => {
  it('partitions original records exactly once without mutating inputs or exceeding four display segments', () => {
    for (const length of [0, 1, 2, 3, 4, 5, 6, 12, 30]) {
      for (const segmentOrder of ['source', 'label', 'value'] as const) {
        for (const separateCategoryIds of [undefined, [], ['source-2'], ['source-7', 'source-1', 'absent']]) {
          const data = fixture(length); const before = structuredClone(data);
          const model = buildSegmentedBarModel(data, { config: { segmentOrder, ...(separateCategoryIds ? { separateCategoryIds } : {}) } });
          expect(model.error).toBeNull();
          expect(model.displaySegments.length).toBeLessThanOrEqual(4);
          expect(new Set(model.displaySegments.map(segment => segment.key)).size).toBe(model.displaySegments.length);
          const memberIds = model.displaySegments.flatMap(segment => segment.members.map(row => row.id));
          expect(memberIds.sort()).toEqual(data.map(row => row.id).sort());
          expect(new Set(memberIds).size).toBe(length);
          expect(model.rows.map(row => row.id)).toEqual(data.map(row => row.id));
          expect(data).toEqual(before);
          const otherIndex = model.displaySegments.findIndex(segment => segment.kind === 'other');
          if (otherIndex >= 0) expect(otherIndex).toBe(model.displaySegments.length - 1);
          expect(model.displaySegments.every(segment => segment.members.length > 0)).toBe(true);
        }
      }
    }
  });

  it('treats a suppressed zero as protected and never computes a partial Other value', () => {
    const protectedDatum = { id: 'protected', label: 'Protected category', value: 0 };
    const formatValue = vi.fn(({ value }: { value: number }) => String(value));
    const model = buildSegmentedBarModel([...fixture(5), protectedDatum], {
      total: 100, suppressed: true, config: { separateCategoryIds: ['source-0'] }, formatValue
    });
    const other = model.displaySegments.find(segment => segment.kind === 'other');
    expect(other?.kind).toBe('other');
    if (other?.kind !== 'other') throw Error('Missing Other');
    expect(other.value).toBeNull();
    expect(other.percentage).toBeNull();
    expect(other.ratio).toBe(0);
    expect(other.status).toBe('suppressed');
    expect(model.rows.find(row => row.id === 'protected')?.value).toBeNull();
    expect(model.rows.find(row => row.id === 'protected')?.valueText).toBe('Suppressed');

  });

  it('keeps original records in CSV without adding or duplicating a generated aggregate', () => {
    const data = fixture(8);
    data[7]!.label = 'Other categories';
    const model = buildSegmentedBarModel(data);
    expect(model.displaySegments).toHaveLength(4);
    const csv = buildSegmentedBarCsv(model);
    expect(csv.split('\r\n')).toHaveLength(data.length + 2);
    expect(csv.match(/Other categories/g)).toHaveLength(1);
    expect(model.rows.map(row => row.value)).toEqual(data.map(row => row.value));
  });
  it('uses collision-free display keys even when source IDs resemble internal names', () => {
    const model = buildSegmentedBarModel([
      { id: 'other', label: 'Other', value: 2 },
      { id: 'group:other', label: 'Named group', value: 3 },
      { id: 'category:other', label: 'Named category', value: 4 }
    ], { config: { separateCategoryIds: ['other', 'group:other'] } });
    expect(new Set(model.displaySegments.map(segment => segment.key)).size).toBe(3);
    expect(model.displaySegments[2]!.kind).toBe('other');
  });

});

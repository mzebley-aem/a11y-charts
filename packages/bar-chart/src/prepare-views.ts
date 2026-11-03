import type { A11yBarChartDatum } from './model.js';
import type { BarViewSection, PreparedBarView } from './grouped-model.js';
import { validateBarData, validateBarTotal } from './validation.js';
import { canonicalLocaleOrDefault } from '../../chart-core/src/validation.js';

/** Resolve application-specific fields and glossary content before calling this helper. */
export interface BarPopulationRecord extends A11yBarChartDatum {
  filterId: string;
}
export interface BarPopulationOption {
  id: string;
  label: string;
  definition?: string;
  /** Omit to sum only complete reported records. null explicitly means unknown. */
  total?: number | null;
}
export interface BarPreparedViewContext {
  option: BarPopulationOption;
  isAll: boolean;
  data: readonly A11yBarChartDatum[];
  total: number | null;
  populationTotal: number | null;
  populationShare: number | null;
}
export interface PrepareBarViewsOptions {
  id: string;
  label: string;
  description?: string;
  all: BarPopulationOption;
  options: readonly BarPopulationOption[];
  records: readonly BarPopulationRecord[];
  /** Chart-wide legacy suppression of zeros. Explicit row flags take precedence. */
  suppressed?: boolean;
  filtered?: boolean;
  sort?: 'source' | 'value-descending';
  locale?: string;
  /** Author localized content from safe values; no ADAPT template grammar is embedded. */
  describe?: (context: BarPreparedViewContext) => Pick<PreparedBarView, 'chartTitle' | 'context' | 'dataNote' | 'explanation' | 'emptyMessage'>;
}

/** Aggregate prepared population records without mutating sources or inferring protected totals. */
export function prepareBarViewSection(input: PrepareBarViewsOptions): BarViewSection {
  if (!input || typeof input.id !== 'string' || !input.id.trim() || !input.all || typeof input.all.id !== 'string' || !input.all.id.trim()) {
    throw new TypeError('Section and All IDs must be non-empty.');
  }
  if (!Array.isArray(input.options) || !Array.isArray(input.records)) throw new TypeError('Options and records must be arrays.');
  const ids = new Set([input.all.id]);
  for (const option of input.options) {
    if (!option || typeof option.id !== 'string' || !option.id.trim() || typeof option.label !== 'string' || ids.has(option.id)) {
      throw new TypeError('Filter IDs must be non-empty and unique, including All; labels must be strings.');
    }
    if (option.definition !== undefined && typeof option.definition !== 'string') throw new TypeError('Option definitions must be strings.');
    ids.add(option.id);
  }
  if (typeof input.label !== 'string' || typeof input.all.label !== 'string' || (input.all.definition !== undefined && typeof input.all.definition !== 'string')) {
    throw new TypeError('The All label must be a string and its definition must be text.');
  }
  if (input.description !== undefined && typeof input.description !== 'string') throw new TypeError('Section description must be a string.');
  const locale = canonicalLocaleOrDefault(input.locale, 'en-US');
  const records = input.records.map(record => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new TypeError('Each record must be an object.');
    if (typeof record.filterId !== 'string' || !record.filterId.trim()) throw new TypeError('Each record needs a filter ID.');
    if (record.filterId === input.all.id || !ids.has(record.filterId)) throw new TypeError(`Record filter ID ${record.filterId} must match an individual option, not the generated All view.`);
    const validation = validateBarData([record]);
    if (!validation.valid) throw new TypeError(validation.message);
    const safe = validation.data[0]!;
    const protectedValue = safe.valueSuppressed === true ||
      (safe.valueSuppressed !== false && input.suppressed === true && safe.value === 0);
    return { ...safe, filterId: record.filterId, ...(protectedValue ? { value: null, valueSuppressed: true } : {}) };
  });
  const aggregate = (rows: typeof records): A11yBarChartDatum[] => {
    const groups = new Map<string, A11yBarChartDatum>();
    for (const row of rows) {
      const { filterId: _filter, ...datum } = row;
      if (datum.target != null || datum.targetSuppressed) throw new TypeError('Assign targets after aggregation; targets cannot be summed across populations.');
      const prior = groups.get(datum.id);
      if (!prior) { groups.set(datum.id, { ...datum }); continue; }
      if (prior.label !== datum.label || prior.definition !== datum.definition) throw new TypeError('Repeated category IDs must have consistent labels and definitions.');
      if (prior.valueSuppressed || datum.valueSuppressed) {
        prior.value = null;
        prior.valueSuppressed = true;
      } else if (prior.value === null || datum.value === null) prior.value = null;
      else {
        prior.value += datum.value;
        if (!Number.isFinite(prior.value)) throw new TypeError('Aggregated count exceeds the numeric limit.');
        // Rows have already resolved the legacy suppression mode.
        prior.valueSuppressed = false;
      }
    }
    const data = [...groups.values()];
    if (input.sort === 'value-descending') data.sort((a, b) =>
      (b.value ?? -1) - (a.value ?? -1) || a.label.localeCompare(b.label, locale, { numeric: true }));
    return data;
  };
  const resolveTotal = (option: BarPopulationOption, data: A11yBarChartDatum[]): number | null => {
    if (option.total !== undefined) {
      const result = validateBarTotal(option.total);
      if (!result.valid) throw new TypeError(result.message);
      return result.total;
    }
    if (input.suppressed || data.some(row => row.value === null || row.valueSuppressed)) return null;
    const sum = data.reduce((total, row) => total + row.value!, 0);
    if (!Number.isFinite(sum)) throw new TypeError('Population total exceeds the numeric limit.');
    return sum;
  };
  const allData = aggregate(records);
  const populationTotal = resolveTotal(input.all, allData);
  const views = [input.all, ...input.options].map(option => {
    const isAll = option.id === input.all.id;
    const data = isAll ? allData : aggregate(records.filter(record => record.filterId === option.id));
    const total = isAll ? populationTotal : resolveTotal(option, data);
    const populationShare = total !== null && populationTotal !== null && populationTotal > 0 ? total / populationTotal : null;
    const content = input.describe?.({ option: { ...option }, isAll, data: structuredClone(data), total, populationTotal,
      populationShare: populationShare !== null && Number.isFinite(populationShare) ? populationShare : null });
    return {
      id: option.id, label: option.label, ...(option.definition !== undefined ? { definition: option.definition } : {}),
      chartTitle: typeof content?.chartTitle === 'string' ? content.chartTitle : option.label,
      ...(typeof content?.context === 'string' ? { context: content.context } : {}),
      ...(typeof content?.dataNote === 'string' ? { dataNote: content.dataNote } : {}),
      ...(typeof content?.explanation === 'string' ? { explanation: content.explanation } : {}),
      ...(typeof content?.emptyMessage === 'string' ? { emptyMessage: content.emptyMessage } : {}),
      data, total,
      suppressed: input.suppressed === true || data.some(row => row.valueSuppressed === true),
      filtered: input.filtered === true || !isAll
    };
  });
  return { id: input.id, label: input.label, ...(input.description !== undefined ? { description: input.description } : {}), allViewId: input.all.id, views };
}

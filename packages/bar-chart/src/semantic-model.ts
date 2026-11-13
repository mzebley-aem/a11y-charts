import { resolveConfig } from './config.js';
import type { A11yBarChartDatum, A11yBarChartRow, A11yBarChartSemanticModel, A11yBarChartValueFormatContext, BarModelOptions, ResolvedA11yBarChartConfig } from './model.js';
import { createMessageResolver, type MessageDictionary } from './messages.js';
import { copyTarget, isTargetRange } from './target.js';
import { compareToNumericOrRange } from '../../chart-core/src/target.js';
import { createFixedDecimalFormatter } from '../../chart-core/src/format.js';
import { fractionToWholePercent } from '../../chart-core/src/csv.js';

export function buildBarModel(data: readonly A11yBarChartDatum[], options: BarModelOptions = {}): A11yBarChartSemanticModel {
  const config: ResolvedA11yBarChartConfig = resolveConfig(options.config);
  const numberFormat = createFixedDecimalFormatter(config.locale);
  const percentFormat = createFixedDecimalFormatter(config.locale, 'percent');
  const listFormatter = new Intl.ListFormat(config.locale, { style: 'long', type: 'conjunction' });
  const messages = options.messages as MessageDictionary | undefined;
  const msg = createMessageResolver(messages, config.locale);
  const formatValue = (context: A11yBarChartValueFormatContext, fallback: () => string): string => {
    try {
      const formatted: unknown = options.formatValue?.(context);
      if (typeof formatted === 'string' && formatted.trim()) return formatted;
    } catch { /* use canonical locale-aware formatting */ }
    return fallback();
  };
  const hasProvidedTotal = options.total !== undefined && options.total !== null;
  const validTotal = hasProvidedTotal && typeof options.total === 'number' && Number.isFinite(options.total) && options.total >= 0
    ? options.total
    : null;
  const suppressed = options.suppressed === true;
  const filtered = options.filtered === true;
  // The host suppresses upstream by sending 0; the chart only decides how zeros read while the flag is on.
  const isSuppressed = (datum: A11yBarChartDatum): boolean => suppressed && datum.value === 0;
  const hasMissingValues = data.some((datum) => datum.value === null);
  const hasSuppressedValues = data.some(isSuppressed);
  // A provided zero total under suppression is not a usable denominator; it reads as Suppressed.
  const providedTotal = suppressed && validTotal === 0 ? null : validTotal;
  let sum = 0;
  let sumOverflow = false;
  for (const datum of data) {
    const value = datum.value ?? 0;
    if (value > Number.MAX_VALUE - sum) sumOverflow = true;
    else if (!sumOverflow) sum += value;
  }
  // A computed sum is understated when zeros are suppressed, so it is never inferred then.
  const total = hasProvidedTotal ? providedTotal : !config.inferTotal || hasSuppressedValues || hasMissingValues || sumOverflow ? null : sum;
  const denominatorKnown = total !== null;
  const totalText = total !== null
    ? formatValue({ value: total, series: 'total', locale: config.locale }, () => numberFormat(total, config.countDecimals))
    : suppressed || hasSuppressedValues
      ? msg('totalSuppressed')
      : msg('totalUnavailable');
  const largest = data.reduce((largestValue, datum) => Math.max(largestValue,
    isSuppressed(datum) || datum.value === null ? 0 : datum.value,
    isTargetRange(datum.target) ? datum.target.max : datum.target ?? 0), 0);
  const max = config.scaleMaximum ?? largest;
  const warnings: string[] = [];
  const indicators: string[] = [];
  if (hasProvidedTotal && validTotal === null) warnings.push(msg('validationInvalidTotal'));
  if (sumOverflow && hasProvidedTotal && validTotal !== null) warnings.push(msg('warningReportedSumOverflow'));
  if (sumOverflow && !hasProvidedTotal && !suppressed && !hasMissingValues) warnings.push(msg('warningComputedTotalOverflow'));
  if (suppressed || hasSuppressedValues) indicators.push(msg('suppressed'));
  if (filtered) indicators.push(msg('filtered'));
  if (providedTotal !== null && !sumOverflow && sum > providedTotal) warnings.push(msg('warningTotalMismatch', {
    sum: numberFormat(sum, config.countDecimals), total: totalText
  }));
  if (config.scaleMode === 'largest' && config.scaleMaximum !== undefined) {
    for (const datum of data) {
      const valueClipped = !isSuppressed(datum) && datum.value !== null && datum.value > config.scaleMaximum;
      const targetMax = isTargetRange(datum.target) ? datum.target.max : datum.target ?? null;
      if (valueClipped || (targetMax !== null && targetMax > config.scaleMaximum)) {
        warnings.push(msg('warningScaleClipped', { label: datum.label }));
      }
    }
  }

  const rows: A11yBarChartRow[] = data.map((datum) => {
    const status: A11yBarChartRow['status'] = isSuppressed(datum) ? 'suppressed' : datum.value === null ? 'missing' : 'reported';
    const valueText = status === 'missing'
      ? msg('missingValue')
      : status === 'suppressed'
        ? msg('suppressedValue')
      : formatValue({ value: datum.value!, series: 'count', locale: config.locale, id: datum.id, label: datum.label }, () => numberFormat(datum.value!, config.countDecimals));
    const percentageCandidate = status !== 'reported' || !denominatorKnown || total === 0 || datum.value === null
      ? null
      : datum.value / total;
    const percentageOverflow = percentageCandidate !== null &&
      (!Number.isFinite(percentageCandidate) || percentageCandidate > Number.MAX_VALUE / 100);
    const percentage = percentageOverflow ? null : percentageCandidate;
    const percentageText = percentage === null
      ? status === 'suppressed'
        ? msg('percentageSuppressed')
        : msg('percentageUnavailable')
      : formatValue({ value: config.percentScale === 'whole' ? fractionToWholePercent(percentage) : percentage, series: 'percentage', locale: config.locale, id: datum.id, label: datum.label }, () => percentFormat(percentage, config.percentageDecimals));
    if (percentageOverflow) warnings.push(msg('warningPercentageOverflow', { label: datum.label }));
    let barRatio = 0;
    if (status === 'reported' && datum.value !== null) {
      if (config.scaleMode === 'largest') barRatio = max > 0 ? datum.value / max : 0;
      else {
        const share = !percentageOverflow && total !== null && total > 0 ? datum.value / total : 0;
        barRatio = Number.isFinite(share) ? share : 0;
      }
    }
    barRatio = Math.min(1, Math.max(0, Number.isFinite(barRatio) ? barRatio : 0));
    let narrative: string;
    if (status === 'missing') narrative = msg('narrativeMissing', { label: datum.label });
    else if (status === 'suppressed') narrative = msg('narrativeSuppressed', { label: datum.label });
    else if (percentage === null) narrative = msg('narrativeValue', { label: datum.label, value: valueText });
    else narrative = msg('narrativeShare', { label: datum.label, value: valueText, percentage: percentageText });
    const target = copyTarget(datum.target);
    const targetMin = isTargetRange(target) ? target.min : target;
    const targetMax = isTargetRange(target) ? target.max : target;
    const formatBound = (value: number) => formatValue({ value, series: 'target', locale: config.locale, id: datum.id, label: datum.label }, () => numberFormat(value, config.countDecimals));
    const targetText = target === null ? msg('targetUnavailable')
      : isTargetRange(target) ? msg('targetRange', { min: formatBound(target.min), max: formatBound(target.max) })
        : formatBound(target);
    const targetRelation: A11yBarChartRow['targetRelation'] = status !== 'reported' || targetMin === null || targetMax === null ? 'incomplete'
      : compareToNumericOrRange(datum.value!, target!);
    const targetOutcome: A11yBarChartRow['targetOutcome'] = targetRelation === 'incomplete' ? 'unavailable'
      : isTargetRange(target) ? targetRelation === 'within' ? 'met' : 'not-met'
        : targetRelation === 'equal' || targetRelation === config.positiveDirection ? 'met' : 'not-met';
    const targetOutcomeLabel = targetOutcome === 'unavailable' ? ''
      : msg(targetOutcome === 'met' ? 'outcomeMet' : 'outcomeNotMet');
    const targetNarrative = target === null ? '' : msg({ below: 'targetBelow', within: 'targetWithin', above: 'targetAbove', equal: 'targetEqual', incomplete: 'targetIncomplete' }[targetRelation] as 'targetBelow' | 'targetWithin' | 'targetAbove' | 'targetEqual' | 'targetIncomplete', { label: datum.label, target: targetText });
    const scale = config.scaleMode === 'largest' ? max : total;
    const ratio = (value: number | null): number | null => value === null || scale === null || scale <= 0 ? null : Math.min(1, Math.max(0, value / scale));
    // A zero target on an all-zero largest scale still has a meaningful origin.
    const targetStartRatio = targetMin === 0 && config.scaleMode === 'largest' ? 0 : ratio(targetMin);
    const targetEndRatio = targetMax === 0 && config.scaleMode === 'largest' ? 0 : ratio(targetMax);
    if (targetMax !== null && config.scaleMode === 'population-share') {
      if (total === null || total <= 0) warnings.push(msg('warningTargetScaleUnavailable', { label: datum.label }));
      else if (targetMax > total) warnings.push(msg('warningTargetClipped', { label: datum.label }));
    }
    if (targetNarrative) narrative += ` ${targetNarrative}`;
    if (targetOutcomeLabel) narrative += ` ${targetOutcomeLabel}.`;
    return { id: datum.id, label: datum.label, value: status === 'suppressed' ? null : datum.value, status, valueText, percentage, percentageText, barRatio,
      target, targetText, targetRelation, targetOutcome, targetOutcomeLabel, targetNarrative, targetStartRatio, targetEndRatio,
      definition: datum.definition ?? '', narrative };
  });

  let summary: string;
  if (!data.length) summary = msg('summaryNoData');
  else if (rows.every((row) => row.status === 'reported' && row.value === 0)) {
    summary = msg('summaryAllZero', { count: rows.length });
  } else {
    const available = rows.filter((row) => row.status === 'reported');
    const complete = !hasSuppressedValues && !hasMissingValues && available.length === rows.length;
    if (!available.length) summary = msg('summaryNoReportedValues');
    else if (!complete) {
      const first = available[0]!;
      summary = msg('summaryReportedCategory', {
        label: first.label, value: first.valueText
      });
    } else {
      const largestValue = available.reduce((largest, row) => Math.max(largest, row.value ?? 0), 0);
      const leaders = available.filter((row) => row.value === largestValue);
      const leader = leaders[0]!;
      const list = listFormatter.format(leaders.map((row) => row.label));
      const hasShare = leader.percentage !== null;
      if (leaders.length === 1) {
        summary = msg(hasShare ? 'summaryLargestCategoryShare' : 'summaryLargestCategory', {
          label: leader.label, value: leader.valueText, percentage: leader.percentageText
        });
      } else {
        summary = msg(hasShare ? 'summaryTiedLargestCategoriesShare' : 'summaryTiedLargestCategories', {
          labels: list, value: leader.valueText, percentage: leader.percentageText
        });
      }
    }
  }
  const firstTarget = rows.find((row) => row.targetNarrative);
  if (firstTarget) summary += ` ${firstTarget.targetNarrative}`;
  const explanation: string[] = [];
  if (total !== null) explanation.push(msg('explanationTotal', { total: totalText }));
  else explanation.push(msg('explanationTotalUnavailable', { total: totalText }));
  explanation.push(...rows.map((row) => row.narrative));
  return { rows, total, totalText, summary, explanation, indicators, warnings, hasMissingValues };
}

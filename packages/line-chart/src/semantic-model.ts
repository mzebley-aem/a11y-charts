import type { ResolvedA11yLineChartConfig } from './config.js';
import type {
  A11yLineChartBaseline,
  A11yLineChartBaselineInterpretation,
  A11yLineChartDatum,
  A11yLineChartDifferenceFormatter,
  A11yLineChartOutcome,
  A11yLineChartPointInterpretation,
  A11yLineChartRelation,
  A11yLineChartSemanticDifference,
  A11yLineChartSemanticModel,
  A11yLineChartSeries,
  A11yLineChartTarget,
  A11yLineChartXValue
} from './model.js';
import { copyTarget, formatTarget, isTargetRange } from './target.js';
import { compareToNumericOrRange } from '../../chart-core/src/target.js';
import { ENGLISH_LINE_CHART_MESSAGES, formatLineMessage, pluralLineMessage } from './messages.js';

export interface A11yLineChartSemanticContext {
  baseline?: A11yLineChartBaseline;
  config: ResolvedA11yLineChartConfig;
  data: A11yLineChartDatum[];
  formatDifference: A11yLineChartDifferenceFormatter;
  formatValue: (
    value: number | null,
    series: A11yLineChartSeries,
    x: A11yLineChartXValue
  ) => string;
  formatXValue: (value: A11yLineChartXValue) => string;
  message?: (key: string, values?: Record<string, unknown>) => string;
}

/** Defensive normalized copy for callers of exported pure helpers. */
export function normalizeLineData(data: readonly A11yLineChartDatum[]): A11yLineChartDatum[] {
  return data.map((datum) => ({
    x: datum.x instanceof Date ? new Date(datum.x.getTime()) : datum.x,
    actual: datum.actualSuppressed === true ? null : datum.actual ?? null,
    actualSuppressed: datum.actualSuppressed === true,
    target: datum.targetSuppressed === true ? null : copyTarget(datum.target),
    targetSuppressed: datum.targetSuppressed === true
  }));
}

function message(context: A11yLineChartSemanticContext, key: string, values: Record<string, unknown> = {}): string {
  if (context.message) return context.message(key, values);
  if (key === 'summaryPeriods') return pluralLineMessage({}, 'summaryPeriods', Number(values.total) || 0, context.config.locale, values);
  const template = ENGLISH_LINE_CHART_MESSAGES[key as keyof typeof ENGLISH_LINE_CHART_MESSAGES];
  return formatLineMessage(typeof template === 'string' ? template : key, values);
}

function relation(actual: number | null, target: A11yLineChartTarget | null): A11yLineChartRelation {
  if (actual === null || target === null) return 'incomplete';
  return compareToNumericOrRange(actual, target);
}

function outcome(
  actual: number | null,
  target: A11yLineChartTarget | null,
  positiveDirection: ResolvedA11yLineChartConfig['positiveDirection']
): A11yLineChartOutcome {
  if (actual === null || target === null) return 'unavailable';
  if (isTargetRange(target)) return actual >= target.min && actual <= target.max ? 'met' : 'not-met';
  if (actual === target) return 'met-equal';
  const met = positiveDirection === 'above' ? actual > target : actual < target;
  return met ? 'met' : 'not-met';
}

function createTargetDifference(
  actual: number,
  target: A11yLineChartTarget,
  x: A11yLineChartXValue,
  context: A11yLineChartSemanticContext
): A11yLineChartSemanticDifference {
  const label = lowercaseInitial(context.config.targetSeriesLabel);
  if (!isTargetRange(target)) return createDifference(actual, target, 'target', x, label, context);
  if (actual >= target.min && actual <= target.max) {
    return {
      absoluteValue: 0,
      description: message(context, 'rangeWithin', { series: label }),
      formatted: context.formatDifference({ comparison: 'target', locale: context.config.locale, value: 0, valuePreset: context.config.valuePreset, x }),
      relation: 'within',
      signedValue: 0
    };
  }
  const below = actual < target.min;
  return createDifference(actual, below ? target.min : target.max, 'target', x,
    message(context, below ? 'rangeLowerBound' : 'rangeUpperBound', { series: label }), context);
}

function outcomeLabel(value: A11yLineChartOutcome, context: A11yLineChartSemanticContext): string {
  if (value === 'met') return message(context, 'outcomeMet');
  if (value === 'met-equal') return message(context, 'outcomeMetEqual');
  if (value === 'not-met') return message(context, 'outcomeNotMet');
  return message(context, 'outcomeUnavailable');
}

function lowercaseInitial(value: string): string {
  return value ? `${value[0]!.toLocaleLowerCase()}${value.slice(1)}` : value;
}

function createDifference(
  actual: number,
  comparisonValue: number,
  comparison: 'baseline' | 'target',
  x: A11yLineChartXValue,
  comparisonLabel: string,
  context: A11yLineChartSemanticContext
): A11yLineChartSemanticDifference {
  const signedValue = actual - comparisonValue;
  const relationValue = signedValue === 0 ? 'equal' : signedValue > 0 ? 'above' : 'below';
  const absoluteValue = Math.abs(signedValue);
  const formatted = context.formatDifference({
    comparison,
    locale: context.config.locale,
    value: absoluteValue,
    valuePreset: context.config.valuePreset,
    x
  });
  const description = relationValue === 'equal'
    ? message(context, 'differenceEqual', { comparison: comparisonLabel })
    : message(context, 'differenceRelative', { formatted, relation: message(context, `relation${relationValue.charAt(0).toUpperCase()}${relationValue.slice(1)}`), comparison: comparisonLabel });
  return {
    absoluteValue,
    description,
    formatted,
    relation: relationValue,
    signedValue
  };
}

function createBaselineInterpretation(
  baseline: A11yLineChartBaseline | undefined,
  context: A11yLineChartSemanticContext
): A11yLineChartBaselineInterpretation | null {
  if (!baseline) return null;
  return {
    difference: null,
    explanation: baseline.explanation?.trim() || '',
    formatted: context.formatValue(baseline.value, 'baseline', baseline.x),
    value: baseline.value,
    x: baseline.x,
    xLabel: context.formatXValue(baseline.x)
  };
}

function pointNarrative(
  point: Omit<A11yLineChartPointInterpretation, 'narrative'>,
  context: A11yLineChartSemanticContext
): string {
  const parts = [message(context, 'narrativePeriod', { period: point.xLabel, position: point.position, total: point.total })];
  const actualName = context.config.actualSeriesLabel;
  const targetName = context.config.targetSeriesLabel;

  if (point.actualValue === null) {
    parts.push(message(context, point.actualSuppressed ? 'actualSuppressed' : 'noActual', { series: lowercaseInitial(actualName) }));
    if (point.targetValue === null) parts.push(message(context, point.targetSuppressed ? 'targetSuppressed' : 'noTarget', { series: lowercaseInitial(targetName) }));
    else parts.push(message(context, 'targetValue', { series: targetName, value: point.targetFormatted }));
    parts.push(message(context, 'outcomeUnavailableSentence'));
    return parts.join(' ');
  }

  if (point.targetValue === null) {
    parts.push(message(context, 'actualValueSentence', { series: actualName, value: point.actualFormatted }));
    parts.push(message(context, point.targetSuppressed ? 'targetSuppressed' : 'noTarget', { series: lowercaseInitial(targetName) }));
    parts.push(message(context, 'outcomeUnavailableSentence'));
  } else {
    parts.push(message(context, 'narrativeOutcome', { outcome: point.outcomeLabel }));
    parts.push(message(context, 'actualValueSentence', { series: actualName, value: point.actualFormatted }));
    parts.push(message(context, 'targetValue', { series: targetName, value: point.targetFormatted }));
    if (point.targetDifference) parts.push(point.relation === 'within'
      ? message(context, 'withinNarrative', { series: actualName, description: point.targetDifference.description })
      : message(context, 'differenceSentence', { description: point.targetDifference.description }));
  }

  return parts.join(' ');
}

function summaryFor(
  points: A11yLineChartPointInterpretation[],
  baseline: A11yLineChartBaselineInterpretation | null,
  context: A11yLineChartSemanticContext
): A11yLineChartSemanticModel['summary'] {
  let latestActualIndex: number | null = null;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index]!.actualValue !== null) {
      latestActualIndex = index;
      break;
    }
  }

  const comparable = points.filter((point) => point.actualValue !== null && point.targetValue !== null);
  const metCount = comparable.filter((point) => point.outcome === 'met' || point.outcome === 'met-equal').length;
  const supporting: string[] = [];
  let primary = message(context, 'summaryNone');

  if (latestActualIndex !== null) {
    const latest = points[latestActualIndex]!;
    if (latest.targetValue === null) {
      primary = message(context, 'summaryCannotDetermine', { period: latest.xLabel });
      supporting.push(latest.targetSuppressed
        ? message(context, 'summaryTargetSuppressed', { series: context.config.targetSeriesLabel, period: latest.xLabel })
        : message(context, 'summaryMissingTarget', { actual: context.config.actualSeriesLabel, value: latest.actualFormatted, target: lowercaseInitial(context.config.targetSeriesLabel) }));
    } else {
      primary = latest.outcome === 'met-equal'
        ? message(context, 'summaryMetEqual', { period: latest.xLabel })
        : latest.relation === 'within'
          ? message(context, 'summaryWithin', { period: latest.xLabel })
        : message(context, 'summaryOutcome', { outcome: latest.outcomeLabel, period: latest.xLabel });
      const comparison = latest.targetDifference?.relation === 'equal'
        ? message(context, 'summaryEqual', { actual: context.config.actualSeriesLabel, target: lowercaseInitial(context.config.targetSeriesLabel), value: latest.actualFormatted })
        : message(context, 'summaryComparison', { actual: context.config.actualSeriesLabel, actualValue: latest.actualFormatted, target: context.config.targetSeriesLabel, targetValue: latest.targetFormatted, description: latest.targetDifference?.description ?? '' });
      supporting.push(comparison);
    }

    if (latest.baseline?.difference) {
      supporting.push(message(context, 'summaryBaseline', { actual: context.config.actualSeriesLabel, description: latest.baseline.difference.description, value: latest.baseline.formatted }));
    }
    if (comparable.length) {
      supporting.push(context.message
        ? message(context, 'summaryPeriods', { met: metCount, total: comparable.length })
        : `${comparable.length === 1 ? 'The target was met' : 'The target was met'} in ${metCount} of ${comparable.length} comparable reported ${comparable.length === 1 ? 'period' : 'periods'}.`);
    }
    if (latestActualIndex < points.length - 1 && !points.slice(latestActualIndex + 1).some((point) => point.actualSuppressed)) {
      supporting.push(message(context, 'summaryNoLater', { series: lowercaseInitial(context.config.actualSeriesLabel), period: latest.xLabel }));
    }
  } else {
    const protectedPoint = [...points].reverse().find((point) => point.actualSuppressed || point.targetSuppressed);
    if (protectedPoint) {
      primary = protectedPoint.actualSuppressed
        ? message(context, 'summaryAllSuppressed', { period: protectedPoint.xLabel })
        : message(context, 'summaryTargetSuppressed', { series: context.config.targetSeriesLabel, period: protectedPoint.xLabel });
      supporting.push(message(context, 'outcomeUnavailableSentence'));
    }
    if (baseline) supporting.push(message(context, 'summaryBaselineOnly', { series: context.config.baselineSeriesLabel, period: baseline.xLabel, value: baseline.formatted }));
  }

  if (latestActualIndex !== null) {
    const protectedLater = points.slice(latestActualIndex + 1).reverse().find((point) => point.actualSuppressed);
    if (protectedLater) supporting.push(message(context, 'summaryLatestSuppressed', { series: context.config.actualSeriesLabel, period: protectedLater.xLabel }));
  }

  const text = [primary, ...supporting].join(' ');
  return {
    comparableCount: comparable.length,
    latestActualIndex,
    metCount,
    primary,
    supporting,
    text
  };
}

export function buildSemanticModel(context: A11yLineChartSemanticContext): A11yLineChartSemanticModel {
  const baseline = createBaselineInterpretation(context.baseline, context);
  const data = normalizeLineData(context.data);
  const points = data.map((datum, index) => {
    const actualValue = datum.actual ?? null;
    const actualSuppressed = datum.actualSuppressed === true;
    const targetSuppressed = datum.targetSuppressed === true;
    const targetValue = copyTarget(datum.target);
    const relationValue = relation(actualValue, targetValue);
    const outcomeValue = outcome(actualValue, targetValue, context.config.positiveDirection);
    const targetDifference = actualValue === null || targetValue === null
      ? null
      : createTargetDifference(actualValue, targetValue, datum.x, context);
    const pointBaseline = baseline
      ? {
          ...baseline,
          difference: actualValue === null
            ? null
            : createDifference(
                actualValue,
                baseline.value,
                'baseline',
                datum.x,
                message(context, 'baselineDifference', { period: baseline.xLabel, series: lowercaseInitial(context.config.baselineSeriesLabel) }),
                context
              )
        }
      : null;
    const pointWithoutNarrative: Omit<A11yLineChartPointInterpretation, 'narrative'> = {
      actualFormatted: actualSuppressed ? message(context, 'suppressed') : context.formatValue(actualValue, 'actual', datum.x),
      actualValue,
      actualSuppressed,
      baseline: pointBaseline,
      index,
      outcome: outcomeValue,
      outcomeLabel: outcomeLabel(outcomeValue, context),
      position: index + 1,
      relation: relationValue,
      targetDifference,
      targetFormatted: targetSuppressed ? message(context, 'suppressed') : formatTarget(targetValue, (value) => context.formatValue(value, 'target', datum.x), message(context, 'rangeSeparator')),
      targetValue,
      targetSuppressed,
      total: data.length,
      x: datum.x,
      xLabel: context.formatXValue(datum.x)
    };
    return {
      ...pointWithoutNarrative,
      narrative: pointNarrative(pointWithoutNarrative, context)
    };
  });

  return {
    baseline,
    points,
    summary: summaryFor(points, baseline, context)
  };
}

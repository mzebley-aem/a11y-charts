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
  A11yLineChartXValue
} from './model.js';

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
}

function relation(actual: number | null, target: number | null): A11yLineChartRelation {
  if (actual === null || target === null) return 'incomplete';
  if (actual === target) return 'equal';
  return actual > target ? 'above' : 'below';
}

function outcome(
  actual: number | null,
  target: number | null,
  positiveDirection: ResolvedA11yLineChartConfig['positiveDirection']
): A11yLineChartOutcome {
  if (actual === null || target === null) return 'unavailable';
  if (actual === target) return 'met-equal';
  const met = positiveDirection === 'above' ? actual > target : actual < target;
  return met ? 'met' : 'not-met';
}

function outcomeLabel(value: A11yLineChartOutcome): string {
  if (value === 'met') return 'Target met';
  if (value === 'met-equal') return 'Target met — on target';
  if (value === 'not-met') return 'Target not met';
  return 'Target outcome unavailable';
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
    ? `equal to ${comparisonLabel}`
    : `${formatted} ${relationValue} ${comparisonLabel}`;
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
  const parts = [`${point.xLabel}, ${point.position} of ${point.total}.`];
  const actualName = context.config.actualSeriesLabel;
  const targetName = context.config.targetSeriesLabel;

  if (point.actualValue === null) {
    parts.push(`No ${lowercaseInitial(actualName)} value has been reported.`);
    if (point.targetValue === null) parts.push(`No ${lowercaseInitial(targetName)} value has been reported.`);
    else parts.push(`${targetName} ${point.targetFormatted}.`);
    parts.push('Target outcome unavailable.');
    return parts.join(' ');
  }

  if (point.targetValue === null) {
    parts.push(`${actualName} ${point.actualFormatted}.`);
    parts.push(`No ${lowercaseInitial(targetName)} value has been reported.`);
    parts.push('Target outcome unavailable.');
  } else {
    parts.push(`${point.outcomeLabel}.`);
    parts.push(`${actualName} ${point.actualFormatted}.`);
    parts.push(`${targetName} ${point.targetFormatted}.`);
    if (point.targetDifference) parts.push(`${point.targetDifference.description}.`);
  }

  if (point.baseline?.difference) parts.push(`${point.baseline.difference.description}.`);
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
  let primary = 'No reported result yet.';

  if (latestActualIndex !== null) {
    const latest = points[latestActualIndex]!;
    if (latest.targetValue === null) {
      primary = `Target outcome cannot be determined for ${latest.xLabel}.`;
      supporting.push(`${context.config.actualSeriesLabel} was ${latest.actualFormatted}, but no ${lowercaseInitial(context.config.targetSeriesLabel)} value was reported.`);
    } else {
      primary = latest.outcome === 'met-equal'
        ? `Target met in ${latest.xLabel} — on target.`
        : `${latest.outcomeLabel} in ${latest.xLabel}.`;
      const comparison = latest.targetDifference?.relation === 'equal'
        ? `${context.config.actualSeriesLabel} equaled ${lowercaseInitial(context.config.targetSeriesLabel)} at ${latest.actualFormatted}.`
        : `${context.config.actualSeriesLabel} was ${latest.actualFormatted}. ${context.config.targetSeriesLabel} was ${latest.targetFormatted}—${latest.targetDifference?.description}.`;
      supporting.push(comparison);
    }

    if (latest.baseline?.difference) {
      supporting.push(`${context.config.actualSeriesLabel} was ${latest.baseline.difference.description} of ${latest.baseline.formatted}.`);
    }
    if (comparable.length) {
      supporting.push(`The target was met in ${metCount} of ${comparable.length} comparable reported ${comparable.length === 1 ? 'period' : 'periods'}.`);
    }
    if (latestActualIndex < points.length - 1) {
      supporting.push(`No ${lowercaseInitial(context.config.actualSeriesLabel)} data has been reported after ${latest.xLabel}.`);
    }
  } else if (baseline) {
    supporting.push(`${context.config.baselineSeriesLabel} is ${baseline.xLabel} at ${baseline.formatted}.`);
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
  const points = context.data.map((datum, index) => {
    const actualValue = datum.actual ?? null;
    const targetValue = datum.target ?? null;
    const relationValue = relation(actualValue, targetValue);
    const outcomeValue = outcome(actualValue, targetValue, context.config.positiveDirection);
    const targetDifference = actualValue === null || targetValue === null
      ? null
      : createDifference(actualValue, targetValue, 'target', datum.x, lowercaseInitial(context.config.targetSeriesLabel), context);
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
                `the ${baseline.xLabel} ${lowercaseInitial(context.config.baselineSeriesLabel)}`,
                context
              )
        }
      : null;
    const pointWithoutNarrative: Omit<A11yLineChartPointInterpretation, 'narrative'> = {
      actualFormatted: context.formatValue(actualValue, 'actual', datum.x),
      actualValue,
      baseline: pointBaseline,
      index,
      outcome: outcomeValue,
      outcomeLabel: outcomeLabel(outcomeValue),
      position: index + 1,
      relation: relationValue,
      targetDifference,
      targetFormatted: context.formatValue(targetValue, 'target', datum.x),
      targetValue,
      total: context.data.length,
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

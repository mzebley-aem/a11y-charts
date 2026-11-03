import type { A11yBarChartConfig, ResolvedA11yBarChartConfig } from './model.js';
import { canonicalLocaleOrDefault } from '../../chart-core/src/validation.js';

const defaults: ResolvedA11yBarChartConfig = {
  scaleMode: 'largest',
  inferTotal: true,
  dataView: 'dialog',
  tableVisibility: 'visible',
  showSummary: true,
  showContext: true,
  showActions: true,
  showExplanation: true,
  showGlossary: true,
  showExport: true,
  explanationExpanded: false,
  glossaryExpanded: false,
  showCounts: true,
  showPercentages: true,
  showTotal: true,
  showDetails: false,
  targetStyle: 'none',
  positiveDirection: 'above',
  locale: 'en-US',
  countDecimals: 0,
  percentageDecimals: 2,
  headingLevel: 2,
  announceChanges: true
};

function validLocale(value: unknown): string {
  return canonicalLocaleOrDefault(value, defaults.locale);
}

function decimals(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 20
    ? value
    : fallback;
}

export function resolveConfig(config: A11yBarChartConfig | null | undefined = undefined): ResolvedA11yBarChartConfig {
  if (!config || typeof config !== 'object') return { ...defaults };
  const tableVisibility = config.tableVisibility === 'hidden' || config.tableVisibility === 'screen-reader' || config.tableVisibility === 'visible'
    ? config.tableVisibility
    : config.showTable === false ? 'hidden' : defaults.tableVisibility;
  return {
    scaleMode: config.scaleMode === 'population-share' ? 'population-share' : 'largest',
    inferTotal: typeof config.inferTotal === 'boolean' ? config.inferTotal : defaults.inferTotal,
    ...(typeof config.scaleMaximum === 'number' && Number.isFinite(config.scaleMaximum) && config.scaleMaximum > 0
      ? { scaleMaximum: config.scaleMaximum }
      : {}),
    dataView: config.dataView === 'inline' ? 'inline' : 'dialog',
    tableVisibility,
    showSummary: typeof config.showSummary === 'boolean' ? config.showSummary : defaults.showSummary,
    showContext: typeof config.showContext === 'boolean' ? config.showContext : defaults.showContext,
    showActions: typeof config.showActions === 'boolean' ? config.showActions : defaults.showActions,
    showExplanation: typeof config.showExplanation === 'boolean' ? config.showExplanation : defaults.showExplanation,
    showGlossary: typeof config.showGlossary === 'boolean' ? config.showGlossary : defaults.showGlossary,
    showExport: typeof config.showExport === 'boolean' ? config.showExport : defaults.showExport,
    explanationExpanded: typeof config.explanationExpanded === 'boolean' ? config.explanationExpanded : defaults.explanationExpanded,
    glossaryExpanded: typeof config.glossaryExpanded === 'boolean' ? config.glossaryExpanded : defaults.glossaryExpanded,
    showCounts: typeof config.showCounts === 'boolean' ? config.showCounts : defaults.showCounts,
    showPercentages: typeof config.showPercentages === 'boolean' ? config.showPercentages : defaults.showPercentages,
    showTotal: typeof config.showTotal === 'boolean' ? config.showTotal : defaults.showTotal,
    showDetails: typeof config.showDetails === 'boolean' ? config.showDetails : defaults.showDetails,
    targetStyle: config.targetStyle === 'color' || config.targetStyle === 'texture' || config.targetStyle === 'color-and-texture' ? config.targetStyle : 'none',
    positiveDirection: config.positiveDirection === 'below' ? 'below' : 'above',
    locale: validLocale(config.locale),
    countDecimals: decimals(config.countDecimals, defaults.countDecimals),
    percentageDecimals: decimals(config.percentageDecimals, defaults.percentageDecimals),
    headingLevel: Number.isInteger(config.headingLevel) && config.headingLevel! >= 1 && config.headingLevel! <= 6
      ? config.headingLevel!
      : defaults.headingLevel,
    announceChanges: typeof config.announceChanges === 'boolean' ? config.announceChanges : defaults.announceChanges
  };
}

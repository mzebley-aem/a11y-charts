import type { A11yBarChartConfig, A11yBarChartDatum, A11yBarChartTheme, A11yBarChartValueFormatter } from './model.js';
import type { MessageDictionary } from './messages.js';

/** One synchronous, already-prepared population view. IDs must be stable across locale changes. */
export interface A11yBarChartPreparedView {
  id: string;
  label: string;
  definition?: string;
  chartTitle: string;
  explanation?: string;
  emptyMessage?: string;
  context?: string;
  dataNote?: string;
  data: readonly A11yBarChartDatum[];
  total: number | null;
  suppressed: boolean;
  filtered: boolean;
  scaleMaximum?: number;
}

export interface A11yBarChartViewSection {
  id: string;
  label: string;
  description?: string;
  allViewId: string;
  views: readonly A11yBarChartPreparedView[];
}

export interface A11yBarChartGroupMessages {
  selectorLabel?: string;
  collapseSection?: string;
  expandSection?: string;
  empty?: string;
  invalid?: string;
  selectionStatus?: string;
}

export interface A11yBarChartGroupSelectionChangeDetail {
  sectionId: string;
  viewId: string;
  origin: 'user' | 'fallback' | 'property';
}

export type PreparedBarView = A11yBarChartPreparedView;
export type BarViewSection = A11yBarChartViewSection;

import type {
  A11yLineChartBaseline,
  A11yLineChartConfig,
  A11yLineChartDatum,
  A11yLineChartDefinition,
  A11yLineChartTheme,
  A11yLineChartValuePreset
} from '../packages/line-chart/src/model.js';
import type {
  A11yBarChartConfig,
  A11yBarChartDatum,
  A11yBarChartTheme
} from '../packages/bar-chart/src/model.js';

interface GalleryExampleBase {
  id: string;
  title: string;
  description: string;
  reviewHint: string;
  context?: string;
  dataNote?: string;
  /** The host has already replaced protected values with 0. */
  suppressed?: boolean;
}

export interface LineChartGalleryExample extends GalleryExampleBase {
  kind: 'line';
  data: A11yLineChartDatum[];
  config: A11yLineChartConfig;
  baseline?: A11yLineChartBaseline;
  valuePreset?: A11yLineChartValuePreset;
  theme?: A11yLineChartTheme;
  definitions?: A11yLineChartDefinition[];
}

export interface BarChartGalleryExample extends GalleryExampleBase {
  kind: 'bar';
  data: A11yBarChartDatum[];
  config: A11yBarChartConfig;
  total?: number;
  theme?: A11yBarChartTheme;
}

export type ChartGalleryExample = LineChartGalleryExample | BarChartGalleryExample;

/** Fictional examples chosen to exercise public chart settings and reviewable visual states. */
export const chartGalleryExamples: ChartGalleryExample[] = [
  {
    id: 'line-higher-is-better-baseline',
    kind: 'line',
    title: 'Preventive care visits',
    description: 'A percentage measure with a year-over-year baseline and a higher-is-better target.',
    reviewHint: 'Check baseline comparison language, percent formatting, and how the target outcome reads alongside the trend.',
    valuePreset: 'percent',
    baseline: { x: '2021', value: 64, explanation: 'This is the first reporting year and the reference point for later comparisons.' },
    data: [
      { x: '2021', actual: 64, target: 70 },
      { x: '2022', actual: 68, target: 70 },
      { x: '2023', actual: 73, target: 72 },
      { x: '2024', actual: 77, target: 74 },
      { x: '2025', actual: 81, target: 76 }
    ],
    config: {
      positiveDirection: 'above', valuePreset: 'percent', baselineSeriesLabel: 'Plan start',
      showSummary: true, showContext: true, showActions: true, showExplanation: true,
      showControls: false, dataView: 'dialog', trendMode: 'labels'
    },
    context: 'The fictional North Valley network tracks completed annual preventive visits among eligible members.',
    dataNote: 'Percentages are rounded to whole numbers.'
  },
  {
    id: 'line-lower-is-better-numeric',
    kind: 'line',
    title: 'Water service interruptions',
    description: 'A numeric rate where values below the target indicate better performance.',
    reviewHint: 'Try Zoom Y-axis to see small changes in the interruption rate, then restore the full scale. Below-target values meet the goal.',
    valuePreset: 'number',
    data: [
      { x: '2021', actual: 4.8, target: 4.2 },
      { x: '2022', actual: 4.4, target: 4.1 },
      { x: '2023', actual: 3.9, target: 4.0 },
      { x: '2024', actual: 3.6, target: 3.9 },
      { x: '2025', actual: 3.2, target: 3.8 }
    ],
    config: {
      positiveDirection: 'below', valuePreset: 'number', decimalPlaces: 1, axisDecimalPlaces: 1,
      actualSeriesLabel: 'Interruptions per 1,000 accounts', targetSeriesLabel: 'Maximum rate',
      yAxisTitle: 'Interruptions per 1,000 accounts', showSummary: true,
      showActions: true, trendMode: 'arrows'
    },
    context: 'Lower rates mean fewer customers lose service. Values describe a fictional utility service area.'
  },
  {
    id: 'line-target-ranges',
    kind: 'line',
    title: 'Community response time',
    description: 'A target range shows acceptable response-time bounds for each reporting period.',
    reviewHint: 'Inspect interval labels and the narrative for values inside, below, and above a range.',
    valuePreset: 'number',
    data: [
      { x: 'Jan', actual: 18, target: { min: 20, max: 28 } },
      { x: 'Feb', actual: 24, target: { min: 20, max: 28 } },
      { x: 'Mar', actual: 31, target: { min: 21, max: 29 } },
      { x: 'Apr', actual: 26, target: { min: 21, max: 29 } },
      { x: 'May', actual: 22, target: { min: 21, max: 29 } }
    ],
    config: {
      positiveDirection: 'above', valuePreset: 'number', decimalPlaces: 0,
      actualSeriesLabel: 'Median minutes', targetSeriesLabel: 'Acceptable range',
      xAxisTitle: 'Month', yAxisTitle: 'Minutes', showSummary: true,
      showActions: true, showExplanation: true
    },
    context: 'Each range is the service team’s acceptable interval. Shorter response times are not automatically better below the lower bound.'
  },
  {
    id: 'line-missing-and-suppressed',
    kind: 'line',
    title: 'School meal participation',
    description: 'A missing observation and a privacy-suppressed observation are reported differently.',
    reviewHint: 'Check how missing and suppressed periods are announced and that the chart does not imply fabricated values.',
    valuePreset: 'percent',
    data: [
      { x: '2021', actual: 42, target: 45 },
      { x: '2022', actual: null, target: 47 },
      { x: '2023', actual: 49, target: 48 },
      { x: '2024', actual: 0, target: 50 },
      { x: '2025', actual: 56, target: null }
    ],
    config: {
      positiveDirection: 'above', valuePreset: 'percent', autoDetectGaps: true,
      showSummary: true, showActions: true, showExplanation: true,
      describeMissingAs: 'not reported'
    },
    suppressed: true,
    context: 'Participation is fictional. A small 2024 cohort is suppressed to protect student privacy.',
    dataNote: 'A blank target means the target was unavailable. The 2024 value was replaced with zero before it reached the chart, and the chart is flagged as suppressed.'
  },
  {
    id: 'line-compact-inline',
    kind: 'line',
    title: 'Library program attendance',
    description: 'A compact line chart pairs its visualization with an inline data table.',
    reviewHint: 'Review the narrow composition, inline table disclosure, and long period labels.',
    valuePreset: 'number',
    data: [
      { x: 'Fall 2023', actual: 124, target: 120 },
      { x: 'Spring 2024', actual: 139, target: 130 },
      { x: 'Fall 2024', actual: 151, target: 140 },
      { x: 'Spring 2025', actual: 148, target: 150 }
    ],
    config: {
      positiveDirection: 'above', valuePreset: 'number', decimalPlaces: 0,
      xAxisTitle: 'School term', yAxisTitle: 'Visits', showActions: true,
      showSummary: true, showExplanation: false, showGlossary: true, glossaryExpanded: false, dataView: 'inline', showControls: false, autoPerPointMinWidth: true
    },
    definitions: [
      { id: 'term', label: 'School term', definition: 'One fall or spring teaching period.' },
      { id: 'visit', label: 'Program visit', definition: 'One attendee visit to a free after-school library program.' }
    ],
    context: 'Counts include fictional visits to free after-school library programs.',
    dataNote: 'Each period covers one school term.'
  },
  {
    id: 'bar-counts-with-details',
    kind: 'bar',
    title: 'Requests completed on time',
    description: 'Counts are paired with accessible category details and numeric targets.',
    reviewHint: 'Open a row’s details by hover, focus, or activation; compare the text outcome with the bar treatment.',
    data: [
      { id: 'permits', label: 'Building permits', value: 184, target: 170, definition: 'Permit requests completed within the published service window.' },
      { id: 'licenses', label: 'Business licenses', value: 132, target: 145, definition: 'License requests completed within the published service window.' },
      { id: 'records', label: 'Public records', value: 96, target: 90, definition: 'Records requests completed within the published service window.' },
      { id: 'inspections', label: 'Safety inspections', value: 111, target: 105, definition: 'Inspection requests completed within the published service window.' }
    ],
    config: {
      scaleMode: 'largest', showCounts: true, showPercentages: false, showTotal: false,
      showDetails: true, targetStyle: 'color-and-texture', positiveDirection: 'above',
      showSummary: true, showActions: true, showExplanation: true, dataView: 'dialog'
    },
    context: 'Fictional service requests recorded by a city operations team.',
    dataNote: 'Counts represent requests completed during the latest quarter.'
  },
  {
    id: 'bar-population-share-total',
    kind: 'bar',
    title: 'Household energy sources',
    description: 'Category shares use an explicit population total and show both counts and percentages.',
    reviewHint: 'Verify that displayed shares sum to the stated total and that the scale communicates part-to-whole proportions.',
    total: 5000,
    data: [
      { id: 'electric', label: 'Electricity', value: 3120 },
      { id: 'gas', label: 'Natural gas', value: 1260 },
      { id: 'other', label: 'Other reported source', value: 620 }
    ],
    config: {
      scaleMode: 'population-share', showCounts: true, showPercentages: true, showTotal: true,
      showSummary: true, showActions: true, showExport: true, dataView: 'dialog'
    },
    theme: { color: '#31688e', track: '#e5edf2', surface: '#ffffff', muted: '#465766' },
    context: 'Fictional survey responses from 5,000 households; categories are mutually exclusive.'
  },
  {
    id: 'bar-target-ranges-patterns',
    kind: 'bar',
    title: 'Neighborhood tree coverage',
    description: 'Target intervals and contrasting patterns show a mix of below-range, in-range, and above-range results.',
    reviewHint: 'Inspect both target-range endpoints, the accessible outcome text, and texture contrast in forced colors.',
    data: [
      { id: 'central', label: 'Central neighborhood', value: 18, target: { min: 20, max: 28 } },
      { id: 'riverside', label: 'Riverside neighborhood', value: 24, target: { min: 20, max: 28 } },
      { id: 'north', label: 'North neighborhood', value: 32, target: { min: 21, max: 29 } },
      { id: 'south', label: 'South neighborhood', value: 27, target: { min: 21, max: 29 } }
    ],
    config: {
      scaleMode: 'largest', showCounts: true, showPercentages: false,
      targetStyle: 'color-and-texture', positiveDirection: 'above',
      showSummary: true, showActions: true, showExplanation: true
    },
    theme: {
      color: '#287c72', targetColor: '#574b90', patternType: 'diagonal',
      patternColor: '#173c53', track: '#edf1f2', focus: '#005fcc'
    },
    context: 'Coverage values are fictional percentages. The acceptable band varies slightly by neighborhood.'
  },
  {
    id: 'bar-suppression-and-missing',
    kind: 'bar',
    title: 'Community clinic referrals',
    description: 'Reported, missing, and privacy-suppressed counts are each described differently.',
    reviewHint: 'Check row narratives for missing and suppressed observations.',
    data: [
      { id: 'east', label: 'East clinic', value: 42, target: 38 },
      { id: 'west', label: 'West clinic', value: null, target: 35 },
      { id: 'central', label: 'Central clinic', value: 0, target: 20 },
      { id: 'mobile', label: 'Mobile clinic', value: 31, target: null }
    ],
    config: {
      scaleMode: 'largest', showCounts: true, showPercentages: false,
      targetStyle: 'texture', positiveDirection: 'above',
      showSummary: true, showContext: true, showActions: true
    },
    suppressed: true,
    context: 'Referral counts are fictional. Small counts are withheld when they could identify individual patients.',
    dataNote: 'The West clinic value was not reported; the Central clinic value was suppressed.'
  },
  {
    id: 'bar-long-labels-inline',
    kind: 'bar',
    title: 'Public improvement commitments',
    description: 'Long category labels and definitions are paired with an inline table for small layouts.',
    reviewHint: 'Review wrapping, details-card placement, and whether every long label remains distinguishable.',
    data: [
      { id: 'accessible-entrances', label: 'Install step-free entrances at all neighborhood service locations', value: 7, target: 8, definition: 'Number of locations upgraded to provide a step-free public entrance.' },
      { id: 'translated-forms', label: 'Publish translated application forms for the five most requested languages', value: 5, target: 5, definition: 'Language versions published for the most commonly requested application forms.' },
      { id: 'evening-hours', label: 'Extend evening service hours at community support centers', value: 3, target: 4, definition: 'Community centers offering service outside standard business hours.' },
      { id: 'online-status', label: 'Provide online status updates for submitted service requests', value: 9, target: 7, definition: 'Request types with a public online status-tracking page.' }
    ],
    config: {
      scaleMode: 'largest', showCounts: true, showPercentages: false,
      showDetails: true, targetStyle: 'color', positiveDirection: 'above',
      showSummary: false, showActions: true, showExplanation: true,
      dataView: 'inline'
    },
    theme: { color: '#3c6e71', track: '#e3eceb', border: '#304b4d', focus: '#005fcc' },
    context: 'Fictional commitments from a municipal service-accessibility plan.',
    dataNote: 'Progress values are counts of completed commitments or service types.'
  }
];

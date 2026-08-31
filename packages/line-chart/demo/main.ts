import '../src/define.ts';
import '../src/styles.css';
import type { A11yLineChartElement } from '../src/index.ts';
import './page.css';

const charts = document.querySelectorAll<A11yLineChartElement>('a11y-line-chart');

const config = {
  announceChanges: true,
  autoDetectGaps: true,
  axisDecimalPlaces: 0,
  decimalPlaces: 2,
  describeMissingAs: '-',
  tableVisibility: 'screen-reader' as const,
  wrapAround: true
};

const data = [
  [
    { x: 2015, actual: 40.00, target: 80.00 },
    { x: 2016, actual: 68.90, target: 80.00 },
    { x: 2017, actual: 70.32, target: 80.00 },
    { x: 2018, actual: 69.06, target: 80.00 },
    { x: 2019, actual: 72.51, target: 80.00 },
    { x: 2020, actual: 83.92, target: 77.02 },
    { x: 2021, target: 78.27 },
    { x: 2022, target: 79.52 },
    { x: 2023, target: 80.77 },
    { x: 2024, target: 82.02 },
    { x: 2025, target: 83.27 }
  ],
  [
    { x: 2015, actual: 57.12, target: 80.00 },
    { x: 2016, actual: 64.15, target: 80.00 },
    { x: 2017, actual: 65.34, target: 80.00 },
    { x: 2018, actual: 63.53, target: 80.00 },
    { x: 2019, actual: 64.26, target: 80.00 },
    { x: 2020, actual: 70.78, target: 70.78 },
    { x: 2021, target: 70.78 },
    { x: 2022, target: 70.78 },
    { x: 2023, target: 70.78 },
    { x: 2024, target: 72.30 },
    { x: 2025, target: 73.50 }
  ]
];

charts.forEach((chart, index) => {
  chart.config = {
    ...config,
    contextNote: index === 0
      ? 'Targets after 2020 are planned values; actual results have not yet been reported.'
      : ''
  };
  chart.baseline = index === 0
    ? {
        x: 2015,
        value: 38,
        explanation: 'A policy and reporting-strategy change took effect in 2015, so earlier results are not comparable.'
      }
    : {
        x: 2015,
        value: 55,
        explanation: 'The 2015 reporting methodology defines the comparison boundary for this measure.'
      };
  chart.data = data[index] ?? [];
});

import type { A11yLineChartDatum } from '../../packages/line-chart/src/model.js';
export interface Measure {
  id: string;
  title: string;
  actual: number;
  target: number;
  previous: number;
  direction: 'above' | 'below';
  count: number;
  baseline?: { year: number; value: number };
  history?: A11yLineChartDatum[];
}
export interface Indicator {
  id: string;
  title: string;
  population: string;
  total: number;
  description: string;
  measurement: string;
  measures: Measure[];
  categories: [string, number][];
  notes: string[];
}
const history = (actual: number[], target: number[]) =>
  actual.map((value, i) => ({
    x: String(2018 + i),
    actual: value,
    target: target[i],
  }));
export const indicators: Indicator[] = [
  {
    id: '2',
    title: 'Drop Out',
    population: 'Youth with IEPs, ages 14–21, who exited special education',
    total: 4130,
    description:
      'How many youth with disabilities leave school by dropping out?',
    measurement:
      'The drop out rate is the number of youth with IEPs ages 14–21 who exited special education by dropping out, divided by all youth with IEPs in this age group who exited for any reported reason, multiplied by 100.',
    measures: [
      {
        id: '2',
        title: 'Drop out rate',
        actual: 7.72,
        target: 8,
        previous: 7.95,
        direction: 'below',
        count: 319,
        baseline: { year: 2018, value: 8.9 },
        history: history(
          [8.9, 8.4, 7.1, 8, 7.95, 7.72],
          [9, 8.8, 8.6, 8.4, 8.2, 8],
        ),
      },
    ],
    categories: [
      ['Regular high school diploma', 3715],
      ['State-defined alternate diploma', 21],
      ['Certificate', 61],
      ['Reached maximum age', 14],
      ['Dropped out', 319],
    ],
    notes: [
      'Values transcribed from Ind2.pdf, pages 2–6. Rates use the percentages printed in the example; counts and rounded rates may differ slightly.',
    ],
  },
  {
    id: '5',
    title: 'Education Environments',
    population: 'Children with IEPs, age 5 in kindergarten through age 21',
    total: 71532,
    description:
      'Where do school-age children with disabilities receive special education and related services?',
    measurement:
      'Each measure divides the number of children served in the specified environment by all children with IEPs age 5 in kindergarten through age 21, multiplied by 100. These three measures do not include every educational environment.',
    measures: [
      {
        id: '5A',
        title: 'Inside the regular class 80% or more of the day',
        actual: 71.32,
        target: 58.45,
        previous: 65.54,
        direction: 'above',
        count: 51017,
        baseline: { year: 2018, value: 68.4 },
        history: history(
          [68.4, 69.1, 69.8, 70.2, 65.54, 71.32],
          [68, 68.5, 69, 69.5, 70, 58.45],
        ),
      },
      {
        id: '5B',
        title: 'Inside the regular class less than 40% of the day',
        actual: 10.16,
        target: 11.78,
        previous: 10.74,
        direction: 'below',
        count: 7269,
      },
      {
        id: '5C',
        title:
          'Separate schools, residential facilities, or homebound/hospital placements',
        actual: 1.65,
        target: 1.99,
        previous: 1.79,
        direction: 'below',
        count: 1180,
      },
    ],
    categories: [
      ['Regular class 80% or more of the day', 51017],
      ['Regular class less than 40% of the day', 7269],
      ['Separate schools', 325],
      ['Residential facilities', 582],
      ['Homebound/hospital placements', 273],
    ],
    notes: [
      'Values transcribed from Ind5.pdf, pages 2–7. Baselines and earlier trends for 5B and 5C are not provided; the source uses “x” placeholders.',
      'Listed categories account for 59,466 of 71,532 children. The remaining 12,066 are not categorized in the supplied example. No additional category has been inferred.',
    ],
  },
  {
    id: '6',
    title: 'Preschool Environments',
    population: 'Preschool children with IEPs, ages 3–5',
    total: 10244,
    description:
      'Where do preschool children with disabilities receive special education and related services?',
    measurement:
      'Each measure divides the number of preschool children served in the specified environment by all children with IEPs ages 3–5, multiplied by 100. Measure A includes children attending a regular early childhood program and receiving the majority of their services there.',
    measures: [
      {
        id: '6A',
        title:
          'Regular early childhood program, with most services received there',
        actual: 23.11,
        target: 23.53,
        previous: 17.89,
        direction: 'above',
        count: 2367,
        baseline: { year: 2020, value: 21.5 },
        history: history(
          [20.9, 21.2, 21.5, 22.1, 17.89, 23.11],
          [20.5, 21, 21.5, 22, 22.5, 23.53],
        ),
      },
      {
        id: '6B',
        title:
          'Separate special education class, separate school, or residential facility',
        actual: 28.12,
        target: 18.29,
        previous: 27.58,
        direction: 'below',
        count: 2881,
      },
      {
        id: '6C',
        title: 'Special education and related services in the home',
        actual: 0.15,
        target: 0.96,
        previous: 0.23,
        direction: 'below',
        count: 15,
      },
    ],
    categories: [
      ['Regular early childhood program, with most services there', 2367],
      ['Separate special education class', 87],
      ['Separate school', 2790],
      ['Residential facility', 4],
      ['Services in the home', 15],
    ],
    notes: [
      'Values transcribed from Ind6.pdf, pages 2–8. The 6B summary prints a 28.12% target, while its detailed comparison and narrative use 18.29%. This mockup uses 18.29%; confirm before publication.',
      'The source labels all measures “No Slippage,” although 6B increases from 27.58% to 28.12% where lower is better. This mockup describes the change without assigning an official slippage determination.',
      'Listed categories account for 5,263 of 10,244 children. The remaining 4,981 are not categorized in the example. Baselines and earlier trends for 6B and 6C are unavailable. The 2020 baseline for 6A appears in text; it is not drawn as a 2018 baseline.',
    ],
  },
];
